import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api, { getErrorMessage } from '../services/api'

export const CreateEvent: React.FC = () => {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    totalCapacity: 50,
    ticketPrice: 0
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const update = (field: string, value: string | number) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/events', {
        ...form,
        date: new Date(form.date).toISOString()
      })
      navigate(`/eventos/${data.id}`)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto px-5 py-12">
      <p className="font-mono text-xs uppercase tracking-widest text-stub mb-2">Painel do organizador</p>
      <h1 className="font-marquee text-5xl mb-8 leading-none">Criar evento</h1>

      <form onSubmit={handleSubmit} className="ticket-stub p-6 space-y-4">
        <div>
          <label className="block font-mono text-[11px] uppercase tracking-widest mb-1.5">Título</label>
          <input
            required
            className="input-ticket"
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            placeholder="Nome do show ou evento"
          />
        </div>

        <div>
          <label className="block font-mono text-[11px] uppercase tracking-widest mb-1.5">
            Descrição
          </label>
          <textarea
            required
            className="input-ticket"
            rows={3}
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            placeholder="Do que se trata o evento"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-mono text-[11px] uppercase tracking-widest mb-1.5">
              Data e hora
            </label>
            <input
              required
              type="datetime-local"
              className="input-ticket"
              value={form.date}
              onChange={(e) => update('date', e.target.value)}
            />
          </div>
          <div>
            <label className="block font-mono text-[11px] uppercase tracking-widest mb-1.5">
              Local
            </label>
            <input
              required
              className="input-ticket"
              value={form.location}
              onChange={(e) => update('location', e.target.value)}
              placeholder="Cidade / casa de show"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-mono text-[11px] uppercase tracking-widest mb-1.5">
              Capacidade
            </label>
            <input
              required
              type="number"
              min={1}
              className="input-ticket"
              value={form.totalCapacity}
              onChange={(e) => update('totalCapacity', Number(e.target.value))}
            />
          </div>
          <div>
            <label className="block font-mono text-[11px] uppercase tracking-widest mb-1.5">
              Preço do ingresso (R$)
            </label>
            <input
              required
              type="number"
              min={0}
              step="0.01"
              className="input-ticket"
              value={form.ticketPrice}
              onChange={(e) => update('ticketPrice', Number(e.target.value))}
            />
          </div>
        </div>

        <p className="font-body text-xs text-ink-soft">
          Ao criar o evento, {form.totalCapacity || 0} ingressos numerados são gerados
          automaticamente, todos ao mesmo preço.
        </p>

        {error && (
          <p className="font-body text-sm text-stub-dark bg-stub/10 border border-stub px-3 py-2">
            {error}
          </p>
        )}

        <button type="submit" disabled={loading} className="btn-ink w-full">
          {loading ? 'Criando...' : 'Publicar evento'}
        </button>
      </form>
    </div>
  )
}
