'use strict';
const { v4: uuidv4 } = require('uuid');
const { db } = require('../config/database');

function nowIso() {
  return new Date().toISOString();
}

function create({
  title,
  description,
  date,
  location,
  organizerId,
  totalCapacity,
  availableTickets,
  coverSeed = null,
}) {
  const id = uuidv4();
  const ts = nowIso();
  db.prepare(
    `INSERT INTO events
      (id, title, description, date, location, organizer_id, total_capacity, available_tickets, cover_seed, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    title,
    description ?? null,
    date,
    location,
    organizerId,
    totalCapacity,
    availableTickets,
    coverSeed || uuidv4(),
    ts,
    ts
  );
  return findById(id);
}

function findById(id) {
  return db.prepare('SELECT * FROM events WHERE id = ?').get(id) || null;
}

function findAll() {
  return db.prepare('SELECT * FROM events ORDER BY date ASC').all();
}

function findUpcoming(fromIso) {
  return db
    .prepare('SELECT * FROM events WHERE date >= ? ORDER BY date ASC')
    .all(fromIso);
}

module.exports = { create, findById, findAll, findUpcoming };
