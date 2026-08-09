from datetime import datetime, timedelta
from typing import List

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..locks import ticket_lock
from ..ws_manager import manager

HOLD_DURATION_MINUTES = 10


async def hold_ticket(db: Session, data: schemas.TicketHoldRequest, user: models.User) -> schemas.TicketHoldResponse:
    with ticket_lock(data.ticket_id):
        ticket = db.query(models.Ticket).filter(models.Ticket.id == data.ticket_id).first()
        if ticket is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ingresso não encontrado")
        if ticket.status != models.TicketStatus.AVAILABLE:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Ingresso indisponível. Status atual: {ticket.status.value}",
            )

        ticket.status = models.TicketStatus.RESERVED
        ticket.reserved_at = datetime.utcnow()
        ticket.reserved_by = user.id
        ticket.version = (ticket.version or 0) + 1
        db.commit()
        db.refresh(ticket)

    await _broadcast_availability(db, ticket)

    return schemas.TicketHoldResponse(
        ticket_id=ticket.id,
        seat_number=ticket.seat_number,
        price=ticket.price,
        hold_expiration=datetime.utcnow() + timedelta(minutes=HOLD_DURATION_MINUTES),
    )


async def release_ticket_hold(db: Session, ticket_id: str) -> None:
    with ticket_lock(ticket_id):
        ticket = db.query(models.Ticket).filter(models.Ticket.id == ticket_id).first()
        if ticket is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ingresso não encontrado")

        if ticket.status != models.TicketStatus.RESERVED:
            return

        ticket.status = models.TicketStatus.AVAILABLE
        ticket.reserved_at = None
        ticket.reserved_by = None
        ticket.version = (ticket.version or 0) + 1
        db.commit()
        db.refresh(ticket)

    await _broadcast_availability(db, ticket)


async def confirm_ticket_sale(db: Session, ticket_id: str, order_id: str) -> None:
    with ticket_lock(ticket_id):
        ticket = db.query(models.Ticket).filter(models.Ticket.id == ticket_id).first()
        if ticket is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ingresso não encontrado")
        if ticket.status != models.TicketStatus.RESERVED:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Ingresso precisa estar reservado antes da venda")

        ticket.status = models.TicketStatus.SOLD
        ticket.order_id = order_id
        db.commit()
        db.refresh(ticket)

    await _broadcast_availability(db, ticket)


def get_available_tickets(db: Session, event_id: str) -> List[schemas.TicketResponse]:
    tickets = (
        db.query(models.Ticket)
        .filter(models.Ticket.event_id == event_id, models.Ticket.status == models.TicketStatus.AVAILABLE)
        .order_by(models.Ticket.seat_number)
        .all()
    )
    return [
        schemas.TicketResponse(id=t.id, seat_number=t.seat_number, price=t.price, status=t.status.value)
        for t in tickets
    ]


def find_expired_reservations(db: Session) -> List[models.Ticket]:
    expiration_time = datetime.utcnow() - timedelta(minutes=HOLD_DURATION_MINUTES)
    return (
        db.query(models.Ticket)
        .filter(models.Ticket.status == models.TicketStatus.RESERVED, models.Ticket.reserved_at < expiration_time)
        .all()
    )


async def _broadcast_availability(db: Session, ticket: models.Ticket) -> None:
    available_count = (
        db.query(models.Ticket)
        .filter(models.Ticket.event_id == ticket.event_id, models.Ticket.status == models.TicketStatus.AVAILABLE)
        .count()
    )
    update = schemas.TicketAvailabilityUpdate(
        event_id=ticket.event_id,
        ticket_id=ticket.id,
        seat_number=ticket.seat_number,
        status=ticket.status.value,
        available_count=available_count,
    )
    await manager.broadcast(ticket.event_id, update.model_dump())
