import { useState, useEffect } from 'react'

const TYPE_LABELS = {
  machine: 'CNC', router: 'GATEWAY', sensor: 'SNS',
  robot: 'RBT', smartmeter: 'PWR', camera: 'CAM'
}

const STATUS_COLORS = {
  secure: { stroke: '#1AB87E', fill: '#0D2620', glow: '#1AB87E' },
  exposed: { stroke: '#E8A840', fill: '#2A2010', glow: '#E8A840' },
  compromised: { stroke: '#E8405A', fill: '#2A1015', glow: '#E8405A' },
}

function NetworkTopology({ onNodeClick }) {
  const [topology, setTopology] = useState(null)

  useEffect(() => {
    const fetchTopology = async () => {
      try {
        const res = await fetch('/api/topology')
        if (res.ok) setTopology(await res.json())
      } catch (err) {
        console.error(err)
      }
    }
    fetchTopology()
    const iv = setInterval(fetchTopology, 2000)
    return () => clearInterval(iv)
  }, [])

  if (!topology) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--c-muted)' }}>
        Chargement de la topologie...
      </div>
    )
  }

  // Positionnement : passerelle au centre, devices en cercle autour
  const W = 640, H = 420
  const cx = W / 2, cy = H / 2
  const radius = 155

  const gateway = topology.nodes.find(n => n.is_gateway)
  const peripherals = topology.nodes.filter(n => !n.is_gateway)

  // Calcule la position de chaque device périphérique
  const nodePositions = {}
  nodePositions[topology.gateway_id] = { x: cx, y: cy }

  peripherals.forEach((node, i) => {
    const angle = (i / peripherals.length) * 2 * Math.PI - Math.PI / 2
    nodePositions[node.id] = {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    }
  })

  const gatewayCompromised = topology.gateway_compromised

  return (
    <div style={{
      background: 'var(--c-surface)',
      border: '1px solid var(--c-border)',
      borderRadius: '8px',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        background: 'var(--c-raised)',
        borderBottom: '1px solid var(--c-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', color: 'var(--c-muted)' }}>
            TOPOLOGIE RÉSEAU
          </span>
          {gatewayCompromised && (
            <span className="blink" style={{
              fontSize: '10px', fontWeight: 700, color: 'var(--c-red)',
              background: '#E8405A15', border: '1px solid #E8405A40',
              padding: '2px 8px', borderRadius: '3px', letterSpacing: '0.06em'
            }}>
              ▲ PASSERELLE COMPROMISE — RÉSEAU EXPOSÉ
            </span>
          )}
        </div>
        {/* Légende */}
        <div style={{ display: 'flex', gap: '12px', fontSize: '10px' }}>
          <LegendDot color="#1AB87E" label={`${topology.stats.secure} sûr`} />
          <LegendDot color="#E8A840" label={`${topology.stats.exposed} exposé`} />
          <LegendDot color="#E8405A" label={`${topology.stats.compromised} compromis`} />
        </div>
      </div>

      {/* SVG */}
      <div style={{ padding: '10px' }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block' }}>
          <defs>
            {/* Animation de flux sur les liens */}
            <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6" fill="none" stroke="currentColor" strokeWidth="1" />
            </marker>
          </defs>

          {/* LIENS */}
          {topology.links.map((link, i) => {
            const src = nodePositions[link.source]
            const tgt = nodePositions[link.target]
            if (!src || !tgt) return null

            const linkColor = link.status === 'threat'
              ? '#E8405A'
              : link.status === 'compromised'
              ? '#E8405A'
              : '#1C3550'

            const isActive = link.status !== 'normal'

            return (
              <g key={i}>
                {/* Ligne de base */}
                <line
                  x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
                  stroke={linkColor}
                  strokeWidth={isActive ? 2 : 1.2}
                  opacity={isActive ? 0.8 : 0.4}
                  style={{ transition: 'stroke 0.5s ease, opacity 0.5s ease' }}
                />
                {/* Particule animée sur les liens actifs (flux de données/menace) */}
                {isActive && (
                  <circle r="3" fill={linkColor}>
                    <animateMotion
                      dur="1.5s"
                      repeatCount="indefinite"
                      path={`M ${src.x} ${src.y} L ${tgt.x} ${tgt.y}`}
                    />
                  </circle>
                )}
              </g>
            )
          })}

          {/* NŒUDS */}
          {topology.nodes.map((node) => {
            const pos = nodePositions[node.id]
            if (!pos) return null

            const colors = STATUS_COLORS[node.node_status]
            const isGateway = node.is_gateway
            const size = isGateway ? 42 : 32

            return (
              <g
                key={node.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                style={{ cursor: 'pointer' }}
                onClick={() => onNodeClick && onNodeClick(node.id)}
              >
                {/* Halo pulsant pour les nœuds en alerte */}
                {node.node_status !== 'secure' && (
                  <circle r={size / 2 + 6} fill="none" stroke={colors.glow} strokeWidth="1.5" opacity="0.5">
                    <animate attributeName="r" values={`${size / 2 + 4};${size / 2 + 12};${size / 2 + 4}`} dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.6;0;0.6" dur="2s" repeatCount="indefinite" />
                  </circle>
                )}

                {/* Cercle principal */}
                <circle
                  r={size / 2}
                  fill={colors.fill}
                  stroke={colors.stroke}
                  strokeWidth={isGateway ? 2.5 : 2}
                  style={{ transition: 'fill 0.5s ease, stroke 0.5s ease' }}
                />

                {/* Label type */}
                <text
                  textAnchor="middle"
                  y={isGateway ? -2 : -1}
                  style={{
                    fill: colors.stroke, fontSize: isGateway ? '10px' : '8px',
                    fontWeight: 700, fontFamily: 'JetBrains Mono',
                    letterSpacing: '0.04em'
                  }}
                >
                  {TYPE_LABELS[node.type] || 'DEV'}
                </text>

                {/* ID device sous le nœud */}
                <text
                  textAnchor="middle"
                  y={size / 2 + 14}
                  style={{
                    fill: 'var(--c-text)', fontSize: '9px',
                    fontFamily: 'JetBrains Mono'
                  }}
                >
                  {node.id}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

function LegendDot({ color, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
      <span style={{ color: 'var(--c-muted)' }}>{label}</span>
    </div>
  )
}

export default NetworkTopology