import { useState, useEffect } from 'react'

const STATUS_CONFIG = {
  new: { label: 'NOUVEAU', color: 'var(--c-red)', hex: '#E8405A' },
  in_progress: { label: 'EN COURS', color: 'var(--c-amber)', hex: '#E8A840' },
  resolved: { label: 'RÉSOLU', color: 'var(--c-green)', hex: '#1AB87E' },
}

function AlertPanel({ onIncidentClick }) {
  const [incidents, setIncidents] = useState([])

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const res = await fetch('/api/incidents')
        if (res.ok) setIncidents(await res.json())
      } catch (err) {
        console.error(err)
      }
    }
    fetchIncidents()
    const iv = setInterval(fetchIncidents, 2000)
    return () => clearInterval(iv)
  }, [])

  const fmt = ts => new Date(ts).toLocaleTimeString('fr-FR', {
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  })

  const activeCount = incidents.filter(i => i.status !== 'resolved').length

  // Tri : actifs d'abord, puis résolus, chacun par date décroissante
  const sorted = [...incidents].sort((a, b) => {
    if (a.status === 'resolved' && b.status !== 'resolved') return 1
    if (a.status !== 'resolved' && b.status === 'resolved') return -1
    return new Date(b.last_seen) - new Date(a.last_seen)
  })

  return (
    <aside style={{
      gridArea: 'alerts',
      background: 'var(--c-surface)',
      borderLeft: '1px solid var(--c-border)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden'
    }}>
      <div style={{
        height: '44px', padding: '0 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid var(--c-border)',
        background: 'var(--c-raised)', flexShrink: 0
      }}>
        <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', color: 'var(--c-muted)' }}>
          INCIDENTS
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {incidents.length > 0 && (
            <button
              onClick={async () => {
                await fetch('/api/incidents/clear-all', { method: 'POST' })
                setIncidents([])
              }}
              style={{
                fontSize: '9px', fontWeight: 600, letterSpacing: '0.04em',
                color: 'var(--c-muted)',
                background: 'transparent',
                border: '1px solid var(--c-border)',
                borderRadius: '3px',
                padding: '3px 8px', cursor: 'pointer'
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--c-red)'; e.currentTarget.style.color = 'var(--c-red)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--c-border)'; e.currentTarget.style.color = 'var(--c-muted)' }}
            >
              Tout effacer
            </button>
          )}
          {activeCount > 0 && (
            <span style={{ fontSize: '10px', color: 'var(--c-muted)', fontFamily: 'var(--mono)' }}>
              {activeCount} actif{activeCount > 1 ? 's' : ''}
            </span>
          )}
          <span style={{
            fontSize: '12px', fontFamily: 'var(--mono)', fontWeight: 600,
            color: activeCount > 0 ? 'var(--c-red)' : 'var(--c-green)'
          }}>
            {incidents.length}
          </span>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
        {sorted.length === 0 ? (
          <div style={{ padding: '48px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '10px', color: 'var(--c-green)', opacity: 0.4 }}>✓</div>
            <p style={{ fontSize: '12px', color: 'var(--c-muted)' }}>Aucun incident</p>
            <p style={{ fontSize: '11px', color: 'var(--c-muted)', marginTop: '4px', opacity: 0.5 }}>
              Surveillance en cours...
            </p>
          </div>
        ) : sorted.map(inc => {
          const st = STATUS_CONFIG[inc.status]
          const isResolved = inc.status === 'resolved'

          return (
            <div
              key={inc.id}
              onClick={() => onIncidentClick(inc.id)}
              style={{
                marginBottom: '6px',
                background: 'var(--c-raised)',
                border: '1px solid var(--c-border)',
                borderLeft: `2px solid ${st.color}`,
                borderRadius: '4px',
                padding: '9px 10px',
                cursor: 'pointer',
                opacity: isResolved ? 0.65 : 1,
                transition: 'border-color 0.15s, opacity 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = st.hex}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--c-border)'
                e.currentTarget.style.borderLeftColor = st.color
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{
                    fontSize: '9px', fontWeight: 700, letterSpacing: '0.06em',
                    color: st.color, padding: '2px 5px',
                    background: `${st.hex}15`, border: `1px solid ${st.hex}35`, borderRadius: '2px'
                  }}>
                    {st.label}
                  </span>
                  <span style={{ fontSize: '12px', fontFamily: 'var(--mono)', fontWeight: 600, color: 'var(--c-bright)' }}>
                    {inc.device_id}
                  </span>
                  {inc.occurrences > 1 && (
                    <span style={{
                      fontSize: '9px', fontFamily: 'var(--mono)', color: 'var(--c-muted)',
                      background: 'var(--c-border-s)', padding: '1px 5px', borderRadius: '2px'
                    }}>
                      ×{inc.occurrences}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: '10px', fontFamily: 'var(--mono)', color: 'var(--c-muted)' }}>
                  {fmt(inc.last_seen)}
                </span>
              </div>

              <div style={{
                fontSize: '10px', fontFamily: 'var(--mono)', color: 'var(--c-muted)',
                marginBottom: inc.affected_metrics?.length > 0 ? '5px' : 0
              }}>
                {inc.id} · score <span style={{ color: st.color, fontWeight: 600 }}>{inc.latest_score}</span>
              </div>

              {inc.affected_metrics?.length > 0 && !isResolved && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', marginBottom: '6px' }}>
                  {inc.affected_metrics.slice(0, 3).map(m => (
                    <span key={m.metric} style={{
                      fontSize: '9px', fontFamily: 'var(--mono)',
                      color: '#E89640', background: '#E8964012',
                      border: '1px solid #E8964025',
                      padding: '2px 6px', borderRadius: '2px'
                    }}>
                      {m.metric}{m.deviation_pct !== 0 ? ` ${m.deviation_pct > 0 ? '+' : ''}${m.deviation_pct}%` : ''}
                    </span>
                  ))}
                </div>
              )}

              <div style={{
                fontSize: '9px', color: 'var(--c-muted)',
                display: 'flex', alignItems: 'center',
                paddingTop: '4px', borderTop: '1px solid var(--c-border-s)'
              }}>
                <span style={{ marginLeft: 'auto', opacity: 0.6 }}>Cliquer pour détails →</span>
              </div>
            </div>
          )
        })}
      </div>
    </aside>
  )
}

export default AlertPanel