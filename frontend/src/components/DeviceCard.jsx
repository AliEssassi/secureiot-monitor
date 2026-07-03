import { useState, useEffect } from 'react'
import Sparkline from './Sparkline'

const TYPE_BADGES = {
  machine: 'CNC', router: 'RTR', sensor: 'SNS',
  robot: 'RBT', smartmeter: 'PWR', camera: 'CAM'
}

function DeviceCard({ device, onClick, isSelected }) {
  const [scoreHistory, setScoreHistory] = useState([])

  const analysis = device.analysis || {}
  const isAnomaly = analysis.is_anomaly === true
  const isCollecting = analysis.status === 'collecting'
  const inProgress = device.incidentStatus === 'in_progress'
  const score = analysis.anomaly_score

  // Couleur : jaune si pris en charge, rouge si anomalie non traitée, vert sinon
  const accent = inProgress
    ? 'var(--c-amber)'
    : isAnomaly
    ? 'var(--c-red)'
    : isCollecting
    ? 'var(--c-border)'
    : 'var(--c-green)'
  const accentHex = inProgress
    ? '#E8A840'
    : isAnomaly
    ? '#E8405A'
    : isCollecting
    ? '#1C2E45'
    : '#1AB87E'
  const statusLabel = inProgress
    ? 'EN COURS'
    : isAnomaly
    ? 'ANOMALIE'
    : isCollecting
    ? 'COLLECTE'
    : 'NORMAL'
  const statusColor = inProgress
    ? 'var(--c-amber)'
    : isAnomaly
    ? 'var(--c-red)'
    : isCollecting
    ? 'var(--c-muted)'
    : 'var(--c-green)'
  // Accumule l'historique du score pour la sparkline
  useEffect(() => {
    if (score !== undefined) {
      setScoreHistory(prev => {
        const next = [...prev, score]
        return next.slice(-20)
      })
    }
  }, [score])

  return (
    <div
      onClick={() => onClick(device)}
      style={{
        background: 'var(--c-surface)',
        border: `1px solid ${isSelected ? accentHex : 'var(--c-border)'}`,
        borderRadius: '6px',
        overflow: 'hidden',
        boxShadow: `inset 3px 0 0 ${accent}`,
        transition: 'border-color 0.2s ease, box-shadow 0.4s ease',
        cursor: 'pointer'
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 12px',
        background: 'var(--c-raised)',
        borderBottom: '1px solid var(--c-border-s)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontSize: '9px', fontFamily: 'var(--mono)', fontWeight: 600,
            color: 'var(--c-muted)', background: 'var(--c-border-s)',
            border: '1px solid var(--c-border)',
            padding: '2px 5px', borderRadius: '3px',
            letterSpacing: '0.06em', flexShrink: 0
          }}>
            {TYPE_BADGES[device.type] || 'DEV'}
          </span>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--c-bright)', lineHeight: 1.2 }}>
              {device.name}
            </div>
            <div style={{
              fontSize: '10px', fontFamily: 'var(--mono)',
              color: 'var(--c-muted)', marginTop: '2px', letterSpacing: '0.04em'
            }}>
              {device.id}
            </div>
          </div>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '4px',
          fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', color: statusColor
        }}>
          {isAnomaly && <span className="blink">▲</span>}
          {statusLabel}
        </div>
      </div>

      {/* Metrics */}
      <div style={{ padding: '10px 12px' }}>
        {Object.entries(device.metrics || {}).map(([key, metric]) => {
          const deviation = ((metric.value - metric.baseline) / metric.baseline) * 100
          const showDeviation = isAnomaly && Math.abs(deviation) > 30

          return (
            <div key={key} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '4px 0', borderBottom: '1px solid var(--c-border-s)'
            }}>
              <span style={{ fontSize: '11px', color: 'var(--c-text)', textTransform: 'capitalize' }}>
                {key.replace(/_/g, ' ')}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                {showDeviation && (
                  <span style={{
                    fontSize: '9px', fontFamily: 'var(--mono)', fontWeight: 600,
                    color: 'var(--c-red)'
                  }}>
                    {deviation > 0 ? '▲' : '▼'}{Math.abs(deviation).toFixed(0)}%
                  </span>
                )}
                <span style={{
                  fontSize: '12px', fontFamily: 'var(--mono)', fontWeight: 500,
                  color: isAnomaly ? 'var(--c-red)' : 'var(--c-bright)'
                }}>
                  {metric.value}
                  <span style={{ fontSize: '10px', color: 'var(--c-muted)', marginLeft: '4px', fontWeight: 400 }}>
                    {metric.unit}
                  </span>
                </span>
              </span>
            </div>
          )
        })}
      </div>

      {/* Sparkline + score */}
      {score !== undefined && (
        <div style={{ padding: '4px 12px 10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
            <span style={{ fontSize: '10px', color: 'var(--c-muted)', letterSpacing: '0.06em', fontWeight: 500 }}>
              TENDANCE ML
            </span>
            <span style={{ fontSize: '10px', fontFamily: 'var(--mono)', fontWeight: 600, color: statusColor }}>
              {score?.toFixed(4)}
            </span>
          </div>
          <Sparkline data={scoreHistory} color={accentHex} height={26} />
        </div>
      )}
    </div>
  )
}

export default DeviceCard