function KpiBar({ deviceCount, alertCount, normalCount }) {
  const healthScore = deviceCount > 0
    ? Math.round((normalCount / deviceCount) * 100)
    : 100

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">

      <div className="bg-gray-900 border border-gray-700/50 rounded-xl p-4">
        <p className="text-gray-400 text-sm mb-1">Appareils surveillés</p>
        <p className="text-3xl font-bold text-white">{deviceCount}</p>
      </div>

      <div className={`bg-gray-900 border rounded-xl p-4 ${
        alertCount > 0
          ? 'border-red-500/50'
          : 'border-gray-700/50'
      }`}>
        <p className="text-gray-400 text-sm mb-1">Alertes actives</p>
        <p className={`text-3xl font-bold ${
          alertCount > 0 ? 'text-red-400' : 'text-white'
        }`}>
          {alertCount}
        </p>
      </div>

      <div className={`bg-gray-900 border rounded-xl p-4 ${
        healthScore >= 80
          ? 'border-green-500/30'
          : healthScore >= 50
          ? 'border-yellow-500/30'
          : 'border-red-500/30'
      }`}>
        <p className="text-gray-400 text-sm mb-1">Score de santé</p>
        <p className={`text-3xl font-bold ${
          healthScore >= 80
            ? 'text-green-400'
            : healthScore >= 50
            ? 'text-yellow-400'
            : 'text-red-400'
        }`}>
          {healthScore}%
        </p>
      </div>

    </div>
  )
}

export default KpiBar