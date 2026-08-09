import asyncio
import logging
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from decimal import Decimal

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from . import models
from .background import reservation_cleanup_loop
from .database import Base, SessionLocal, engine
from .routers import auth, events, orders, tickets, webhooks, ws
from .security import hash_password

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")


def seed_demo_data(db: Session) -> None:
    if db.query(models.User).count() > 0:
        return

    admin = models.User(
        name="Admin da Plataforma",
        email="admin@eventos.com",
        password_hash=hash_password("admin123"),
        role=models.Role.ADMIN,
    )
    organizer = models.User(
        name="Ana Organizadora",
        email="organizador@eventos.com",
        password_hash=hash_password("organiza123"),
        role=models.Role.ORGANIZER,
    )
    db.add_all([admin, organizer])
    db.flush()

    demo_events = [
        dict(
            title="Festival de Música Eletrônica",
            description="Uma noite inesquecível com os melhores DJs da cena eletrônica nacional e internacional, luzes, som de alta potência e muita energia.",
            date=datetime.utcnow() + timedelta(days=21),
            location="Arena Central, São Paulo - SP",
            total_capacity=60,
            price=Decimal("180.00"),
        ),
        dict(
            title="Conferência de Tecnologia & Inovação",
            description="Palestras, workshops e networking com os principais nomes da tecnologia, startups e inteligência artificial.",
            date=datetime.utcnow() + timedelta(days=10),
            location="Centro de Convenções, Belo Horizonte - MG",
            total_capacity=40,
            price=Decimal("350.00"),
        ),
        dict(
            title="Stand-up Comedy Night",
            description="Uma noite de muitas risadas com comediantes renomados do circuito nacional.",
            date=datetime.utcnow() + timedelta(days=5),
            location="Teatro Municipal, Rio de Janeiro - RJ",
            total_capacity=25,
            price=Decimal("90.00"),
        ),
        dict(
            title="Feira Gastronômica Internacional",
            description="Experimente pratos de mais de 20 países em um só lugar, com chefs renomados e atrações culturais.",
            date=datetime.utcnow() + timedelta(days=35),
            location="Parque das Nações, Curitiba - PR",
            total_capacity=80,
            price=Decimal("60.00"),
        ),
    ]

    for spec in demo_events:
        event = models.Event(
            title=spec["title"],
            description=spec["description"],
            date=spec["date"],
            location=spec["location"],
            organizer_id=organizer.id,
            total_capacity=spec["total_capacity"],
            available_tickets=spec["total_capacity"],
        )
        db.add(event)
        db.flush()
        tickets_batch = [
            models.Ticket(
                event_id=event.id,
                seat_number=f"SEAT-{i}",
                price=spec["price"],
                status=models.TicketStatus.AVAILABLE,
            )
            for i in range(1, spec["total_capacity"] + 1)
        ]
        db.add_all(tickets_batch)

    db.commit()
    logging.getLogger("seed").info("Dados de demonstração criados com sucesso.")


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_demo_data(db)
    finally:
        db.close()

    cleanup_task = asyncio.create_task(reservation_cleanup_loop())
    yield
    cleanup_task.cancel()


app = FastAPI(title="Event Platform API", version="1.0.0", lifespan=lifespan)

app.include_router(auth.router)
app.include_router(events.router)
app.include_router(tickets.router)
app.include_router(orders.router)
app.include_router(webhooks.router)
app.include_router(ws.router)

app.mount("/static", StaticFiles(directory="app/static"), name="static")


@app.get("/")
def serve_index():
    return FileResponse("app/static/index.html")


@app.get("/health")
def health():
    return {"status": "ok"}
