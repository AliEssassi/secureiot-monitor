import { useState, useEffect } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'

const METRIC_COLORS = ['#3B7DD8', '#1AB87E', '#E8A840', '#9B6FE8']

function DetailPanel({ device, onClose }) {
  const [history, setHistory] = useState([])

  useEffect(() => {
    if (!device) return

    const fetchHistory = async () => {
      try {
        const res = await fetch(`/api/history/${device.id}`)
        const data = await res.json()
        // Formate les timestamps pour l'affichage
        const formatted = data.map(point => ({
          ...point,
          time: new Date(point.timestamp).toLocaleTimeString('fr-FR', {
            minute: '2-digit', second: '2-digit'
          })
        }))
        setHistory(formatted)
      } catch (err) {
        console.error(err)
      }
    }

    fetchHistory()
    const iv = setInterval(fetchHistory, 2000)
    return () => clearInterval(iv)
  }, [device])

  if (!device) return null

  const metricNames = Object.keys(device.metrics || {})
  const isAnomaly = device.analysis?.is_anomaly

  return (
    <div style={{
      background: 'var(--c-surface)',
      border: '1px solid var(--c-border)',
      borderRadius: '8px',
      marginTop: '14px',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px',
        background: 'var(--c-raised)',
        borderBottom: '1px solid var(--c-border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            fontSize: '10px', fontFamily: 'var(--mono)', fontWeight: 600,
            color: isAnomaly ? 'var(--c-red)' : 'var(--c-green)',
            background: isAnomaly ? '#E8405A15' : '#1AB87E15',
            border: `1px solid ${isAnomaly ? '#E8405A30' : '#1AB87E30'}`,
            padding: '3px 8px', borderRadius: '3px', letterSpacing: '0.06em'
          }}>
            {isAnomaly ? '▲ ANOMALIE' : '● NORMAL'}
          </span>
          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--c-bright)' }}>
            {device.name}
          </span>
          <span style={{ fontSize: '11px', fontFamily: 'var(--mono)', color: 'var(--c-muted)' }}>
            {device.id}
          </span>
        </div>
        <button onClick={onClose} style={{
          background: 'transparent', border: '1px solid var(--c-border)',
          borderRadius: '4px', color: 'var(--c-muted)',
          fontSize: '11px', padding: '4px 10px', cursor: 'pointer'
        }}>
          ✕ Fermer
        </button>
      </div>

      {/* Graphique */}
      <div style={{ padding: '16px', height: '260px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={history} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid stroke="#1C2E45" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="time"
              stroke="#3A5070"
              tick={{ fontSize: 10, fill: '#3A5070', fontFamily: 'JetBrains Mono' }}
              interval="preserveStartEnd"
              minTickGap={40}
            />
            <YAxis
              stroke="#3A5070"
              tick={{ fontSize: 10, fill: '#3A5070', fontFamily: 'JetBrains Mono' }}
            />
            <Tooltip
              contentStyle={{
                background: '#0D1520',
                border: '1px solid #1C2E45',
                borderRadius: '6px',
                fontSize: '11px',
                fontFamily: 'JetBrains Mono'
              }}
              labelStyle={{ color: '#94A3B8' }}
            />
            <Legend
              wrapperStyle={{ fontSize: '11px', fontFamily: 'Inter' }}
            />
            {metricNames.map((metric, i) => (
              <Line
                key={metric}
                type="monotone"
                dataKey={metric}
                stroke={METRIC_COLORS[i % METRIC_COLORS.length]}
                strokeWidth={1.8}
                dot={false}
                isAnimationActive={false}
                name={metric.replace(/_/g, ' ')}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default DetailPanel