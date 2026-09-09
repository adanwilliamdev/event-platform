'use strict';
/**
 * Endpoint WebSocket para atualizações de disponibilidade de ingressos.
 * Equivalente a app/routers/ws.py (rota: /ws/events/{event_id}/tickets).
 *
 * O Express não lida com WebSockets nativamente, então este módulo é
 * conectado diretamente ao servidor HTTP via evento "upgrade" (ver server.js).
 */
const { WebSocketServer } = require('ws');
const { manager } = require('../utils/wsManager');

const EVENT_TICKETS_PATTERN = /^\/ws\/events\/([^/]+)\/tickets\/?$/;

function attachWebSocketServer(httpServer) {
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on('upgrade', (request, socket, head) => {
    let pathname;
    try {
      pathname = new URL(request.url, `http://${request.headers.host}`).pathname;
    } catch (err) {
      socket.destroy();
      return;
    }

    const match = pathname.match(EVENT_TICKETS_PATTERN);
    if (!match) {
      socket.destroy();
      return;
    }

    const eventId = decodeURIComponent(match[1]);

    wss.handleUpgrade(request, socket, head, (ws) => {
      manager.connect(eventId, ws);

      ws.on('message', () => {
        // Mantém a conexão viva; o cliente não precisa enviar nada.
      });

      ws.on('close', () => {
        manager.disconnect(eventId, ws);
      });

      ws.on('error', () => {
        manager.disconnect(eventId, ws);
      });
    });
  });

  return wss;
}

module.exports = { attachWebSocketServer };
