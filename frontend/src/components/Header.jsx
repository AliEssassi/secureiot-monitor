function Header({ alertCount, isLive }) {
  return (
    <div className="flex items-center justify-between mb-6">
      
      {/* Titre + statut live */}
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold text-white">
          🛡️ SecureIoT Monitor
        </h1>
        {isLive && (
          <div className="flex items-center gap-2 bg-green-900/30 border border-green-500/30 rounded-full px-3 py-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-green-400 text-sm font-medium">LIVE</span>
          </div>
        )}
      </div>

      {/* Compteur d'alertes */}
      <div className="flex items-center gap-3">
        {alertCount > 0 && (
          <div className="flex items-center gap-2 bg-red-900/30 border border-red-500/30 rounded-full px-3 py-1">
            <span className="text-red-400 text-sm font-bold">
              ⚠ {alertCount} alerte{alertCount > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

    </div>
  )
}

export default Header