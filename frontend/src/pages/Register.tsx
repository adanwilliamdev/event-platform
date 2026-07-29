import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export const Register: React.FC = () => {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(name, email, password)
      navigate('/eventos', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível criar sua conta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-5 py-16">
      <div className="w-full max-w-sm">
        <p className="font-mono text-xs uppercase tracking-widest text-stub mb-2 text-center">
          Primeira vez aqui
        </p>
        <h1 className="font-marquee text-5xl text-center mb-8 leading-none">Criar conta</h1>

        <form onSubmit={handleSubmit} className="ticket-stub p-6 space-y-4">
          <div>
            <label className="block font-mono text-[11px] uppercase tracking-widest mb-1.5">
              Nome
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-ticket"
              placeholder="Seu nome"
            />
          </div>
          <div>
            <label className="block font-mono text-[11px] uppercase tracking-widest mb-1.5">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-ticket"
              placeholder="voce@email.com"
            />
          </div>
          <div>
            <label className="block font-mono text-[11px] uppercase tracking-widest mb-1.5">
              Senha
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-ticket"
              placeholder="mínimo 8 caracteres"
            />
          </div>

          {error && (
            <p className="font-body text-sm text-stub-dark bg-stub/10 border border-stub px-3 py-2">
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} className="btn-ink w-full">
            {loading ? 'Criando...' : 'Criar conta'}
          </button>
        </form>

        <p className="text-center font-body text-sm text-ink-soft mt-6">
          Já tem conta?{' '}
          <Link to="/login" className="text-stub font-semibold hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
