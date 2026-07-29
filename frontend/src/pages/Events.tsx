import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api, { getErrorMessage } from '../services/api'
import { EventItem } from '../types'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const Events: React.FC = () => {
  const [events, setEvents] = useState<EventItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get<EventItem[]>('/events/upcoming')
      .then((res) => setEvents(res.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      {/* Hero */}
      <section className="border-b-[1.5px] border-ink bg-paper-dim">
        <div className="max-w-6xl mx-auto px-5 py-16 md:py-24">
          <p className="font-mono text-xs uppercase tracking-widest text-stub mb-3">
            {events.length > 0 ? `${events.length} eventos em cartaz` : 'Em cartaz'}
          </p>
          <h1 className="font-marquee text-6xl md:text-8xl leading-[0.95] max-w-3xl">
            O show começa quando você garante o ingresso.
          </h1>
          <p className="font-body text-ink-soft max-w-lg mt-5">
            Reserve o assento, finalize a compra e receba seu ingresso com QR code —
            tudo com disponibilidade atualizada em tempo real.
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-5 py-12">
        {loading && <p className="font-mono text-sm text-ink-soft">Carregando eventos...</p>}

        {error && (
          <p className="font-body text-sm text-stub-dark bg-stub/10 border border-stub px-4 py-3 max-w-lg">
            {error}
          </p>
        )}

        {!loading && !error && events.length === 0 && (
          <div className="ticket-stub p-10 text-center">
            <p className="font-marquee text-3xl mb-2">Nenhum evento por enquanto</p>
            <p className="font-body text-ink-soft text-sm">
              Volte em breve — novos eventos entram em cartaz o tempo todo.
            </p>
          </div>
        )}

        <div className="grid gap-5">
          {events.map((event) => (
            <Link key={event.id} to={`/eventos/${event.id}`}>
              <TicketRow event={event} />
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}

const TicketRow: React.FC<{ event: EventItem }> = ({ event }) => {
  const soldOut = event.availableTickets <= 0
  return (
    <div className="ticket-stub flex hover:-translate-y-0.5 transition-transform duration-150">
      <div className="flex-1 p-5 min-w-0">
        <p className="font-mono text-[11px] uppercase tracking-widest text-teal mb-1">
          {event.location}
        </p>
        <h3 className="font-marquee text-3xl leading-none mb-2 truncate">{event.title}</h3>
        <p className="font-body text-xs text-ink-soft line-clamp-2 max-w-xl">{event.description}</p>
        <p className="font-mono text-xs text-ink-soft mt-3">{formatDate(event.date)}</p>
      </div>

      <div className="ticket-perforation w-32 shrink-0 flex flex-col items-center justify-center gap-1 px-3 py-5 text-center">
        {soldOut ? (
          <span className="font-marquee text-xl text-stub">Esgotado</span>
        ) : (
          <>
            <span className="font-mono text-[10px] uppercase tracking-widest text-ink-soft">
              Disponíveis
            </span>
            <span className="font-marquee text-3xl leading-none text-teal">
              {event.availableTickets}
            </span>
          </>
        )}
      </div>
    </div>
  )
}
