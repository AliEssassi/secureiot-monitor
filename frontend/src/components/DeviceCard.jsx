function DeviceCard({ device }) {
  const status = device.analysis?.status || 'collecting'
  const score = device.analysis?.anomaly_score

  const statusConfig = {
    normal: {
      border: 'border-green-500/30',
      badge: 'bg-green-900/30 text-green-400',
      dot: 'bg-green-400',
      label: 'Normal'
    },
    anomaly: {
      border: 'border-red-500/50',
      badge: 'bg-red-900/30 text-red-400',
      dot: 'bg-red-400',
      label: 'Anomalie'
    },
    warning: {
      border: 'border-yellow-500/50',
      badge: 'bg-yellow-900/30 text-yellow-400',
      dot: 'bg-yellow-400',
      label: 'Warning'
    },
    collecting: {
      border: 'border-gray-600/30',
      badge: 'bg-gray-800 text-gray-400',
      dot: 'bg-gray-400',
      label: 'Collecte...'
    }
  }

  const config = statusConfig[status] || statusConfig.collecting

  const typeIcons = {
    machine: '⚙️',
    router: '🌐',
    sensor: '📡',
    robot: '🤖',
    smartmeter: '⚡',
    camera: '📷'
  }

  return (
    <div className={`bg-gray-900 border ${config.border} rounded-xl p-4 transition-all duration-300`}>

      {/* En-tête de la carte */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{typeIcons[device.type] || '📦'}</span>
          <div>
            <p className="text-white font-medium text-sm">{device.name}</p>
            <p className="text-gray-500 text-xs">{device.id}</p>
          </div>
        </div>
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${config.badge}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${config.dot} ${status === 'anomaly' ? 'animate-pulse' : ''}`} />
          {config.label}
        </div>
      </div>

      {/* Métriques */}
      <div className="space-y-2">
        {Object.entries(device.metrics || {}).map(([key, metric]) => (
          <div key={key} className="flex justify-between items-center">
            <span className="text-gray-400 text-xs capitalize">
              {key.replace(/_/g, ' ')}
            </span>
            <span className={`text-xs font-mono font-medium ${
              status === 'anomaly' ? 'text-red-300' : 'text-gray-200'
            }`}>
              {metric.value} {metric.unit}
            </span>
          </div>
        ))}
      </div>

      {/* Score ML */}
      {score !== undefined && (
        <div className="mt-3 pt-3 border-t border-gray-700/50">
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-xs">Score ML</span>
            <span className={`text-xs font-mono ${
              score < -0.15 ? 'text-red-400' :
              score < -0.05 ? 'text-yellow-400' :
              'text-green-400'
            }`}>
              {score}
            </span>
          </div>
        </div>
      )}

    </div>
  )
}

export default DeviceCard