from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..deps import get_current_user
from ..services import ticket_service

router = APIRouter(prefix="/api/tickets", tags=["tickets"])


@router.post("/hold", response_model=schemas.TicketHoldResponse)
async def hold_ticket(
    data: schemas.TicketHoldRequest,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    return await ticket_service.hold_ticket(db, data, user)


@router.post("/{ticket_id}/release", status_code=status.HTTP_204_NO_CONTENT)
async def release_ticket(
    ticket_id: str,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    await ticket_service.release_ticket_hold(db, ticket_id)
