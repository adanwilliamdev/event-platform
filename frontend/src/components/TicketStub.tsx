import React from 'react'

interface TicketStubProps {
  eyebrow?: string
  title: string
  meta: string[]
  stubLabel: string
  stubValue: string
  accent?: 'stub' | 'teal' | 'gold'
  children?: React.ReactNode
  onClick?: () => void
  className?: string
}

const accentClass: Record<string, string> = {
  stub: 'text-stub',
  teal: 'text-teal',
  gold: 'text-gold'
}

export const TicketStub: React.FC<TicketStubProps> = ({
  eyebrow,
  title,
  meta,
  stubLabel,
  stubValue,
  accent = 'stub',
  children,
  onClick,
  className = ''
}) => {
  return (
    <div
      onClick={onClick}
      className={`ticket-stub flex ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={{ '--notch-top': '50%' } as React.CSSProperties}
    >
      <div className="flex-1 p-5 min-w-0">
        {eyebrow && (
          <p className={`font-mono text-[11px] uppercase tracking-widest mb-1 ${accentClass[accent]}`}>
            {eyebrow}
          </p>
        )}
        <h3 className="font-marquee text-2xl leading-none mb-2 truncate">{title}</h3>
        <div className="flex flex-wrap gap-x-4 gap-y-1 font-body text-xs text-ink-soft">
          {meta.map((m, i) => (
            <span key={i}>{m}</span>
          ))}
        </div>
        {children}
      </div>

      <div className="ticket-perforation w-28 shrink-0 flex flex-col items-center justify-center gap-1 px-3 py-5">
        <span className="font-mono text-[10px] uppercase tracking-widest text-ink-soft">{stubLabel}</span>
        <span className={`font-marquee text-2xl leading-none text-center ${accentClass[accent]}`}>
          {stubValue}
        </span>
      </div>
    </div>
  )
}
