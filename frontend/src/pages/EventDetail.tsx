import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api, { getErrorMessage } from '../services/api'
import { subscribeToEventTickets } from '../services/websocket'
import { EventItem, TicketAvailabilityUpdate, TicketItem } from '../types'
import { useAuth } from '../context/AuthContext'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const EventDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  const [event, setEvent] = useState<EventItem | null>(null)
  const [tickets, setTickets] = useState<TicketItem[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [holding, setHolding] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([
      api.get<EventItem>(`/events/${id}`),
      api.get<TicketItem[]>(`/events/${id}/tickets`)
    ])
      .then(([eventRes, ticketsRes]) => {
        setEvent(eventRes.data)
        setTickets(ticketsRes.data)
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!id) return
    const unsubscribe = subscribeToEventTickets(id, (update: TicketAvailabilityUpdate) => {
      setTickets((prev) => {
        if (update.status !== 'AVAILABLE') {
          // Ticket no longer available to pick — remove it from the list
          return prev.filter((t) => t.id !== update.ticketId)
        }
        // A ticket became available again (hold released/expired)
        const exists = prev.some((t) => t.id === update.ticketId)
        if (exists) return prev
        return [...prev, { id: update.ticketId, seatNumber: update.seatNumber, price: 0, status: 'AVAILABLE' }]
      })
      setEvent((prev) => (prev ? { ...prev, availableTickets: update.availableCount } : prev))
    })
    return unsubscribe
  }, [id])

  const selectedTicket = useMemo(
    () => tickets.find((t) => t.id === selectedId) || null,
    [tickets, selectedId]
  )

  const handleHold = async () => {
    if (!id || !selectedId) return

    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/eventos/${id}` } } })
      return
    }

    setHolding(true)
    setError('')
    try {
      const { data } = await api.post('/tickets/hold', { ticketId: selectedId, eventId: id })
      navigate(`/checkout/${data.ticketId}`, { state: { hold: data, event } })
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setHolding(false)
    }
  }

  if (loading) {
    return <p className="max-w-6xl mx-auto px-5 py-16 font-mono text-sm text-ink-soft">Carregando...</p>
  }

  if (!event) {
    return (
      <div className="max-w-6xl mx-auto px-5 py-16">
        <p className="font-body text-sm text-stub-dark">{error || 'Evento não encontrado.'}</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-5 py-10">
      <p className="font-mono text-xs uppercase tracking-widest text-teal mb-2">{event.location}</p>
      <h1 className="font-marquee text-6xl leading-[0.95] mb-3">{event.title}</h1>
      <p className="font-body text-ink-soft max-w-2xl mb-1">{event.description}</p>
      <p className="font-mono text-sm text-ink mt-3">{formatDate(event.date)}</p>

      <div className="grid md:grid-cols-[1fr_320px] gap-8 mt-10">
        <div>
          <h2 className="font-marquee text-3xl mb-4">
            Assentos disponíveis
            <span className="font-mono text-sm text-ink-soft ml-3">({tickets.length})</span>
          </h2>

          {tickets.length === 0 ? (
            <div className="ticket-stub p-8 text-center">
              <p className="font-marquee text-2xl">Esgotado</p>
              <p className="font-body text-sm text-ink-soft mt-1">
                Todos os ingressos para este evento já foram reservados ou vendidos.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {tickets.map((ticket) => (
                <button
                  key={ticket.id}
                  onClick={() => setSelectedId(ticket.id)}
                  className={`font-mono text-sm px-3 py-4 border-[1.5px] border-ink transition-all
                    ${
                      selectedId === ticket.id
                        ? 'bg-stub text-paper shadow-[3px_3px_0_theme(colors.ink)]'
                        : 'bg-white hover:bg-paper-dim'
                    }`}
                >
                  {ticket.seatNumber}
                </button>
              ))}
            </div>
          )}
        </div>

        <aside className="ticket-stub flex-col h-fit">
          <div className="p-5">
            <p className="font-mono text-[11px] uppercase tracking-widest text-ink-soft mb-1">
              Seu ingresso
            </p>
            {selectedTicket ? (
              <>
                <p className="font-marquee text-3xl leading-none mb-1">{selectedTicket.seatNumber}</p>
                <p className="font-mono text-sm text-teal mb-4">
                  R$ {selectedTicket.price.toFixed(2)}
                </p>
              </>
            ) : (
              <p className="font-body text-sm text-ink-soft mb-4">
                Escolha um assento ao lado para continuar.
              </p>
            )}

            {error && (
              <p className="font-body text-xs text-stub-dark bg-stub/10 border border-stub px-3 py-2 mb-3">
                {error}
              </p>
            )}

            <button
              onClick={handleHold}
              disabled={!selectedId || holding}
              className="btn-stub w-full"
            >
              {holding ? 'Reservando...' : 'Reservar por 10 min'}
            </button>
            {!isAuthenticated && (
              <p className="font-mono text-[11px] text-ink-soft mt-3 text-center">
                Você precisa entrar para reservar
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
