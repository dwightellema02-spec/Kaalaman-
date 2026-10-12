import type { Visual } from '../content/types'

// Draws a step's picture. `value` is the slider value for interactive steps.
export function VisualView({ visual, value }: { visual: Visual; value?: number }) {
  switch (visual.kind) {
    case 'fraction':
      return <FractionBar parts={visual.parts} shaded={value ?? visual.shaded ?? 0} />
    case 'line':
      return <LineGraph slope={value ?? visual.slope ?? 1} intercept={visual.intercept} point={visual.point} />
    case 'angle':
      return <Triangle a={value ?? visual.a ?? 60} b={visual.b} />
    case 'balance':
      return <Balance left={visual.left} right={visual.right} />
    case 'media':
      return visual.src.endsWith('.mp4') ? (
        <video className="media" src={visual.src} aria-label={visual.alt} autoPlay loop muted playsInline />
      ) : (
        <img className="media" src={visual.src} alt={visual.alt} />
      )
  }
}

function FractionBar({ parts, shaded }: { parts: number; shaded: number }) {
  const w = 320 / parts
  return (
    <svg className="visual" viewBox="-2 -2 324 74" role="img" aria-label={`${shaded} of ${parts} parts shaded`}>
      {Array.from({ length: parts }, (_, i) => (
        <rect key={i} x={i * w} y={0} width={w} height={48} className={i < shaded ? 'shade on' : 'shade'} />
      ))}
      <text x={160} y={68} textAnchor="middle" className="label">
        {shaded}/{parts}
      </text>
    </svg>
  )
}

function LineGraph({ slope, intercept, point }: { slope: number; intercept: number; point?: [number, number] }) {
  const s = 24 // pixels per unit, grid runs −5..5
  const px = (x: number) => 130 + x * s
  const py = (y: number) => 130 - y * s
  const ticks = Array.from({ length: 11 }, (_, i) => i - 5)
  const hit = point && Math.abs(slope * point[0] + intercept - point[1]) < 1e-9
  return (
    <svg className="visual graph" viewBox="0 0 260 260" role="img" aria-label={`Line y = ${slope}x + ${intercept}`}>
      <defs>
        <clipPath id="plot">
          <rect x={10} y={10} width={240} height={240} />
        </clipPath>
      </defs>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={px(t)} y1={10} x2={px(t)} y2={250} className={t === 0 ? 'axis' : 'grid'} />
          <line x1={10} y1={py(t)} x2={250} y2={py(t)} className={t === 0 ? 'axis' : 'grid'} />
        </g>
      ))}
      <line
        clipPath="url(#plot)"
        x1={px(-6)} y1={py(slope * -6 + intercept)}
        x2={px(6)} y2={py(slope * 6 + intercept)}
        className="plot-line"
      />
      {point && <circle cx={px(point[0])} cy={py(point[1])} r={6} className={hit ? 'target hit' : 'target'} />}
      <text x={14} y={24} className="label">
        y = {slope}x {intercept < 0 ? '−' : '+'} {Math.abs(intercept)}
      </text>
    </svg>
  )
}

function Triangle({ a, b }: { a: number; b: number }) {
  const rad = Math.PI / 180
  const c = 180 - a - b
  const L = 200
  const side = (L * Math.sin(b * rad)) / Math.sin((a + b) * rad) // length from A to the apex
  const pts: [number, number][] = [[0, 0], [L, 0], [side * Math.cos(a * rad), -side * Math.sin(a * rad)]]
  const xs = pts.map((p) => p[0])
  const ys = pts.map((p) => p[1])
  const pad = 30
  const minX = Math.min(...xs) - pad
  const minY = Math.min(...ys) - pad
  const w = Math.max(...xs) - minX + pad
  const h = Math.max(...ys) - minY + pad
  const cx = xs.reduce((p, q) => p + q) / 3
  const cy = ys.reduce((p, q) => p + q) / 3
  const scale = Math.max(w, h) / 260 // keep labels a steady size however big the triangle gets
  const labels: [string, number][] = [['A', a], ['B', b], ['C', c]]
  return (
    <svg className="visual" viewBox={`${minX} ${minY} ${w} ${h}`} role="img" aria-label={`Triangle with angles ${a}, ${b}, ${c}`}>
      <polygon points={pts.map((p) => p.join(',')).join(' ')} className="tri" strokeWidth={3 * scale} />
      {pts.map(([x, y], i) => {
        // Nudge each label from its corner toward the middle of the triangle.
        const dx = cx - x
        const dy = cy - y
        const d = Math.hypot(dx, dy)
        const k = Math.min(36 * scale, d * 0.6)
        return (
          <text key={i} x={x + (dx / d) * k} y={y + (dy / d) * k} textAnchor="middle" dominantBaseline="middle" className="label" style={{ fontSize: 14 * scale }}>
            {labels[i][0]} {labels[i][1]}°
          </text>
        )
      })}
    </svg>
  )
}

function Balance({ left, right }: { left: string; right: string }) {
  return (
    <svg className="visual" viewBox="0 0 320 170" role="img" aria-label={`${left} balances ${right}`}>
      <polygon points="160,60 140,150 180,150" className="stand" />
      <line x1={40} y1={60} x2={280} y2={60} className="beam" />
      {[[80, left], [240, right]].map(([x, text]) => (
        <g key={x as number}>
          <line x1={(x as number) - 40} y1={60} x2={(x as number) - 30} y2={100} className="string" />
          <line x1={(x as number) + 40} y1={60} x2={(x as number) + 30} y2={100} className="string" />
          <rect x={(x as number) - 50} y={100} width={100} height={36} rx={8} className="pan" />
          <text x={x as number} y={124} textAnchor="middle" className="label big">
            {text}
          </text>
        </g>
      ))}
    </svg>
  )
}
