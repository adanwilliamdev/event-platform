from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..deps import require_roles
from ..services import event_service, ticket_service

router = APIRouter(prefix="/api/events", tags=["events"])


@router.post("", response_model=schemas.EventResponse, status_code=status.HTTP_201_CREATED)
def create_event(
    data: schemas.EventRequest,
    db: Session = Depends(get_db),
    organizer: models.User = Depends(require_roles(models.Role.ADMIN, models.Role.ORGANIZER)),
):
    return event_service.create_event(db, data, organizer)


@router.get("", response_model=List[schemas.EventResponse])
def get_all_events(db: Session = Depends(get_db)):
    return event_service.get_all_events(db)


@router.get("/upcoming", response_model=List[schemas.EventResponse])
def get_upcoming_events(db: Session = Depends(get_db)):
    return event_service.get_upcoming_events(db)


@router.get("/{event_id}", response_model=schemas.EventResponse)
def get_event(event_id: str, db: Session = Depends(get_db)):
    return event_service.get_event(db, event_id)


@router.get("/{event_id}/tickets", response_model=List[schemas.TicketResponse])
def get_available_tickets(event_id: str, db: Session = Depends(get_db)):
    return ticket_service.get_available_tickets(db, event_id)
