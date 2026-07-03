function AlertPanel({ alerts }) {
  // Déduplication : une entrée par device, avec compteur d'occurrences
  const deduped = Object.values(
    [...alerts]
      .filter(a => a.severity === 'warning' || a.severity === 'critical')
      .reduce((acc, alert) => {
        const id = alert.device_id
        if (!acc[id]) {
          acc[id] = { ...alert, count: 1 }
        } else {
          const count = acc[id].count + 1
          if (new Date(alert.timestamp) > new Date(acc[id].timestamp)) {
            acc[id] = { ...alert, count }
          } else {
            acc[id] = { ...acc[id], count }
          }
        }
        return acc
      }, {})
  ).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

  const fmt = ts => new Date(ts).toLocaleTimeString('fr-FR', {
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  })

  return (
    <aside style={{
      gridArea: 'alerts',
      background: 'var(--c-surface)',
      borderLeft: '1px solid var(--c-border)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden'
    }}>

      {/* Header */}
      <div style={{
        height: '44px', padding: '0 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid var(--c-border)',
        background: 'var(--c-raised)', flexShrink: 0
      }}>
        <span style={{
          fontSize: '10px', fontWeight: 600,
          letterSpacing: '0.1em', color: 'var(--c-muted)'
        }}>
          ÉVÉNEMENTS
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {deduped.length > 0 && (
            <span style={{
              fontSize: '9px', color: 'var(--c-muted)',
              fontFamily: 'var(--mono)'
            }}>
              {deduped.length} actif{deduped.length > 1 ? 's' : ''}
            </span>
          )}
          <span style={{
            fontSize: '11px', fontFamily: 'var(--mono)', fontWeight: 600,
            color: deduped.length > 0 ? 'var(--c-red)' : 'var(--c-muted)'
          }}>
            {deduped.length}
          </span>
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
        {deduped.length === 0 ? (
          <div style={{ padding: '48px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '10px', color: 'var(--c-green)', opacity: 0.4 }}>
              ✓
            </div>
            <p style={{ fontSize: '12px', color: 'var(--c-muted)' }}>Aucune anomalie</p>
            <p style={{ fontSize: '10px', color: 'var(--c-muted)', marginTop: '4px', opacity: 0.5 }}>
              Surveillance en cours...
            </p>
          </div>
        ) : deduped.map(alert => {
          const isCrit = alert.severity === 'critical'
          const ac = isCrit ? 'var(--c-red)' : 'var(--c-amber)'
          const acHex = isCrit ? '#E8405A' : '#E8A840'

          return (
            <div key={alert.device_id} style={{
              marginBottom: '6px',
              background: 'var(--c-raised)',
              border: '1px solid var(--c-border)',
              borderLeft: `2px solid ${ac}`,
              borderRadius: '4px',
              padding: '9px 10px'
            }}>

              {/* Row 1: badge + device + time */}
              <div style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', marginBottom: '5px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{
                    fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em',
                    color: ac, padding: '2px 5px',
                    background: `${acHex}12`,
                    border: `1px solid ${acHex}30`,
                    borderRadius: '2px'
                  }}>
                    {isCrit ? 'CRIT' : 'WARN'}
                  </span>
                  <span style={{
                    fontSize: '12px', fontFamily: 'var(--mono)',
                    fontWeight: 600, color: 'var(--c-bright)'
                  }}>
                    {alert.device_id}
                  </span>
                  {/* Compteur d'occurrences */}
                  {alert.count > 1 && (
                    <span style={{
                      fontSize: '9px', fontFamily: 'var(--mono)',
                      color: 'var(--c-muted)',
                      background: 'var(--c-border-s)',
                      padding: '1px 5px', borderRadius: '2px'
                    }}>
                      ×{alert.count}
                    </span>
                  )}
                </div>
                <span style={{
                  fontSize: '10px', fontFamily: 'var(--mono)',
                  color: 'var(--c-muted)'
                }}>
                  {fmt(alert.timestamp)}
                </span>
              </div>

              {/* Row 2: score */}
              <div style={{
                fontSize: '10px', fontFamily: 'var(--mono)',
                color: 'var(--c-muted)', marginBottom: alert.affected_metrics?.length > 0 ? '5px' : 0
              }}>
                score <span style={{ color: ac, fontWeight: 600 }}>{alert.anomaly_score}</span>
              </div>

              {/* Row 3: métriques affectées */}
              {alert.affected_metrics?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                  {alert.affected_metrics.map(m => (
                    <span key={m.metric} style={{
                      fontSize: '9px', fontFamily: 'var(--mono)',
                      color: '#E89640', background: '#E8964012',
                      border: '1px solid #E8964025',
                      padding: '2px 6px', borderRadius: '2px'
                    }}>
                      {m.metric} <span style={{ opacity: 0.7 }}>+{m.deviation_pct}%</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </aside>
  )
}

export default AlertPanel