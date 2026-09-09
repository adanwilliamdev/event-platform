'use strict';
/**
 * Job em segundo plano que libera reservas de ingressos expiradas.
 * Equivalente a app/background.py (ReservationCleanupService / @Scheduled).
 */
const ticketService = require('../services/ticketService');

const CLEANUP_INTERVAL_MS = 60 * 1000;

let _intervalHandle = null;

async function _cleanupOnce() {
  const expired = ticketService.findExpiredReservations();
  for (const ticket of expired) {
    try {
      await ticketService.releaseTicketHold(ticket.id);
      console.log(`Reserva expirada liberada para o ingresso: ${ticket.id}`);
    } catch (err) {
      console.error(`Falha ao liberar reserva expirada para o ingresso: ${ticket.id}`, err);
    }
  }
}

function startReservationCleanupLoop() {
  if (_intervalHandle) return _intervalHandle;
  _intervalHandle = setInterval(() => {
    _cleanupOnce().catch((err) => {
      console.error('Falha ao executar a limpeza de reservas expiradas', err);
    });
  }, CLEANUP_INTERVAL_MS);
  return _intervalHandle;
}

function stopReservationCleanupLoop() {
  if (_intervalHandle) {
    clearInterval(_intervalHandle);
    _intervalHandle = null;
  }
}

module.exports = { startReservationCleanupLoop, stopReservationCleanupLoop };
