'use strict';
/**
 * Configuração do banco de dados (SQLite via node:sqlite, módulo nativo
 * embutido no Node.js — não requer compilação nem dependências externas).
 * Equivalente ao app/database.py original (SQLAlchemy).
 */
const path = require('path');
const fs = require('fs');
const { DatabaseSync } = require('node:sqlite');

const DB_PATH =
  process.env.DATABASE_PATH || path.join(process.cwd(), 'eventplatform.db');

// Garante que o diretório de destino exista (importante quando DATABASE_PATH
// aponta para um volume montado, ex.: /data/eventplatform.db no Fly.io).
const dbDir = path.dirname(DB_PATH);
if (dbDir && !fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

function createSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'CLIENT',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      date TEXT NOT NULL,
      location TEXT NOT NULL,
      organizer_id TEXT NOT NULL REFERENCES users(id),
      total_capacity INTEGER NOT NULL,
      available_tickets INTEGER NOT NULL,
      cover_seed TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tickets (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL REFERENCES events(id),
      seat_number TEXT NOT NULL,
      price NUMERIC NOT NULL,
      status TEXT NOT NULL DEFAULT 'AVAILABLE',
      order_id TEXT REFERENCES orders(id),
      reserved_at TEXT,
      reserved_by TEXT,
      version INTEGER DEFAULT 0,
      UNIQUE (event_id, seat_number)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      total_amount NUMERIC NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      stripe_payment_id TEXT,
      stripe_payment_intent TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES orders(id),
      ticket_id TEXT NOT NULL UNIQUE REFERENCES tickets(id),
      price NUMERIC NOT NULL
    );
  `);
}

createSchema();

module.exports = { db };
