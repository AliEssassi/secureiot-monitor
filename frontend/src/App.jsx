import { useState, useEffect } from 'react'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import DeviceCard from './components/DeviceCard'
import AlertPanel from './components/AlertPanel'
import DetailPanel from './components/DetailPanel'
import IncidentModal from './components/IncidentModal'
import NetworkTopology from './components/NetworkTopology'


function App() {
  const [snapshot, setSnapshot] = useState([])
  const [alerts, setAlerts] = useState([])
  const [isLive, setIsLive] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [openIncident, setOpenIncident] = useState(null)
  const [activeTab, setActiveTab] = useState('devices')

  const fetchData = async () => {
    try {
      const [sr, ar, ir] = await Promise.all([
        fetch('/api/snapshot'),
        fetch('/api/alerts'),
        fetch('/api/incidents')
      ])
      const snap = await sr.json()
      const incs = await ir.json()

      // Map device → statut d'incident actif
      const statusByDevice = {}
      incs.forEach(inc => {
        if (inc.status !== 'resolved') {
          statusByDevice[inc.device_id] = inc.status
        }
      })
      // Enrichit chaque device avec le statut de son incident
      const enriched = snap.map(d => ({
        ...d,
        incidentStatus: statusByDevice[d.id] || null
      }))

      setSnapshot(enriched)
      setAlerts(await ar.json())
      setIsLive(true)
    } catch {
      setIsLive(false)
    }
  }

  useEffect(() => {
    fetchData()
    const iv = setInterval(fetchData, 3000)
    return () => clearInterval(iv)
  }, [])

  const anomalyCount = snapshot.filter(d => d.analysis?.is_anomaly).length

  const handleCardClick = (device) => {
    setSelectedId(prev => prev === device.id ? null : device.id)
  }

  const selectedDevice = snapshot.find(d => d.id === selectedId)

  return (
    <div style={{
      display: 'grid',
      height: '100vh',
      gridTemplateRows: '48px 1fr',
      gridTemplateColumns: '260px 1fr 290px',
      gridTemplateAreas: '"header header header" "sidebar main alerts"',
      overflow: 'hidden'
    }}>
      <Header isLive={isLive} alertCount={anomalyCount} />
      <Sidebar snapshot={snapshot} alerts={alerts} />

      <main style={{ gridArea: 'main', overflowY: 'auto', padding: '14px' }}>
        {/* Onglets */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '4px',
          marginBottom: '14px', paddingBottom: '12px',
          borderBottom: '1px solid var(--c-border)'
        }}>
          <button
            onClick={() => setActiveTab('devices')}
            style={{
              padding: '7px 14px', fontSize: '11px', fontWeight: 600,
              background: activeTab === 'devices' ? 'var(--c-raised)' : 'transparent',
              border: `1px solid ${activeTab === 'devices' ? 'var(--c-border)' : 'transparent'}`,
              borderRadius: '5px',
              color: activeTab === 'devices' ? 'var(--c-bright)' : 'var(--c-muted)',
              cursor: 'pointer', letterSpacing: '0.04em'
            }}
          >
            ▦ Appareils
          </button>
          <button
            onClick={() => setActiveTab('topology')}
            style={{
              padding: '7px 14px', fontSize: '11px', fontWeight: 600,
              background: activeTab === 'topology' ? 'var(--c-raised)' : 'transparent',
              border: `1px solid ${activeTab === 'topology' ? 'var(--c-border)' : 'transparent'}`,
              borderRadius: '5px',
              color: activeTab === 'topology' ? 'var(--c-bright)' : 'var(--c-muted)',
              cursor: 'pointer', letterSpacing: '0.04em'
            }}
          >
            ⬡ Topologie réseau
          </button>

          <span style={{ fontSize: '9px', fontFamily: 'var(--mono)', color: 'var(--c-blue)', marginLeft: '10px' }}>
            {snapshot.length} actifs
          </span>
          {anomalyCount > 0 && (
            <span className="blink" style={{
              marginLeft: 'auto', fontSize: '9px', fontWeight: 700,
              color: 'var(--c-red)', letterSpacing: '0.06em'
            }}>
              ▲ {anomalyCount} ANOMALIE{anomalyCount > 1 ? 'S' : ''}
            </span>
          )}
        </div>

        {/* Contenu selon l'onglet */}
        {activeTab === 'devices' ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {snapshot.map(device => (
                <DeviceCard
                  key={device.id}
                  device={device}
                  onClick={handleCardClick}
                  isSelected={selectedId === device.id}
                />
              ))}
            </div>
            {selectedDevice && (
              <DetailPanel device={selectedDevice} onClose={() => setSelectedId(null)} />
            )}
          </>
        ) : (
          <NetworkTopology onNodeClick={(deviceId) => {
            setActiveTab('devices')
            setSelectedId(deviceId)
          }} />
        )}
      </main>

      <AlertPanel onIncidentClick={setOpenIncident} />

      {openIncident && (
        <IncidentModal
          incidentId={openIncident}
          onClose={() => setOpenIncident(null)}
        />
      )}
    </div>
  )
}

export default App