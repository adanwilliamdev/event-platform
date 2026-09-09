'use strict';
const { v4: uuidv4 } = require('uuid');
const { db } = require('../config/database');
const { TicketStatus } = require('./enums');

function create({ eventId, seatNumber, price, status = TicketStatus.AVAILABLE }) {
  const id = uuidv4();
  db.prepare(
    `INSERT INTO tickets (id, event_id, seat_number, price, status, version)
     VALUES (?, ?, ?, ?, ?, 0)`
  ).run(id, eventId, seatNumber, price, status);
  return findById(id);
}

function createMany(rows) {
  const insert = db.prepare(
    `INSERT INTO tickets (id, event_id, seat_number, price, status, version)
     VALUES (?, ?, ?, ?, ?, 0)`
  );
  // node:sqlite não tem um helper db.transaction() como o better-sqlite3;
  // fazemos a transação manualmente com BEGIN/COMMIT/ROLLBACK.
  db.exec('BEGIN');
  try {
    for (const item of rows) {
      insert.run(
        uuidv4(),
        item.eventId,
        item.seatNumber,
        item.price,
        item.status || TicketStatus.AVAILABLE
      );
    }
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

function findById(id) {
  return db.prepare('SELECT * FROM tickets WHERE id = ?').get(id) || null;
}

function findFirstByEvent(eventId) {
  return (
    db.prepare('SELECT * FROM tickets WHERE event_id = ? LIMIT 1').get(eventId) || null
  );
}

function countAvailableByEvent(eventId) {
  return db
    .prepare(
      `SELECT COUNT(*) AS c FROM tickets WHERE event_id = ? AND status = ?`
    )
    .get(eventId, TicketStatus.AVAILABLE).c;
}

function findAvailableByEvent(eventId) {
  return db
    .prepare(
      `SELECT * FROM tickets WHERE event_id = ? AND status = ? ORDER BY seat_number ASC`
    )
    .all(eventId, TicketStatus.AVAILABLE);
}

function findExpiredReservations(expirationIso) {
  return db
    .prepare(
      `SELECT * FROM tickets WHERE status = ? AND reserved_at IS NOT NULL AND reserved_at < ?`
    )
    .all(TicketStatus.RESERVED, expirationIso);
}

function updateStatus(id, { status, reservedAt, reservedBy, orderId, bumpVersion = true }) {
  const current = findById(id);
  if (!current) return null;
  const newVersion = bumpVersion ? (current.version || 0) + 1 : current.version;
  db.prepare(
    `UPDATE tickets
     SET status = ?, reserved_at = ?, reserved_by = ?, order_id = COALESCE(?, order_id), version = ?
     WHERE id = ?`
  ).run(
    status,
    reservedAt === undefined ? current.reserved_at : reservedAt,
    reservedBy === undefined ? current.reserved_by : reservedBy,
    orderId === undefined ? null : orderId,
    newVersion,
    id
  );
  return findById(id);
}

module.exports = {
  create,
  createMany,
  findById,
  findFirstByEvent,
  countAvailableByEvent,
  findAvailableByEvent,
  findExpiredReservations,
  updateStatus,
};
