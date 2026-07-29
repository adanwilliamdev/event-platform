import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout, hasRole } = useAuth()
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-40 bg-paper/90 backdrop-blur border-b-[1.5px] border-ink">
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
        <Link to="/eventos" className="font-marquee text-3xl tracking-wide leading-none">
          ENCORE<span className="text-stub">.</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 font-body text-sm font-semibold">
          <Link to="/eventos" className="hover:text-stub transition-colors">
            Eventos
          </Link>
          {isAuthenticated && (
            <Link to="/meus-pedidos" className="hover:text-stub transition-colors">
              Meus ingressos
            </Link>
          )}
          {hasRole('ADMIN', 'ORGANIZER') && (
            <Link to="/criar-evento" className="hover:text-stub transition-colors">
              Criar evento
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <span className="hidden sm:block font-mono text-xs text-ink-soft">{user?.name}</span>
              <button
                onClick={() => {
                  logout()
                  navigate('/login')
                }}
                className="btn-outline !px-4 !py-2 text-xs"
              >
                Sair
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-outline !px-4 !py-2 text-xs">
                Entrar
              </Link>
              <Link to="/registrar" className="btn-stub !px-4 !py-2 text-xs">
                Criar conta
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
