import DeviceCard from "./DeviceCard"

function DeviceGrid({ devices }) {
  return (
    <div className="mb-6">
      <h2 className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-3">
        Appareils surveillés
      </h2>
      <div className="grid grid-cols-3 gap-4">
        {devices.map(device => (
          <DeviceCard key={device.id} device={device} />
        ))}
      </div>
    </div>
  )
}

export default DeviceGrid