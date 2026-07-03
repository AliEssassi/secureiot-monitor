import { useState } from 'react'

const DEVICES = ['DEV-001','DEV-002','DEV-003','DEV-004','DEV-005','DEV-006']
const TYPES = [
  { id: 'spike',    label: 'Spike',    color: 'var(--c-red)' },
  { id: 'drift',    label: 'Drift',    color: 'var(--c-amber)' },
  { id: 'flatline', label: 'Flatline', color: 'var(--c-purple)' },
  { id: 'noise',    label: 'Bruit',    color: 'var(--c-blue)' },
]

function DemoControls() {
  const [device, setDevice] = useState('DEV-002')
  const [type, setType] = useState('spike')
  const [feedback, setFeedback] = useState(null)
  const [loading, setLoading] = useState(false)

  const flash = msg => { setFeedback(msg); setTimeout(() => setFeedback(null), 2500) }

  const inject = async () => {
    setLoading(true)
    try {
      await fetch('/api/inject-anomaly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_id: device, anomaly_type: type })
      })
      flash(`▲ ${device} → ${type}`)
    } catch { flash('✗ Erreur') }
    setLoading(false)
  }

  const clear = async () => {
    setLoading(true)
    try {
      await fetch(`/api/clear-anomaly/${device}`, { method: 'POST' })
      flash(`✓ ${device} cleared`)
    } catch { flash('✗ Erreur') }
    setLoading(false)
  }

  const clearAll = async () => {
    setLoading(true)
    try {
      await Promise.all(DEVICES.map(id => fetch(`/api/clear-anomaly/${id}`, { method: 'POST' })))
      flash('✓ All clear')
    } catch { flash('✗ Erreur') }
    setLoading(false)
  }

  return (
    <div style={{ padding: '12px', flex: 1, overflowY: 'auto' }}>
      <div style={{
        fontSize: '9px', fontWeight: 600, letterSpacing: '0.1em',
        color: 'var(--c-muted)', marginBottom: '10px'
      }}>
        CONTRÔLES DÉMO
      </div>

      {/* Device */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{ fontSize: '9px', color: 'var(--c-muted)', letterSpacing: '0.06em', marginBottom: '5px' }}>CIBLE</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px' }}>
          {DEVICES.map(id => (
            <button key={id} onClick={() => setDevice(id)} style={{
              padding: '4px 6px',
              fontSize: '9px', fontFamily: 'var(--mono)', letterSpacing: '0.04em',
              background: device === id ? '#1A3A6A' : 'var(--c-raised)',
              border: `1px solid ${device === id ? 'var(--c-blue)' : 'var(--c-border)'}`,
              borderRadius: '3px',
              color: device === id ? '#93C5FD' : 'var(--c-muted)',
              cursor: 'pointer', transition: 'all 0.15s'
            }}>
              {id}
            </button>
          ))}
        </div>
      </div>

      {/* Type */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '9px', color: 'var(--c-muted)', letterSpacing: '0.06em', marginBottom: '5px' }}>TYPE</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {TYPES.map(t => (
            <button key={t.id} onClick={() => setType(t.id)} style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              padding: '5px 8px',
              background: type === t.id ? 'var(--c-raised)' : 'transparent',
              border: `1px solid ${type === t.id ? 'var(--c-border)' : 'transparent'}`,
              borderRadius: '3px', cursor: 'pointer', transition: 'all 0.15s'
            }}>
              <div style={{
                width: '5px', height: '5px', borderRadius: '50%',
                background: t.color, flexShrink: 0
              }} />
              <span style={{
                fontSize: '11px', fontWeight: type === t.id ? 500 : 400,
                color: type === t.id ? 'var(--c-bright)' : 'var(--c-muted)'
              }}>
                {t.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <button onClick={inject} disabled={loading} style={{
          padding: '8px', background: 'var(--c-red)',
          border: '1px solid #C0304A', borderRadius: '4px',
          color: 'white', fontSize: '11px', fontWeight: 600,
          cursor: loading ? 'default' : 'pointer',
          opacity: loading ? 0.6 : 1, letterSpacing: '0.02em', transition: 'opacity 0.2s'
        }}>
          ⚡ Injecter
        </button>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button onClick={clear} disabled={loading} style={{
            flex: 1, padding: '6px',
            background: 'transparent', border: '1px solid var(--c-green)',
            borderRadius: '4px', color: 'var(--c-green)',
            fontSize: '10px', fontWeight: 500, cursor: 'pointer'
          }}>Clear</button>
          <button onClick={clearAll} disabled={loading} style={{
            flex: 1, padding: '6px',
            background: 'transparent', border: '1px solid var(--c-border)',
            borderRadius: '4px', color: 'var(--c-muted)',
            fontSize: '10px', cursor: 'pointer'
          }}>Reset</button>
        </div>
      </div>

      {feedback && (
        <div style={{
          marginTop: '8px', padding: '5px 8px',
          background: 'var(--c-raised)', border: '1px solid var(--c-border)',
          borderRadius: '3px', fontSize: '9px', fontFamily: 'var(--mono)',
          color: 'var(--c-muted)'
        }}>
          {feedback}
        </div>
      )}
    </div>
  )
}

export default DemoControls