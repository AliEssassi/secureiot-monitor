import { useState, useEffect } from 'react'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import DeviceCard from './components/DeviceCard'
import AlertPanel from './components/AlertPanel'
import DetailPanel from './components/DetailPanel'

function App() {
  const [snapshot, setSnapshot] = useState([])
  const [alerts, setAlerts] = useState([])
  const [isLive, setIsLive] = useState(false)
  const [selectedId, setSelectedId] = useState(null)

  const fetchData = async () => {
    try {
      const [sr, ar] = await Promise.all([
        fetch('/api/snapshot'),
        fetch('/api/alerts')
      ])
      setSnapshot(await sr.json())
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

  // Compteur corrigé : basé sur l'état réel des devices, pas l'historique
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
        <div style={{
          display: 'flex', alignItems: 'center',
          marginBottom: '12px', paddingBottom: '10px',
          borderBottom: '1px solid var(--c-border)'
        }}>
          <span style={{ fontSize: '9px', fontWeight: 600, letterSpacing: '0.1em', color: 'var(--c-muted)' }}>
            APPAREILS SURVEILLÉS
          </span>
          <span style={{ fontSize: '9px', fontFamily: 'var(--mono)', color: 'var(--c-blue)', marginLeft: '10px' }}>
            {snapshot.length} actifs
          </span>
          <span style={{ fontSize: '9px', color: 'var(--c-muted)', marginLeft: 'auto', opacity: 0.6 }}>
            Cliquez une carte pour voir les courbes
          </span>
        </div>

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
      </main>

      <AlertPanel alerts={alerts} />
    </div>
  )
}

export default App