import React, { useEffect, useState } from 'react'
import api, { getErrorMessage } from '../services/api'
import { OrderResponse, OrderStatus } from '../types'

const statusLabel: Record<OrderStatus, string> = {
  PENDING: 'Aguardando pagamento',
  PAID: 'Pago',
  CANCELLED: 'Cancelado',
  EXPIRED: 'Expirado'
}

const statusColor: Record<OrderStatus, string> = {
  PENDING: 'text-gold',
  PAID: 'text-teal',
  CANCELLED: 'text-stub',
  EXPIRED: 'text-stub'
}

export const MyOrders: React.FC = () => {
  const [orders, setOrders] = useState<OrderResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get<OrderResponse[]>('/orders/me')
      .then((res) => setOrders(res.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-4xl mx-auto px-5 py-12">
      <p className="font-mono text-xs uppercase tracking-widest text-stub mb-2">Sua carteira</p>
      <h1 className="font-marquee text-5xl mb-8 leading-none">Meus ingressos</h1>

      {loading && <p className="font-mono text-sm text-ink-soft">Carregando...</p>}

      {error && (
        <p className="font-body text-sm text-stub-dark bg-stub/10 border border-stub px-4 py-3 max-w-lg">
          {error}
        </p>
      )}

      {!loading && !error && orders.length === 0 && (
        <div className="ticket-stub p-10 text-center">
          <p className="font-marquee text-3xl mb-2">Nenhum pedido ainda</p>
          <p className="font-body text-sm text-ink-soft">
            Reserve um assento em um evento para ver seu ingresso aqui.
          </p>
        </div>
      )}

      <div className="grid gap-4">
        {orders.map((order) => (
          <div key={order.orderId} className="ticket-stub flex">
            <div className="flex-1 p-5">
              <p className="font-mono text-[11px] uppercase tracking-widest text-ink-soft mb-1">
                Pedido #{order.orderId.slice(0, 8)}
              </p>
              <p className={`font-marquee text-2xl leading-none mb-1 ${statusColor[order.status]}`}>
                {statusLabel[order.status]}
              </p>
            </div>
            <div className="ticket-perforation w-28 shrink-0 flex flex-col items-center justify-center px-3 py-5 text-center">
              <span className="font-mono text-[10px] uppercase tracking-widest text-ink-soft">Total</span>
              <span className="font-marquee text-2xl leading-none">R$ {order.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
