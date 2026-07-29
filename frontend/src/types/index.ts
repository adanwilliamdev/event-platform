export type Role = 'ADMIN' | 'ORGANIZER' | 'CLIENT'

export interface User {
  userId: string
  name: string
  email: string
  role: Role
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  userId: string
  name: string
  email: string
  role: Role
}

export interface EventItem {
  id: string
  title: string
  description: string
  date: string
  location: string
  organizerId: string
  organizerName: string
  totalCapacity: number
  availableTickets: number
}

export interface TicketItem {
  id: string
  seatNumber: string
  price: number
  status: 'AVAILABLE' | 'RESERVED' | 'SOLD'
}

export interface TicketHoldResponse {
  ticketId: string
  seatNumber: string
  price: number
  holdExpiration: string
}

export type OrderStatus = 'PENDING' | 'PAID' | 'CANCELLED' | 'EXPIRED'

export interface OrderResponse {
  orderId: string
  totalAmount: number
  paymentIntentId: string
  clientSecret?: string
  status: OrderStatus
}

export interface TicketAvailabilityUpdate {
  eventId: string
  ticketId: string
  seatNumber: string
  status: 'AVAILABLE' | 'RESERVED' | 'SOLD'
  availableCount: number
}

export interface ApiError {
  timestamp: string
  status: number
  error: string
  fields?: Record<string, string>
}
