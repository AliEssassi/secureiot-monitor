import { useState, useEffect } from "react"
import Header from "./components/Header"
import KpiBar from "./components/KpiBar"
import DeviceGrid from "./components/DeviceGrid"
import AlertFeed from "./components/AlertFeed"
import DemoControls from "./components/DemoControls"

function App() {
  const [snapshot, setSnapshot] = useState([])
  const [alerts, setAlerts] = useState([])
  const [isLive, setIsLive] = useState(false)

  const fetchData = async () => {
    try {
      const [snapshotRes, alertsRes] = await Promise.all([
        fetch('/api/snapshot'),
        fetch('/api/alerts')
      ])
      const snapshotData = await snapshotRes.json()
      const alertsData = await alertsRes.json()
      setSnapshot(snapshotData)
      setAlerts(alertsData)
      setIsLive(true)
    } catch (err) {
      console.error("Erreur fetch:", err)
      setIsLive(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 3000)
    return () => clearInterval(interval)
  }, [])

  const alertCount = alerts.filter(a =>
    a.severity === 'warning' || a.severity === 'critical'
  ).length

  const normalCount = snapshot.filter(d =>
    d.analysis?.is_anomaly === false
  ).length

  return (
    <div className="min-h-screen p-6 max-w-7xl mx-auto">
      <Header alertCount={alertCount} isLive={isLive} />
      <KpiBar
        deviceCount={snapshot.length}
        alertCount={alertCount}
        normalCount={normalCount}
      />
      <DemoControls />
      <DeviceGrid devices={snapshot} />
      <AlertFeed alerts={alerts} />
    </div>
  )
}

export default App