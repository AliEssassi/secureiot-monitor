import { useState } from "react"

const DEVICES = [
  { id: 'DEV-001', name: 'Machine-outil CNC', icon: '⚙️' },
  { id: 'DEV-002', name: 'Passerelle réseau', icon: '🌐' },
  { id: 'DEV-003', name: 'Capteur ambiance', icon: '📡' },
  { id: 'DEV-004', name: 'Robot collaboratif', icon: '🤖' },
  { id: 'DEV-005', name: 'Compteur énergie', icon: '⚡' },
  { id: 'DEV-006', name: 'Caméra sécurité', icon: '📷' },
]

const ANOMALY_TYPES = [
  { id: 'spike', label: 'Spike', description: 'Valeur anormalement élevée', color: 'text-red-400' },
  { id: 'drift', label: 'Drift', description: 'Dérive progressive', color: 'text-orange-400' },
  { id: 'flatline', label: 'Flatline', description: 'Signal bloqué', color: 'text-yellow-400' },
  { id: 'noise', label: 'Bruit', description: 'Signal instable', color: 'text-purple-400' },
]

function DemoControls() {
  const [selectedDevice, setSelectedDevice] = useState('DEV-002')
  const [selectedAnomaly, setSelectedAnomaly] = useState('spike')
  const [isLoading, setIsLoading] = useState(false)
  const [lastAction, setLastAction] = useState(null)

  const injectAnomaly = async () => {
    setIsLoading(true)
    try {
      await fetch('/api/inject-anomaly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_id: selectedDevice,
          anomaly_type: selectedAnomaly
        })
      })
      setLastAction(`✅ Anomalie "${selectedAnomaly}" injectée sur ${selectedDevice}`)
    } catch (err) {
      setLastAction('❌ Erreur lors de l\'injection')
    }
    setIsLoading(false)
  }

  const clearAnomaly = async () => {
    setIsLoading(true)
    try {
      await fetch(`/api/clear-anomaly/${selectedDevice}`, { method: 'POST' })
      setLastAction(`🟢 ${selectedDevice} remis en état normal`)
    } catch (err) {
      setLastAction('❌ Erreur lors du clear')
    }
    setIsLoading(false)
  }

  const clearAll = async () => {
    setIsLoading(true)
    try {
      await Promise.all(
        DEVICES.map(d =>
          fetch(`/api/clear-anomaly/${d.id}`, { method: 'POST' })
        )
      )
      setLastAction('🟢 Tous les appareils remis en état normal')
    } catch (err) {
      setLastAction('❌ Erreur')
    }
    setIsLoading(false)
  }

  return (
    <div className="bg-gray-900 border border-gray-700/50 rounded-xl p-4 mb-6">
      <h2 className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-4">
        🎮 Contrôles de démonstration
      </h2>

      <div className="grid grid-cols-2 gap-4 mb-4">

        {/* Sélection appareil */}
        <div>
          <p className="text-gray-400 text-xs mb-2">Appareil cible</p>
          <div className="grid grid-cols-2 gap-1">
            {DEVICES.map(device => (
              <button
                key={device.id}
                onClick={() => setSelectedDevice(device.id)}
                className={`text-left px-2 py-1.5 rounded-lg text-xs transition-all ${
                  selectedDevice === device.id
                    ? 'bg-violet-600/30 border border-violet-500/50 text-violet-300'
                    : 'bg-gray-800 border border-gray-700/30 text-gray-400 hover:border-gray-500'
                }`}
              >
                {device.icon} {device.id}
              </button>
            ))}
          </div>
        </div>

        {/* Sélection type d'anomalie */}
        <div>
          <p className="text-gray-400 text-xs mb-2">Type d'anomalie</p>
          <div className="space-y-1">
            {ANOMALY_TYPES.map(type => (
              <button
                key={type.id}
                onClick={() => setSelectedAnomaly(type.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all ${
                  selectedAnomaly === type.id
                    ? 'bg-violet-600/30 border border-violet-500/50'
                    : 'bg-gray-800 border border-gray-700/30 hover:border-gray-500'
                }`}
              >
                <span className={`font-bold ${type.color}`}>{type.label}</span>
                <span className="text-gray-500 ml-2">{type.description}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Boutons d'action */}
      <div className="flex gap-2">
        <button
          onClick={injectAnomaly}
          disabled={isLoading}
          className="flex-1 bg-red-600/80 hover:bg-red-600 border border-red-500/50 text-white font-medium py-2 px-4 rounded-lg text-sm transition-all disabled:opacity-50"
        >
          {isLoading ? '...' : '⚡ Injecter anomalie'}
        </button>
        <button
          onClick={clearAnomaly}
          disabled={isLoading}
          className="flex-1 bg-green-700/50 hover:bg-green-700/70 border border-green-500/30 text-green-300 font-medium py-2 px-4 rounded-lg text-sm transition-all disabled:opacity-50"
        >
          ✅ Clear appareil
        </button>
        <button
          onClick={clearAll}
          disabled={isLoading}
          className="bg-gray-700 hover:bg-gray-600 border border-gray-600 text-gray-300 font-medium py-2 px-4 rounded-lg text-sm transition-all disabled:opacity-50"
        >
          🔄 Reset tout
        </button>
      </div>

      {/* Feedback de la dernière action */}
      {lastAction && (
        <p className="text-xs text-gray-400 mt-3 font-mono">{lastAction}</p>
      )}
    </div>
  )
}

export default DemoControls