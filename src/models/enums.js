'use strict';
/**
 * Enums do domínio (equivalentes aos enums de models.py).
 */
const Role = Object.freeze({
  ADMIN: 'ADMIN',
  ORGANIZER: 'ORGANIZER',
  CLIENT: 'CLIENT',
});

const TicketStatus = Object.freeze({
  AVAILABLE: 'AVAILABLE',
  RESERVED: 'RESERVED',
  SOLD: 'SOLD',
});

const OrderStatus = Object.freeze({
  PENDING: 'PENDING',
  PAID: 'PAID',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED',
});

module.exports = { Role, TicketStatus, OrderStatus };
