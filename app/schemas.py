"""Schemas Pydantic (equivalentes aos DTOs do projeto original)."""
from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field, ConfigDict

from .models import Role, TicketStatus, OrderStatus


# ---------- Auth ----------
class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    user_id: str
    name: str
    email: str
    role: str


class UserResponse(BaseModel):
    user_id: str
    name: str
    email: str
    role: str


# ---------- Events ----------
class EventRequest(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    description: Optional[str] = Field(default=None, max_length=2000)
    date: datetime
    location: str = Field(min_length=2, max_length=200)
    total_capacity: int = Field(gt=0, le=100000)
    ticket_price: Decimal = Field(gt=0)


class EventResponse(BaseModel):
    id: str
    title: str
    description: Optional[str]
    date: datetime
    location: str
    organizer_id: str
    organizer_name: str
    total_capacity: int
    available_tickets: int
    cover_seed: Optional[str] = None
    ticket_price: Optional[Decimal] = None

    model_config = ConfigDict(from_attributes=True)


# ---------- Tickets ----------
class TicketResponse(BaseModel):
    id: str
    seat_number: str
    price: Decimal
    status: str


class TicketHoldRequest(BaseModel):
    ticket_id: str


class TicketHoldResponse(BaseModel):
    ticket_id: str
    seat_number: str
    price: Decimal
    hold_expiration: datetime


class TicketAvailabilityUpdate(BaseModel):
    event_id: str
    ticket_id: str
    seat_number: str
    status: str
    available_count: int


# ---------- Orders ----------
class OrderRequest(BaseModel):
    ticket_ids: List[str] = Field(min_length=1)


class OrderResponse(BaseModel):
    order_id: str
    total_amount: Decimal
    payment_intent_id: Optional[str] = None
    client_secret: Optional[str] = None
    status: str
    created_at: Optional[datetime] = None
    event_title: Optional[str] = None
    seats: Optional[List[str]] = None
    demo_mode: bool = True


class OrderItemTicket(BaseModel):
    seat_number: str
    price: Decimal
    qr_code_base64: Optional[str] = None
    event_title: Optional[str] = None
    event_date: Optional[datetime] = None
    event_location: Optional[str] = None


class OrderDetailResponse(OrderResponse):
    items: List[OrderItemTicket] = []
