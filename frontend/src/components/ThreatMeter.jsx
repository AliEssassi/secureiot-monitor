function ThreatMeter({ score }) {
  const r = 52
  const cx = 76, cy = 70
  const total = Math.PI * r
  const filled = total * (score / 100)

  const color = score >= 70
    ? 'var(--c-green)'
    : score >= 40
    ? 'var(--c-amber)'
    : 'var(--c-red)'

  const label = score >= 70 ? 'SECURE' : score >= 40 ? 'AT RISK' : 'CRITICAL'

  return (
    <div style={{ padding: '14px 12px 6px' }}>
      <svg viewBox="0 0 152 84" style={{ width: '100%', display: 'block', overflow: 'visible' }}>
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none" stroke="var(--c-border)" strokeWidth="5" strokeLinecap="round"
        />
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"
          strokeDasharray={`${filled} ${total - filled}`}
          style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1), stroke 0.5s ease' }}
        />
        <text x={cx} y={cy - 8} textAnchor="middle" style={{
          fill: color, fontSize: '27px', fontWeight: '600',
          fontFamily: 'JetBrains Mono, monospace',
          transition: 'fill 0.5s ease'
        }}>
          {score}
        </text>
        <text x={cx} y={cy + 9} textAnchor="middle" style={{
          fill: 'var(--c-muted)', fontSize: '8px',
          letterSpacing: '0.14em', fontFamily: 'Inter, sans-serif', fontWeight: '600'
        }}>
          {label}
        </text>
      </svg>
      <p style={{
        textAlign: 'center', fontSize: '9px',
        letterSpacing: '0.12em', color: 'var(--c-muted)',
        fontWeight: 600, marginTop: '-2px'
      }}>
        SECURITY SCORE
      </p>
    </div>
  )
}

export default ThreatMeter