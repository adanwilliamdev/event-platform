'use strict';
const TicketModel = require('../models/Ticket');
const { TicketStatus } = require('../models/enums');
const { HttpError } = require('../utils/errors');
const { withTicketLock } = require('../utils/locks');
const { manager } = require('../utils/wsManager');

const HOLD_DURATION_MINUTES = 10;

async function holdTicket(data, user) {
  const ticket = await withTicketLock(data.ticket_id, () => {
    const t = TicketModel.findById(data.ticket_id);
    if (!t) {
      throw new HttpError(404, 'Ingresso não encontrado');
    }
    if (t.status !== TicketStatus.AVAILABLE) {
      throw new HttpError(409, `Ingresso indisponível. Status atual: ${t.status}`);
    }

    return TicketModel.updateStatus(t.id, {
      status: TicketStatus.RESERVED,
      reservedAt: new Date().toISOString(),
      reservedBy: user.id,
    });
  });

  await broadcastAvailability(ticket);

  return {
    ticket_id: ticket.id,
    seat_number: ticket.seat_number,
    price: Number(ticket.price),
    hold_expiration: new Date(Date.now() + HOLD_DURATION_MINUTES * 60 * 1000).toISOString(),
  };
}

async function releaseTicketHold(ticketId) {
  const ticket = await withTicketLock(ticketId, () => {
    const t = TicketModel.findById(ticketId);
    if (!t) {
      throw new HttpError(404, 'Ingresso não encontrado');
    }
    if (t.status !== TicketStatus.RESERVED) {
      return null; // nada a fazer, igual ao early-return do Python
    }

    return TicketModel.updateStatus(t.id, {
      status: TicketStatus.AVAILABLE,
      reservedAt: null,
      reservedBy: null,
    });
  });

  if (ticket) {
    await broadcastAvailability(ticket);
  }
}

async function confirmTicketSale(ticketId, orderId) {
  const ticket = await withTicketLock(ticketId, () => {
    const t = TicketModel.findById(ticketId);
    if (!t) {
      throw new HttpError(404, 'Ingresso não encontrado');
    }
    if (t.status !== TicketStatus.RESERVED) {
      throw new HttpError(409, 'Ingresso precisa estar reservado antes da venda');
    }

    return TicketModel.updateStatus(t.id, {
      status: TicketStatus.SOLD,
      orderId,
      bumpVersion: false,
    });
  });

  await broadcastAvailability(ticket);
}

function getAvailableTickets(eventId) {
  return TicketModel.findAvailableByEvent(eventId).map((t) => ({
    id: t.id,
    seat_number: t.seat_number,
    price: Number(t.price),
    status: t.status,
  }));
}

function findExpiredReservations() {
  const expirationTime = new Date(
    Date.now() - HOLD_DURATION_MINUTES * 60 * 1000
  ).toISOString();
  return TicketModel.findExpiredReservations(expirationTime);
}

async function broadcastAvailability(ticket) {
  const availableCount = TicketModel.countAvailableByEvent(ticket.event_id);
  const update = {
    event_id: ticket.event_id,
    ticket_id: ticket.id,
    seat_number: ticket.seat_number,
    status: ticket.status,
    available_count: availableCount,
  };
  manager.broadcast(ticket.event_id, update);
}

module.exports = {
  HOLD_DURATION_MINUTES,
  holdTicket,
  releaseTicketHold,
  confirmTicketSale,
  getAvailableTickets,
  findExpiredReservations,
};
