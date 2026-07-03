import ThreatMeter from './ThreatMeter'
import DemoControls from './DemoControls'

function StatRow({ label, value, color }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      padding: '5px 8px', gap: '8px',
      background: 'var(--c-raised)',
      border: '1px solid var(--c-border-s)',
      borderRadius: '4px'
    }}>
      <span style={{ fontSize: '11px', color: 'var(--c-text)', flex: 1 }}>{label}</span>
      <span style={{
        fontSize: '14px', fontFamily: 'var(--mono)',
        fontWeight: 600, color
      }}>{value}</span>
    </div>
  )
}

function Sidebar({ snapshot, alerts }) {
  const total = snapshot.length
  const anomalies = snapshot.filter(d => d.analysis?.is_anomaly).length
  const online = snapshot.length
  const score = total > 0 ? Math.round(((total - anomalies) / total) * 100) : 100

  // Compte les devices distincts en warning/critical (pas l'historique)
  const critical = snapshot.filter(d => d.analysis?.severity === 'critical').length
  const warning = snapshot.filter(d => d.analysis?.severity === 'warning').length

  return (
    <aside style={{
      gridArea: 'sidebar',
      background: 'var(--c-surface)',
      borderRight: '1px solid var(--c-border)',
      display: 'flex', flexDirection: 'column',
      overflowY: 'auto'
    }}>
      <div style={{ borderBottom: '1px solid var(--c-border)' }}>
        <ThreatMeter score={score} />
      </div>

      <div style={{
        padding: '10px 12px',
        borderBottom: '1px solid var(--c-border)',
        display: 'flex', flexDirection: 'column', gap: '3px'
      }}>
        <StatRow label="Appareils" value={`${online} / ${total}`} color="var(--c-blue)" />
        <StatRow label="Anomalies" value={anomalies} color={anomalies > 0 ? 'var(--c-red)' : 'var(--c-muted)'} />
        <StatRow label="Critique" value={critical} color={critical > 0 ? 'var(--c-red)' : 'var(--c-muted)'} />
        <StatRow label="Warning" value={warning} color={warning > 0 ? 'var(--c-amber)' : 'var(--c-muted)'} />
      </div>

      <DemoControls />
    </aside>
  )
}

export default Sidebar