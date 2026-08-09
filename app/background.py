"""Job em segundo plano que libera reservas de ingressos expiradas
(equivalente ao ReservationCleanupService, que usava @Scheduled)."""
import asyncio
import logging

from .database import SessionLocal
from .services import ticket_service

logger = logging.getLogger("reservation_cleanup")

CLEANUP_INTERVAL_SECONDS = 60


async def reservation_cleanup_loop() -> None:
    while True:
        try:
            await _cleanup_once()
        except Exception:
            logger.exception("Falha ao executar a limpeza de reservas expiradas")
        await asyncio.sleep(CLEANUP_INTERVAL_SECONDS)


async def _cleanup_once() -> None:
    db = SessionLocal()
    try:
        expired = ticket_service.find_expired_reservations(db)
        for ticket in expired:
            try:
                await ticket_service.release_ticket_hold(db, ticket.id)
                logger.info("Reserva expirada liberada para o ingresso: %s", ticket.id)
            except Exception:
                logger.exception("Falha ao liberar reserva expirada para o ingresso: %s", ticket.id)
    finally:
        db.close()
