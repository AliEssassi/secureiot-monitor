function Sparkline({ data, color, height = 28 }) {
  if (!data || data.length < 2) {
    return <div style={{ height: `${height}px` }} />
  }

  const width = 100
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((val - min) / range) * height
    return `${x},${y}`
  }).join(' ')

  const lastX = width
  const lastY = height - ((data[data.length - 1] - min) / range) * height

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      style={{ width: '100%', height: `${height}px`, display: 'block' }}
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={lastX} cy={lastY} r="1.8" fill={color} vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

export default Sparkline