import { useState, useEffect } from 'react'

function Header({ isLive, alertCount }) {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <header style={{
      gridArea: 'header',
      background: 'var(--c-surface)',
      borderBottom: '1px solid var(--c-border)',
      display: 'flex', alignItems: 'center',
      padding: '0 16px', gap: '12px', zIndex: 10
    }}>

      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
          <path d="M10 2L3 6v5c0 4.1 3 7.9 7 9 4-1.1 7-4.9 7-9V6L10 2z"
            fill="var(--c-blue)" opacity="0.2"
            stroke="var(--c-blue)" strokeWidth="1.2" strokeLinejoin="round"/>
          <path d="M7 10l2 2 4-4"
            stroke="var(--c-blue)" strokeWidth="1.4"
            strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--c-bright)', letterSpacing: '-0.01em' }}>
          SecureIoT Monitor
        </span>
        <span style={{
          fontSize: '9px', fontFamily: 'var(--mono)',
          color: 'var(--c-muted)', background: 'var(--c-raised)',
          border: '1px solid var(--c-border)',
          padding: '2px 6px', borderRadius: '3px', letterSpacing: '0.04em'
        }}>v1.1-mvp</span>
      </div>

      <div style={{ flex: 1 }} />

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {alertCount > 0 && (
          <div className="blink" style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            color: 'var(--c-red)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em'
          }}>
            <span>▲</span>
            {alertCount} ALERTE{alertCount > 1 ? 'S' : ''}
          </div>
        )}

        <div style={{ width: '1px', height: '14px', background: 'var(--c-border)' }} />

        <span style={{ fontSize: '11px', fontFamily: 'var(--mono)', color: 'var(--c-muted)' }}>
          {time.toLocaleTimeString('fr-FR')}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ position: 'relative', width: '8px', height: '8px' }}>
            {isLive && (
              <div style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                background: 'var(--c-green)',
                animation: 'ring-out 1.5s ease-out infinite'
              }} />
            )}
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              background: isLive ? 'var(--c-green)' : 'var(--c-muted)'
            }} />
          </div>
          <span style={{
            fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em',
            color: isLive ? 'var(--c-green)' : 'var(--c-muted)'
          }}>
            {isLive ? 'LIVE' : 'OFFLINE'}
          </span>
        </div>
      </div>
    </header>
  )
}

export default Header