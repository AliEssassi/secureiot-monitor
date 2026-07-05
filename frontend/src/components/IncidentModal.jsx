import { useState, useEffect } from 'react'

const STATUS_CONFIG = {
  new: { label: 'Nouveau', color: 'var(--c-red)', hex: '#E8405A' },
  in_progress: { label: 'En cours', color: 'var(--c-amber)', hex: '#E8A840' },
  resolved: { label: 'Résolu', color: 'var(--c-green)', hex: '#1AB87E' },
}

function IncidentModal({ incidentId, onClose }) {
  const [aiAnalysis, setAiAnalysis] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [incident, setIncident] = useState(null)
  const [updating, setUpdating] = useState(false)

  const fetchIncident = async () => {
    try {
      const res = await fetch(`/api/incidents/${incidentId}`)
      if (res.ok) setIncident(await res.json())
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    if (!incidentId) return
    setAiAnalysis(null)
    fetchIncident()
    const iv = setInterval(fetchIncident, 2000)
    return () => clearInterval(iv)
  }, [incidentId])

  const changeStatus = async (newStatus) => {
    setUpdating(true)
    try {
      await fetch(`/api/incidents/${incidentId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      if (newStatus === 'resolved' && incident?.device_id) {
        await fetch(`/api/clear-anomaly/${incident.device_id}`, { method: 'POST' })
      }
      await fetchIncident()
    } catch (err) {
      console.error(err)
    }
    setUpdating(false)
  }

  const runAiAnalysis = async () => {
    setAnalyzing(true)
    setAiAnalysis(null)
    try {
      const res = await fetch(`/api/incidents/${incidentId}/analyze`, { method: 'POST' })
      const data = await res.json()
      setAiAnalysis(data.analysis)
    } catch (err) {
      setAiAnalysis("Erreur lors de l'analyse. Réessayez.")
    }
    setAnalyzing(false)
  }

  if (!incidentId) return null

  const fmt = ts => new Date(ts).toLocaleTimeString('fr-FR', {
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  })
  const fmtFull = ts => new Date(ts).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit'
  })

  const sev = incident?.severity === 'critical'
  const sevColor = sev ? 'var(--c-red)' : 'var(--c-amber)'
  const sevHex = sev ? '#E8405A' : '#E8A840'
  const status = incident ? STATUS_CONFIG[incident.status] : STATUS_CONFIG.new

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(3, 7, 14, 0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px'
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--c-surface)',
          border: '1px solid var(--c-border)',
          borderRadius: '10px',
          width: '100%', maxWidth: '620px',
          maxHeight: '85vh',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
        }}
      >
        {!incident ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--c-muted)' }}>
            Chargement...
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{
              padding: '16px 20px',
              background: 'var(--c-raised)',
              borderBottom: `1px solid var(--c-border)`,
              borderLeft: `3px solid ${sevColor}`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em',
                    color: sevColor, background: `${sevHex}15`,
                    border: `1px solid ${sevHex}30`,
                    padding: '3px 8px', borderRadius: '3px'
                  }}>
                    {sev ? 'CRITIQUE' : 'WARNING'}
                  </span>
                  <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--c-bright)', fontFamily: 'var(--mono)' }}>
                    {incident.id}
                  </span>
                </div>
                <button onClick={onClose} style={{
                  background: 'transparent', border: '1px solid var(--c-border)',
                  borderRadius: '4px', color: 'var(--c-muted)',
                  fontSize: '12px', padding: '5px 12px', cursor: 'pointer'
                }}>✕</button>
              </div>

              {/* Statut actuel */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
                <span style={{ fontSize: '11px', color: 'var(--c-muted)' }}>Statut :</span>
                <span style={{
                  fontSize: '11px', fontWeight: 600, color: status.color,
                  background: `${status.hex}15`, border: `1px solid ${status.hex}40`,
                  padding: '3px 10px', borderRadius: '3px'
                }}>
                  ● {status.label}
                </span>
              </div>
            </div>

            {/* Body scrollable */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>

              {/* Infos clés */}
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '10px', marginBottom: '20px'
              }}>
                <InfoCell label="Appareil" value={incident.device_id} mono />
                <InfoCell label="Occurrences" value={incident.occurrences} mono />
                <InfoCell label="Score actuel" value={incident.latest_score} mono color={sevColor} />
              </div>

              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '10px', marginBottom: '20px'
              }}>
                <InfoCell label="Première détection" value={fmtFull(incident.created_at)} />
                <InfoCell label="Dernière activité" value={fmtFull(incident.last_seen)} />
              </div>

              {/* Métriques affectées */}
              {incident.affected_metrics?.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <div style={{
                    fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em',
                    color: 'var(--c-muted)', marginBottom: '8px'
                  }}>
                    MÉTRIQUES AFFECTÉES
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {incident.affected_metrics.map(m => (
                      <div key={m.metric} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        background: 'var(--c-raised)', border: '1px solid var(--c-border)',
                        borderRadius: '5px', padding: '8px 12px'
                      }}>
                        <span style={{
                          fontSize: '12px', color: 'var(--c-text)',
                          textTransform: 'capitalize', fontWeight: 500
                        }}>
                          {m.metric.replace(/_/g, ' ')}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontSize: '12px', fontFamily: 'var(--mono)', color: 'var(--c-bright)' }}>
                            {m.value}
                          </span>
                          {m.deviation_pct !== 0 && (
                            <span style={{
                              fontSize: '11px', fontFamily: 'var(--mono)', fontWeight: 600,
                              color: sevColor, minWidth: '54px', textAlign: 'right'
                            }}>
                              {m.deviation_pct > 0 ? '▲' : '▼'}{Math.abs(m.deviation_pct)}%
                            </span>
                          )}
                          {m.z_score > 0 && (
                            <span style={{
                              fontSize: '10px', fontFamily: 'var(--mono)', color: 'var(--c-muted)',
                              minWidth: '60px', textAlign: 'right'
                            }}>
                              z={m.z_score}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Analyse IA */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  marginBottom: '10px'
                }}>
                  <span style={{
                    fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em',
                    color: 'var(--c-muted)'
                  }}>
                    ANALYSE IA
                  </span>
                  {!aiAnalysis && !analyzing && (
                    <button
                      onClick={runAiAnalysis}
                      style={{
                        fontSize: '11px', fontWeight: 600,
                        color: 'var(--c-purple)',
                        background: '#9B6FE815',
                        border: '1px solid #9B6FE840',
                        borderRadius: '4px',
                        padding: '5px 12px', cursor: 'pointer'
                      }}
                    >
                      ✦ Analyser avec l'IA
                    </button>
                  )}
                </div>

                {analyzing && (
                  <div style={{
                    padding: '16px',
                    background: 'var(--c-raised)',
                    border: '1px solid var(--c-border)',
                    borderRadius: '6px',
                    display: 'flex', alignItems: 'center', gap: '10px'
                  }}>
                    <div className="blink" style={{ color: 'var(--c-purple)', fontSize: '14px' }}>✦</div>
                    <span style={{ fontSize: '12px', color: 'var(--c-muted)' }}>
                      Analyse en cours...
                    </span>
                  </div>
                )}

                {aiAnalysis && (
                  <div style={{
                    padding: '14px 16px',
                    background: '#9B6FE808',
                    border: '1px solid #9B6FE825',
                    borderRadius: '6px',
                    borderLeft: '3px solid var(--c-purple)'
                  }}>
                    <div style={{
                      fontSize: '12px', lineHeight: 1.7, color: 'var(--c-text)',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {formatAiText(aiAnalysis)}
                    </div>
                    <div style={{
                      marginTop: '10px', paddingTop: '10px',
                      borderTop: '1px solid #9B6FE820',
                      fontSize: '9px', color: 'var(--c-muted)',
                      display: 'flex', alignItems: 'center', gap: '5px'
                    }}>
                      <span style={{ color: 'var(--c-purple)' }}>✦</span>
                      Généré par Claude Haiku · à titre d'aide à la décision
                    </div>
                  </div>
                )}
              </div>

              {/* Timeline */}
              <div>
                <div style={{
                  fontSize: '10px', fontWeight: 600, letterSpacing: '0.08em',
                  color: 'var(--c-muted)', marginBottom: '10px'
                }}>
                  JOURNAL D'ÉVÉNEMENTS
                </div>
                <div style={{
                  display: 'flex', flexDirection: 'column',
                  borderLeft: '1px solid var(--c-border)',
                  paddingLeft: '14px', gap: '10px'
                }}>
                  {[...incident.timeline].reverse().slice(0, 15).map((event, i) => {
                    const isStatus = event.event === 'status_change'
                    const isCreated = event.event === 'created'
                    const dotColor = isCreated ? sevHex : isStatus ? '#E8A840' : '#3A5070'

                    return (
                      <div key={i} style={{ position: 'relative' }}>
                        <div style={{
                          position: 'absolute', left: '-18px', top: '3px',
                          width: '7px', height: '7px', borderRadius: '50%',
                          background: dotColor,
                          border: '2px solid var(--c-surface)'
                        }} />
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'baseline' }}>
                          <span style={{
                            fontSize: '11px', fontFamily: 'var(--mono)',
                            color: 'var(--c-muted)', flexShrink: 0
                          }}>
                            {fmt(event.timestamp)}
                          </span>
                          <span style={{
                            fontSize: '12px',
                            color: isStatus || isCreated ? 'var(--c-text)' : 'var(--c-muted)',
                            fontWeight: isStatus || isCreated ? 500 : 400
                          }}>
                            {event.detail}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Footer — actions */}
            <div style={{
              padding: '14px 20px',
              background: 'var(--c-raised)',
              borderTop: '1px solid var(--c-border)',
              display: 'flex', gap: '8px'
            }}>
              {incident.status === 'new' && (
                <button
                  onClick={() => changeStatus('in_progress')}
                  disabled={updating}
                  style={{
                    flex: 1, padding: '10px',
                    background: 'var(--c-amber)',
                    border: '1px solid #C88A20',
                    borderRadius: '5px',
                    color: '#2A1A02', fontSize: '12px', fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Prendre en charge
                </button>
              )}

              {incident.status === 'in_progress' && (
                <>
                  <div style={{
                    flex: 1, padding: '10px',
                    background: '#E8A84018',
                    border: '1px solid var(--c-amber)',
                    borderRadius: '5px',
                    color: 'var(--c-amber)', fontSize: '12px', fontWeight: 600,
                    textAlign: 'center'
                  }}>
                    ● En cours de traitement
                  </div>
                  <button
                    onClick={() => changeStatus('resolved')}
                    disabled={updating}
                    style={{
                      flex: 1, padding: '10px',
                      background: 'var(--c-green)',
                      border: '1px solid #0F9E68',
                      borderRadius: '5px',
                      color: '#04120C', fontSize: '12px', fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Marquer résolu
                  </button>
                </>
              )}

              {incident.status === 'resolved' && (
                <div style={{
                  flex: 1, padding: '10px',
                  background: '#1AB87E18',
                  border: '1px solid var(--c-green)',
                  borderRadius: '5px',
                  color: 'var(--c-green)', fontSize: '12px', fontWeight: 600,
                  textAlign: 'center'
                }}>
                  ✓ Incident résolu
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function InfoCell({ label, value, mono, color }) {
  return (
    <div style={{
      background: 'var(--c-raised)', border: '1px solid var(--c-border)',
      borderRadius: '5px', padding: '8px 10px'
    }}>
      <div style={{ fontSize: '10px', color: 'var(--c-muted)', letterSpacing: '0.04em', marginBottom: '3px' }}>
        {label}
      </div>
      <div style={{
        fontSize: '13px', fontWeight: 500,
        color: color || 'var(--c-bright)',
        fontFamily: mono ? 'var(--mono)' : 'Inter'
      }}>
        {value}
      </div>
    </div>
  )
}

function formatAiText(text) {
  // Découpe le texte en segments et met en gras les **titres**
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} style={{ color: 'var(--c-purple)', fontWeight: 600 }}>
          {part.slice(2, -2)}
        </strong>
      )
    }
    return <span key={i}>{part}</span>
  })
}
export default IncidentModal