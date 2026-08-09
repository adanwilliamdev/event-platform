"""Modelos de dados (equivalentes às entidades JPA do projeto original)."""
import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    Column, String, Text, DateTime, ForeignKey, Numeric, Integer, Enum as SAEnum,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from .database import Base


def gen_id() -> str:
    return str(uuid.uuid4())


class Role(str, enum.Enum):
    ADMIN = "ADMIN"
    ORGANIZER = "ORGANIZER"
    CLIENT = "CLIENT"


class TicketStatus(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    RESERVED = "RESERVED"
    SOLD = "SOLD"


class OrderStatus(str, enum.Enum):
    PENDING = "PENDING"
    PAID = "PAID"
    CANCELLED = "CANCELLED"
    EXPIRED = "EXPIRED"


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=gen_id)
    email = Column(String, nullable=False, unique=True, index=True)
    name = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(SAEnum(Role), nullable=False, default=Role.CLIENT)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    organized_events = relationship("Event", back_populates="organizer")
    orders = relationship("Order", back_populates="user")


class Event(Base):
    __tablename__ = "events"

    id = Column(String, primary_key=True, default=gen_id)
    title = Column(String, nullable=False)
    description = Column(Text)
    date = Column(DateTime, nullable=False)
    location = Column(String, nullable=False)
    organizer_id = Column(String, ForeignKey("users.id"), nullable=False)
    total_capacity = Column(Integer, nullable=False)
    available_tickets = Column(Integer, nullable=False)
    cover_seed = Column(String, default=gen_id)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    organizer = relationship("User", back_populates="organized_events")
    tickets = relationship("Ticket", back_populates="event", cascade="all, delete-orphan")


class Ticket(Base):
    __tablename__ = "tickets"
    __table_args__ = (UniqueConstraint("event_id", "seat_number", name="uq_event_seat"),)

    id = Column(String, primary_key=True, default=gen_id)
    event_id = Column(String, ForeignKey("events.id"), nullable=False)
    seat_number = Column(String, nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    status = Column(SAEnum(TicketStatus), nullable=False, default=TicketStatus.AVAILABLE)
    order_id = Column(String, ForeignKey("orders.id"), nullable=True)
    reserved_at = Column(DateTime, nullable=True)
    reserved_by = Column(String, nullable=True)
    version = Column(Integer, default=0)

    event = relationship("Event", back_populates="tickets")
    order = relationship("Order", back_populates="order_tickets", foreign_keys=[order_id])


class Order(Base):
    __tablename__ = "orders"

    id = Column(String, primary_key=True, default=gen_id)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    total_amount = Column(Numeric(10, 2), nullable=False)
    status = Column(SAEnum(OrderStatus), nullable=False, default=OrderStatus.PENDING)
    stripe_payment_id = Column(String, nullable=True)
    stripe_payment_intent = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="orders")
    order_items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    order_tickets = relationship("Ticket", back_populates="order", foreign_keys=[Ticket.order_id])


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(String, primary_key=True, default=gen_id)
    order_id = Column(String, ForeignKey("orders.id"), nullable=False)
    ticket_id = Column(String, ForeignKey("tickets.id"), nullable=False, unique=True)
    price = Column(Numeric(10, 2), nullable=False)

    order = relationship("Order", back_populates="order_items")
    ticket = relationship("Ticket")
