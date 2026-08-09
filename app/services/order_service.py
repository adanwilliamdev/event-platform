import os
import uuid
from decimal import Decimal
from typing import List

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from .. import models, schemas
from . import ticket_service
from ..qr import generate_qr_code_base64

STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "").strip()

_stripe = None
if STRIPE_SECRET_KEY:
    try:
        import stripe as _stripe_module

        _stripe_module.api_key = STRIPE_SECRET_KEY
        _stripe = _stripe_module
    except ImportError:
        _stripe = None


async def create_order(db: Session, data: schemas.OrderRequest, user: models.User) -> schemas.OrderResponse:
    tickets: List[models.Ticket] = []
    total_amount = Decimal("0")

    for ticket_id in data.ticket_ids:
        ticket = db.query(models.Ticket).filter(models.Ticket.id == ticket_id).first()
        if ticket is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Ingresso não encontrado: {ticket_id}")
        if ticket.status != models.TicketStatus.RESERVED or ticket.reserved_by != user.id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Ingresso não está reservado para este usuário: {ticket_id}",
            )
        tickets.append(ticket)
        total_amount += Decimal(ticket.price)

    order = models.Order(user_id=user.id, total_amount=total_amount, status=models.OrderStatus.PENDING)
    db.add(order)
    db.flush()

    for ticket in tickets:
        db.add(models.OrderItem(order_id=order.id, ticket_id=ticket.id, price=ticket.price))

    payment_intent_id = None
    client_secret = None
    demo_mode = True

    if _stripe is not None:
        try:
            intent = _stripe.PaymentIntent.create(
                amount=int(total_amount * 100),
                currency="usd",
                metadata={"orderId": order.id, "userId": user.id},
            )
            payment_intent_id = intent.id
            client_secret = intent.client_secret
            order.stripe_payment_intent = payment_intent_id
            demo_mode = False
        except Exception as exc:  # pragma: no cover - only hit with real Stripe keys
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Falha ao criar pagamento no Stripe: {exc}"
            )

    if payment_intent_id is None:
        payment_intent_id = f"pi_demo_{uuid.uuid4().hex[:24]}"
        client_secret = f"{payment_intent_id}_secret_{uuid.uuid4().hex[:16]}"
        order.stripe_payment_intent = payment_intent_id

    db.commit()
    db.refresh(order)

    event = tickets[0].event
    return schemas.OrderResponse(
        order_id=order.id,
        total_amount=total_amount,
        payment_intent_id=payment_intent_id,
        client_secret=client_secret,
        status=order.status.value,
        created_at=order.created_at,
        event_title=event.title if event else None,
        seats=[t.seat_number for t in tickets],
        demo_mode=demo_mode,
    )


def get_order(db: Session, order_id: str, user: models.User) -> schemas.OrderDetailResponse:
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Pedido não encontrado: {order_id}")
    if order.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Este pedido não pertence a este usuário")
    return _map_detail(db, order)


def get_my_orders(db: Session, user: models.User) -> List[schemas.OrderDetailResponse]:
    orders = (
        db.query(models.Order)
        .filter(models.Order.user_id == user.id)
        .order_by(models.Order.created_at.desc())
        .all()
    )
    return [_map_detail(db, o) for o in orders]


async def confirm_payment(db: Session, order_id: str, user: models.User) -> schemas.OrderDetailResponse:
    """Confirma o pagamento (fluxo demo, ou chamado pelo webhook do Stripe)."""
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pedido não encontrado")
    if order.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Este pedido não pertence a este usuário")
    if order.status == models.OrderStatus.PAID:
        return _map_detail(db, order)
    if order.status != models.OrderStatus.PENDING:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Pedido não pode mais ser pago")

    await process_successful_payment(db, order.stripe_payment_intent)
    db.refresh(order)
    return _map_detail(db, order)


async def process_successful_payment(db: Session, payment_intent_id: str) -> None:
    order = db.query(models.Order).filter(models.Order.stripe_payment_intent == payment_intent_id).first()
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pedido não encontrado para este pagamento")

    order.status = models.OrderStatus.PAID
    db.commit()

    for item in order.order_items:
        await ticket_service.confirm_ticket_sale(db, item.ticket_id, order.id)


def _map_detail(db: Session, order: models.Order) -> schemas.OrderDetailResponse:
    items = []
    for oi in order.order_items:
        ticket = oi.ticket
        event = ticket.event if ticket else None
        qr = None
        if order.status == models.OrderStatus.PAID and ticket and event:
            qr = generate_qr_code_base64(
                f"EVENTPLATFORM|order={order.id}|seat={ticket.seat_number}|event={event.title}"
            )
        items.append(
            schemas.OrderItemTicket(
                seat_number=ticket.seat_number if ticket else "?",
                price=oi.price,
                qr_code_base64=qr,
                event_title=event.title if event else None,
                event_date=event.date if event else None,
                event_location=event.location if event else None,
            )
        )

    event_title = items[0].event_title if items else None
    return schemas.OrderDetailResponse(
        order_id=order.id,
        total_amount=order.total_amount,
        payment_intent_id=order.stripe_payment_intent,
        status=order.status.value,
        created_at=order.created_at,
        event_title=event_title,
        seats=[i.seat_number for i in items],
        demo_mode=_stripe is None,
        items=items,
    )
