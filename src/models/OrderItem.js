'use strict';
const { v4: uuidv4 } = require('uuid');
const { db } = require('../config/database');

function create({ orderId, ticketId, price }) {
  const id = uuidv4();
  db.prepare(
    `INSERT INTO order_items (id, order_id, ticket_id, price) VALUES (?, ?, ?, ?)`
  ).run(id, orderId, ticketId, price);
  return { id, order_id: orderId, ticket_id: ticketId, price };
}

function findByOrder(orderId) {
  return db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);
}

module.exports = { create, findByOrder };
