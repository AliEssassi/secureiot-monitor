function AlertFeed({ alerts }) {
  const severityConfig = {
    critical: {
      border: 'border-red-500/50',
      badge: 'bg-red-900/40 text-red-300',
      icon: '🔴',
      label: 'CRITIQUE'
    },
    warning: {
      border: 'border-yellow-500/50',
      badge: 'bg-yellow-900/40 text-yellow-300',
      icon: '⚠️',
      label: 'WARNING'
    },
    normal: {
      border: 'border-gray-600/30',
      badge: 'bg-gray-800 text-gray-400',
      icon: '🟢',
      label: 'INFO'
    }
  }

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const recentAlerts = [...alerts]
    .filter(a => a.severity === 'warning' || a.severity === 'critical')
    .reverse()
    .slice(0, 15)

  return (
    <div className="mb-6">
      <h2 className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-3">
        Feed d'alertes temps réel
      </h2>

      {recentAlerts.length === 0 ? (
        <div className="bg-gray-900 border border-gray-700/50 rounded-xl p-8 text-center">
          <p className="text-gray-500">Aucune alerte détectée</p>
          <p className="text-gray-600 text-sm mt-1">Le système surveille les appareils...</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {recentAlerts.map((alert) => {
            const config = severityConfig[alert.severity] || severityConfig.normal

            return (
              <div
                key={alert.id}
                className={`bg-gray-900 border ${config.border} rounded-lg p-3 flex items-start gap-3`}
              >
                {/* Icône + heure */}
                <div className="flex flex-col items-center gap-1 min-w-[40px]">
                  <span className="text-lg">{config.icon}</span>
                  <span className="text-gray-500 text-xs font-mono">
                    {formatTime(alert.timestamp)}
                  </span>
                </div>

                {/* Contenu */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${config.badge}`}>
                      {config.label}
                    </span>
                    <span className="text-white text-sm font-medium">
                      {alert.device_id}
                    </span>
                    <span className="text-gray-500 text-xs font-mono">
                      score: {alert.anomaly_score}
                    </span>
                  </div>

                  {/* Métriques affectées */}
                  {alert.affected_metrics?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {alert.affected_metrics.map((m) => (
                        <span
                          key={m.metric}
                          className="text-xs bg-gray-800 text-orange-300 px-2 py-0.5 rounded font-mono"
                        >
                          {m.metric}: {m.value} (+{m.deviation_pct}%)
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default AlertFeed