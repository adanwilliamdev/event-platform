'use strict';
const { v4: uuidv4 } = require('uuid');
const { db } = require('../config/database');
const { OrderStatus } = require('./enums');

function nowIso() {
  return new Date().toISOString();
}

function create({ userId, totalAmount, status = OrderStatus.PENDING }) {
  const id = uuidv4();
  const ts = nowIso();
  db.prepare(
    `INSERT INTO orders (id, user_id, total_amount, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, userId, totalAmount, status, ts, ts);
  return findById(id);
}

function findById(id) {
  return db.prepare('SELECT * FROM orders WHERE id = ?').get(id) || null;
}

function findByPaymentIntent(paymentIntentId) {
  return (
    db.prepare('SELECT * FROM orders WHERE stripe_payment_intent = ?').get(paymentIntentId) ||
    null
  );
}

function findByUser(userId) {
  return db
    .prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC')
    .all(userId);
}

function setStripePaymentIntent(id, paymentIntentId) {
  db.prepare(
    `UPDATE orders SET stripe_payment_intent = ?, updated_at = ? WHERE id = ?`
  ).run(paymentIntentId, nowIso(), id);
  return findById(id);
}

function setStatus(id, status) {
  db.prepare(`UPDATE orders SET status = ?, updated_at = ? WHERE id = ?`).run(
    status,
    nowIso(),
    id
  );
  return findById(id);
}

module.exports = {
  create,
  findById,
  findByPaymentIntent,
  findByUser,
  setStripePaymentIntent,
  setStatus,
};
