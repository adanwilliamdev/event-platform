from datetime import datetime
from typing import List

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from .. import models, schemas


def create_event(db: Session, data: schemas.EventRequest, organizer: models.User) -> schemas.EventResponse:
    event = models.Event(
        title=data.title,
        description=data.description,
        date=data.date,
        location=data.location,
        organizer_id=organizer.id,
        total_capacity=data.total_capacity,
        available_tickets=data.total_capacity,
    )
    db.add(event)
    db.flush()

    tickets = [
        models.Ticket(
            event_id=event.id,
            seat_number=f"SEAT-{i}",
            price=data.ticket_price,
            status=models.TicketStatus.AVAILABLE,
        )
        for i in range(1, data.total_capacity + 1)
    ]
    db.add_all(tickets)
    db.commit()
    db.refresh(event)

    return _map_to_response(db, event, ticket_price=data.ticket_price)


def get_all_events(db: Session) -> List[schemas.EventResponse]:
    events = db.query(models.Event).options(joinedload(models.Event.organizer)).order_by(models.Event.date).all()
    return [_map_to_response(db, e) for e in events]


def get_upcoming_events(db: Session) -> List[schemas.EventResponse]:
    events = (
        db.query(models.Event)
        .options(joinedload(models.Event.organizer))
        .filter(models.Event.date >= datetime.utcnow())
        .order_by(models.Event.date)
        .all()
    )
    return [_map_to_response(db, e) for e in events]


def get_event(db: Session, event_id: str) -> schemas.EventResponse:
    event = db.query(models.Event).options(joinedload(models.Event.organizer)).filter(models.Event.id == event_id).first()
    if event is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evento não encontrado")
    return _map_to_response(db, event)


def _map_to_response(db: Session, event: models.Event, ticket_price=None) -> schemas.EventResponse:
    available = (
        db.query(models.Ticket)
        .filter(models.Ticket.event_id == event.id, models.Ticket.status == models.TicketStatus.AVAILABLE)
        .count()
    )
    if ticket_price is None:
        first_ticket = db.query(models.Ticket).filter(models.Ticket.event_id == event.id).first()
        ticket_price = first_ticket.price if first_ticket else None

    return schemas.EventResponse(
        id=event.id,
        title=event.title,
        description=event.description,
        date=event.date,
        location=event.location,
        organizer_id=event.organizer_id,
        organizer_name=event.organizer.name if event.organizer else "",
        total_capacity=event.total_capacity,
        available_tickets=available,
        cover_seed=event.cover_seed,
        ticket_price=ticket_price,
    )
