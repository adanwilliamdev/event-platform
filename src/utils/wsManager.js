'use strict';
/**
 * Gerenciador de conexões WebSocket para atualizações em tempo real.
 * Equivalente a app/ws_manager.py.
 */
class ConnectionManager {
  constructor() {
    /** @type {Map<string, Set<import('ws')>>} */
    this._connections = new Map();
  }

  connect(eventId, ws) {
    if (!this._connections.has(eventId)) {
      this._connections.set(eventId, new Set());
    }
    this._connections.get(eventId).add(ws);
  }

  disconnect(eventId, ws) {
    const set = this._connections.get(eventId);
    if (!set) return;
    set.delete(ws);
    if (set.size === 0) {
      this._connections.delete(eventId);
    }
  }

  broadcast(eventId, message) {
    const set = this._connections.get(eventId);
    if (!set) return;
    const payload = JSON.stringify(message);
    const dead = [];
    for (const ws of set) {
      try {
        if (ws.readyState === ws.OPEN) {
          ws.send(payload);
        } else {
          dead.push(ws);
        }
      } catch (err) {
        dead.push(ws);
      }
    }
    for (const ws of dead) {
      this.disconnect(eventId, ws);
    }
  }
}

const manager = new ConnectionManager();

module.exports = { manager };
