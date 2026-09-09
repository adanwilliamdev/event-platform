'use strict';
const EventModel = require('../models/Event');
const TicketModel = require('../models/Ticket');
const UserModel = require('../models/User');
const { TicketStatus } = require('../models/enums');
const { HttpError } = require('../utils/errors');

function createEvent(data, organizer) {
  const event = EventModel.create({
    title: data.title,
    description: data.description ?? null,
    date: data.date.toISOString(),
    location: data.location,
    organizerId: organizer.id,
    totalCapacity: data.total_capacity,
    availableTickets: data.total_capacity,
  });

  const rows = [];
  for (let i = 1; i <= data.total_capacity; i++) {
    rows.push({
      eventId: event.id,
      seatNumber: `SEAT-${i}`,
      price: data.ticket_price,
      status: TicketStatus.AVAILABLE,
    });
  }
  TicketModel.createMany(rows);

  return mapToResponse(event, { ticketPrice: data.ticket_price });
}

function getAllEvents() {
  return EventModel.findAll().map((e) => mapToResponse(e));
}

function getUpcomingEvents() {
  const nowIso = new Date().toISOString();
  return EventModel.findUpcoming(nowIso).map((e) => mapToResponse(e));
}

function getEvent(eventId) {
  const event = EventModel.findById(eventId);
  if (!event) {
    throw new HttpError(404, 'Evento não encontrado');
  }
  return mapToResponse(event);
}

function mapToResponse(event, { ticketPrice } = {}) {
  const available = TicketModel.countAvailableByEvent(event.id);
  let price = ticketPrice;
  if (price === undefined || price === null) {
    const firstTicket = TicketModel.findFirstByEvent(event.id);
    price = firstTicket ? firstTicket.price : null;
  }

  const organizer = UserModel.findById(event.organizer_id);

  return {
    id: event.id,
    title: event.title,
    description: event.description,
    date: event.date,
    location: event.location,
    organizer_id: event.organizer_id,
    organizer_name: organizer ? organizer.name : '',
    total_capacity: event.total_capacity,
    available_tickets: available,
    cover_seed: event.cover_seed,
    ticket_price: price === null || price === undefined ? null : Number(price),
  };
}

module.exports = { createEvent, getAllEvents, getUpcomingEvents, getEvent };
