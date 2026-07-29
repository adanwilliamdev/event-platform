import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import api, { getErrorMessage } from '../services/api'
import { EventItem, OrderResponse, TicketHoldResponse } from '../types'

interface LocationState {
  hold?: TicketHoldResponse
  event?: EventItem | null
}

function useCountdown(expiresAt?: string) {
  const [remaining, setRemaining] = useState(0)

  useEffect(() => {
    if (!expiresAt) return
    const target = new Date(expiresAt).getTime()
    const tick = () => setRemaining(Math.max(0, Math.floor((target - Date.now()) / 1000)))
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [expiresAt])

  const minutes = String(Math.floor(remaining / 60)).padStart(2, '0')
  const seconds = String(remaining % 60).padStart(2, '0')
  return { remaining, label: `${minutes}:${seconds}` }
}

export const Checkout: React.FC = () => {
  const { ticketId } = useParams<{ ticketId: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const state = (location.state || {}) as LocationState

  const { remaining, label } = useCountdown(state.hold?.holdExpiration)
  const [order, setOrder] = useState<OrderResponse | null>(null)
  const [error, setError] = useState('')
  const [placing, setPlacing] = useState(false)

  const expired = state.hold ? remaining <= 0 : false

  const handleConfirm = async () => {
    if (!ticketId) return
    setPlacing(true)
    setError('')
    try {
      const { data } = await api.post<OrderResponse>('/orders', { ticketIds: [ticketId] })
      setOrder(data)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setPlacing(false)
    }
  }

  if (!state.hold) {
    return (
      <div className="max-w-lg mx-auto px-5 py-16 text-center">
        <p className="font-marquee text-3xl mb-2">Nada reservado por aqui</p>
        <p className="font-body text-sm text-ink-soft mb-6">
          Escolha um evento e reserve um assento antes de finalizar a compra.
        </p>
        <button onClick={() => navigate('/eventos')} className="btn-ink">
          Ver eventos
        </button>
      </div>
    )
  }

  if (order) {
    return (
      <div className="max-w-lg mx-auto px-5 py-16">
        <p className="font-mono text-xs uppercase tracking-widest text-teal mb-2 text-center">
          Pedido confirmado
        </p>
        <h1 className="font-marquee text-5xl text-center mb-8 leading-none">
          {order.status === 'PAID' ? 'Pago!' : 'Quase lá'}
        </h1>

        <div className="ticket-stub flex">
          <div className="flex-1 p-5">
            <p className="font-mono text-[11px] uppercase tracking-widest text-ink-soft mb-1">
              {state.event?.title}
            </p>
            <p className="font-marquee text-3xl leading-none mb-2">{state.hold.seatNumber}</p>
            <p className="font-mono text-xs text-ink-soft">Pedido #{order.orderId.slice(0, 8)}</p>
          </div>
          <div className="ticket-perforation w-28 shrink-0 flex flex-col items-center justify-center px-3 py-5 text-center">
            <span className="font-mono text-[10px] uppercase tracking-widest text-ink-soft">Total</span>
            <span className="font-marquee text-2xl leading-none text-teal">
              R$ {order.totalAmount.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="mt-6 font-body text-xs text-ink-soft bg-paper-dim border-[1.5px] border-line px-4 py-3">
          Pagamento criado no Stripe (Payment Intent <code className="font-mono">{order.paymentIntentId}</code>).
          A cobrança do cartão fica pronta para ser conectada aqui via Stripe Elements — o
          backend já devolve o <code className="font-mono">clientSecret</code> necessário para isso.
        </div>

        <button onClick={() => navigate('/meus-pedidos')} className="btn-ink w-full mt-6">
          Ver meus ingressos
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-5 py-16">
      <p className="font-mono text-xs uppercase tracking-widest text-stub mb-2 text-center">
        Finalizar compra
      </p>
      <h1 className="font-marquee text-5xl text-center mb-8 leading-none">Sua reserva</h1>

      <div className="ticket-stub flex mb-6">
        <div className="flex-1 p-5">
          <p className="font-mono text-[11px] uppercase tracking-widest text-ink-soft mb-1">
            {state.event?.title || 'Evento'}
          </p>
          <p className="font-marquee text-3xl leading-none mb-2">{state.hold.seatNumber}</p>
          <p className="font-mono text-sm text-teal">R$ {state.hold.price.toFixed(2)}</p>
        </div>
        <div className="ticket-perforation w-28 shrink-0 flex flex-col items-center justify-center px-3 py-5 text-center">
          <span className="font-mono text-[10px] uppercase tracking-widest text-ink-soft">Expira em</span>
          <span className={`font-marquee text-3xl leading-none ${expired ? 'text-stub' : 'text-ink'}`}>
            {label}
          </span>
        </div>
      </div>

      {expired ? (
        <div className="ticket-stub p-6 text-center">
          <p className="font-marquee text-2xl text-stub mb-1">Reserva expirada</p>
          <p className="font-body text-sm text-ink-soft mb-4">
            O tempo para finalizar essa compra acabou. O assento voltou a ficar disponível.
          </p>
          <button onClick={() => navigate('/eventos')} className="btn-ink">
            Escolher outro assento
          </button>
        </div>
      ) : (
        <>
          {error && (
            <p className="font-body text-sm text-stub-dark bg-stub/10 border border-stub px-3 py-2 mb-4">
              {error}
            </p>
          )}
          <button onClick={handleConfirm} disabled={placing} className="btn-stub w-full">
            {placing ? 'Processando...' : `Confirmar compra — R$ ${state.hold.price.toFixed(2)}`}
          </button>
        </>
      )}
    </div>
  )
}
