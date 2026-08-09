import logging
import os

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..services import order_service

logger = logging.getLogger("stripe_webhook")
router = APIRouter(prefix="/api/webhooks/stripe", tags=["webhooks"])

WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")


@router.post("")
async def handle_webhook(
    request: Request,
    stripe_signature: str = Header(default=None, alias="Stripe-Signature"),
    db: Session = Depends(get_db),
):
    payload = await request.body()

    try:
        import stripe

        event = stripe.Webhook.construct_event(payload, stripe_signature, WEBHOOK_SECRET)
    except Exception as exc:
        logger.error("Erro ao processar webhook: %s", exc)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Falha ao processar webhook")

    logger.info("Evento de webhook recebido: %s", event["type"])

    if event["type"] == "payment_intent.succeeded":
        payment_intent = event["data"]["object"]
        await order_service.process_successful_payment(db, payment_intent["id"])
    elif event["type"] == "payment_intent.payment_failed":
        payment_intent = event["data"]["object"]
        logger.warning("Pagamento falhou: %s", payment_intent["id"])

    return {"status": "Webhook processado com sucesso"}
