'use strict';
const crypto = require('crypto');
const OrderModel = require('../models/Order');
const OrderItemModel = require('../models/OrderItem');
const TicketModel = require('../models/Ticket');
const EventModel = require('../models/Event');
const { TicketStatus, OrderStatus } = require('../models/enums');
const { HttpError } = require('../utils/errors');
const { generateQrCodeBase64 } = require('../utils/qr');
const ticketService = require('./ticketService');

const STRIPE_SECRET_KEY = (process.env.STRIPE_SECRET_KEY || '').trim();

let _stripe = null;
if (STRIPE_SECRET_KEY) {
  try {
    // Dependência opcional: só é necessária se STRIPE_SECRET_KEY estiver configurada.
    const Stripe = require('stripe');
    _stripe = new Stripe(STRIPE_SECRET_KEY);
  } catch (err) {
    _stripe = null;
  }
}

function shortId() {
  return crypto.randomBytes(12).toString('hex');
}

async function createOrder(data, user) {
  const tickets = [];
  let totalAmount = 0;

  for (const ticketId of data.ticket_ids) {
    const ticket = TicketModel.findById(ticketId);
    if (!ticket) {
      throw new HttpError(404, `Ingresso não encontrado: ${ticketId}`);
    }
    if (ticket.status !== TicketStatus.RESERVED || ticket.reserved_by !== user.id) {
      throw new HttpError(
        409,
        `Ingresso não está reservado para este usuário: ${ticketId}`
      );
    }
    tickets.push(ticket);
    totalAmount += Number(ticket.price);
  }

  let order = OrderModel.create({
    userId: user.id,
    totalAmount,
    status: OrderStatus.PENDING,
  });

  for (const ticket of tickets) {
    OrderItemModel.create({ orderId: order.id, ticketId: ticket.id, price: ticket.price });
  }

  let paymentIntentId = null;
  let clientSecret = null;
  let demoMode = true;

  if (_stripe !== null) {
    try {
      const intent = await _stripe.paymentIntents.create({
        amount: Math.round(totalAmount * 100),
        currency: 'usd',
        metadata: { orderId: order.id, userId: user.id },
      });
      paymentIntentId = intent.id;
      clientSecret = intent.client_secret;
      demoMode = false;
    } catch (exc) {
      throw new HttpError(502, `Falha ao criar pagamento no Stripe: ${exc.message || exc}`);
    }
  }

  if (paymentIntentId === null) {
    paymentIntentId = `pi_demo_${shortId()}`;
    clientSecret = `${paymentIntentId}_secret_${shortId().slice(0, 16)}`;
  }
  order = OrderModel.setStripePaymentIntent(order.id, paymentIntentId);

  const event = EventModel.findById(tickets[0].event_id);

  return {
    order_id: order.id,
    total_amount: totalAmount,
    payment_intent_id: paymentIntentId,
    client_secret: clientSecret,
    status: order.status,
    created_at: order.created_at,
    event_title: event ? event.title : null,
    seats: tickets.map((t) => t.seat_number),
    demo_mode: demoMode,
  };
}

function getOrder(orderId, user) {
  const order = OrderModel.findById(orderId);
  if (!order) {
    throw new HttpError(404, `Pedido não encontrado: ${orderId}`);
  }
  if (order.user_id !== user.id) {
    throw new HttpError(403, 'Este pedido não pertence a este usuário');
  }
  return mapDetail(order);
}

function getMyOrders(user) {
  return OrderModel.findByUser(user.id).map((o) => mapDetail(o));
}

async function confirmPayment(orderId, user) {
  const order = OrderModel.findById(orderId);
  if (!order) {
    throw new HttpError(404, 'Pedido não encontrado');
  }
  if (order.user_id !== user.id) {
    throw new HttpError(403, 'Este pedido não pertence a este usuário');
  }
  if (order.status === OrderStatus.PAID) {
    return mapDetail(order);
  }
  if (order.status !== OrderStatus.PENDING) {
    throw new HttpError(409, 'Pedido não pode mais ser pago');
  }

  await processSuccessfulPayment(order.stripe_payment_intent);
  const refreshed = OrderModel.findById(orderId);
  return mapDetail(refreshed);
}

async function processSuccessfulPayment(paymentIntentId) {
  const order = OrderModel.findByPaymentIntent(paymentIntentId);
  if (!order) {
    throw new HttpError(404, 'Pedido não encontrado para este pagamento');
  }

  OrderModel.setStatus(order.id, OrderStatus.PAID);

  const items = OrderItemModel.findByOrder(order.id);
  for (const item of items) {
    await ticketService.confirmTicketSale(item.ticket_id, order.id);
  }
}

function mapDetail(order) {
  const orderItems = OrderItemModel.findByOrder(order.id);
  const items = orderItems.map((oi) => {
    const ticket = TicketModel.findById(oi.ticket_id);
    const event = ticket ? EventModel.findById(ticket.event_id) : null;
    return {
      _ticket: ticket,
      _event: event,
      seat_number: ticket ? ticket.seat_number : '?',
      price: Number(oi.price),
      event_title: event ? event.title : null,
      event_date: event ? event.date : null,
      event_location: event ? event.location : null,
    };
  });

  const eventTitle = items.length > 0 ? items[0].event_title : null;

  return {
    order_id: order.id,
    total_amount: Number(order.total_amount),
    payment_intent_id: order.stripe_payment_intent,
    status: order.status,
    created_at: order.created_at,
    event_title: eventTitle,
    seats: items.map((i) => i.seat_number),
    demo_mode: _stripe === null,
    items: items.map(({ _ticket, _event, ...rest }) => rest),
  };
}

/**
 * Gera QR codes para os itens de um pedido pago. Feito de forma assíncrona
 * e separada de mapDetail (que é síncrono) porque a geração de QR code é
 * assíncrona nesta implementação em Node.
 */
async function attachQrCodes(detail) {
  if (detail.status !== OrderStatus.PAID) {
    return detail;
  }
  const itemsWithQr = [];
  for (const item of detail.items) {
    const qr = await generateQrCodeBase64(
      `EVENTPLATFORM|order=${detail.order_id}|seat=${item.seat_number}|event=${item.event_title}`
    );
    itemsWithQr.push({ ...item, qr_code_base64: qr });
  }
  return { ...detail, items: itemsWithQr };
}

module.exports = {
  createOrder,
  getOrder,
  getMyOrders,
  confirmPayment,
  processSuccessfulPayment,
  attachQrCodes,
};
