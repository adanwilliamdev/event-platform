from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..deps import get_current_user
from ..services import order_service

router = APIRouter(prefix="/api/orders", tags=["orders"])


@router.post("", response_model=schemas.OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    data: schemas.OrderRequest,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    return await order_service.create_order(db, data, user)


@router.get("/me", response_model=List[schemas.OrderDetailResponse])
def get_my_orders(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    return order_service.get_my_orders(db, user)


@router.get("/{order_id}", response_model=schemas.OrderDetailResponse)
def get_order(order_id: str, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    return order_service.get_order(db, order_id, user)


@router.post("/{order_id}/confirm", response_model=schemas.OrderDetailResponse)
async def confirm_payment(
    order_id: str,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    """Confirma o pagamento do pedido (modo demo, sem gateway real configurado)."""
    return await order_service.confirm_payment(db, order_id, user)
