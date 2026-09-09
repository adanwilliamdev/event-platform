'use strict';
const { v4: uuidv4 } = require('uuid');
const { db } = require('../config/database');
const { Role } = require('./enums');

function nowIso() {
  return new Date().toISOString();
}

function count() {
  return db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
}

function findByEmail(email) {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email) || null;
}

function findById(id) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) || null;
}

function create({ name, email, passwordHash, role = Role.CLIENT, id = null }) {
  const userId = id || uuidv4();
  const ts = nowIso();
  db.prepare(
    `INSERT INTO users (id, email, name, password_hash, role, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(userId, email, name, passwordHash, role, ts, ts);
  return findById(userId);
}

module.exports = { count, findByEmail, findById, create };
