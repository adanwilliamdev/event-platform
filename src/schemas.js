'use strict';
/**
 * Schemas de validação (equivalentes aos DTOs Pydantic de schemas.py).
 * Usa Zod para validar os corpos de requisição.
 */
const { z } = require('zod');

// ---------- Auth ----------
const RegisterRequest = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(6).max(128),
});

const LoginRequest = z.object({
  email: z.string().email(),
  password: z.string(),
});

// ---------- Events ----------
const EventRequest = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(2000).optional().nullable(),
  date: z.coerce.date(),
  location: z.string().min(2).max(200),
  total_capacity: z.number().int().gt(0).lte(100000),
  ticket_price: z.number().gt(0),
});

// ---------- Tickets ----------
const TicketHoldRequest = z.object({
  ticket_id: z.string().min(1),
});

// ---------- Orders ----------
const OrderRequest = z.object({
  ticket_ids: z.array(z.string().min(1)).min(1),
});

module.exports = {
  RegisterRequest,
  LoginRequest,
  EventRequest,
  TicketHoldRequest,
  OrderRequest,
};
