import { cn } from '../../lib/utils'

// ─── Geometric Star Mark ──────────────────────────────────────────────────────
// A modern 4-point star: two overlapping thin diamonds at 90°.
// Reads cleanly at any size, works on light and dark.
export function ThaliaBloomMark({
  size = 36,
  className,
  dark = false,
}: {
  size?: number
  className?: string
  dark?: boolean
}) {
  const cx = size / 2
  const r  = size * 0.44   // outer point radius
  const w  = size * 0.12   // diamond waist half-width

  const star = `
    M ${cx} ${cx - r}
    L ${cx + w} ${cx}
    L ${cx} ${cx + r}
    L ${cx - w} ${cx}
    Z
  `
  const star2 = `
    M ${cx - r} ${cx}
    L ${cx} ${cx - w}
    L ${cx + r} ${cx}
    L ${cx} ${cx + w}
    Z
  `

  const goldA = dark ? '#E4BE58' : '#C4921A'
  const goldB = dark ? '#D6A530' : '#A87715'

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Thalia mark"
    >
      <defs>
        <linearGradient id={`tg-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={goldA} />
          <stop offset="100%" stopColor={goldB} />
        </linearGradient>
      </defs>
      {/* Vertical diamond */}
      <path d={star}  fill={`url(#tg-${size})`} />
      {/* Horizontal diamond — slightly lighter */}
      <path d={star2} fill={`url(#tg-${size})`} opacity="0.75" />
    </svg>
  )
}

// ─── Sidebar Logo ─────────────────────────────────────────────────────────────
// Mark + bold wordmark. dark=true for planner sidebar.
export function ThaliaSidebarLogo({
  dark = false,
  subtitle,
}: {
  dark?: boolean
  subtitle?: string
}) {
  return (
    <div className="flex items-center gap-3">
      {/* Mark container */}
      <div className={cn(
        'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
        dark
          ? 'bg-white/[0.08] ring-1 ring-white/10'
          : 'bg-brand-50 ring-1 ring-brand-100',
      )}>
        <ThaliaBloomMark size={24} dark={dark} />
      </div>

      {/* Wordmark */}
      <div>
        <p className={cn(
          'text-lg font-extrabold leading-none tracking-tight',
          dark ? 'text-white' : 'text-stone-900',
        )}>
          Thalia
        </p>
        {subtitle && (
          <p className={cn(
            'text-[9px] mt-1 font-semibold tracking-[0.18em] uppercase',
            dark ? 'text-brand-400/60' : 'text-stone-400',
          )}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Full Logo ────────────────────────────────────────────────────────────────
// Used in empty states, settings, splash screens.
export function ThaliaFullLogo({
  width = 200,
  className,
}: {
  width?: number
  className?: string
}) {
  // Aspect ratio: 3:1 (wide wordmark layout)
  const height = Math.round(width * 0.52)
  const cx     = width / 2
  const cy     = height * 0.36

  // Star proportions relative to height
  const r   = height * 0.22
  const w   = r * 0.28

  const star1 = `M ${cx} ${cy - r} L ${cx + w} ${cy} L ${cx} ${cy + r} L ${cx - w} ${cy} Z`
  const star2 = `M ${cx - r} ${cy} L ${cx} ${cy - w} L ${cx + r} ${cy} L ${cx} ${cy + w} Z`

  const textY   = cy + r + height * 0.25
  const tagY    = textY + height * 0.16
  const divY    = textY + height * 0.08
  const divHalf = width * 0.12

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Thalia — Event Studio"
    >
      <defs>
        <linearGradient id="tg-full" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#D6A530" />
          <stop offset="100%" stopColor="#A87715" />
        </linearGradient>
      </defs>

      {/* ── Star mark ── */}
      <path d={star1} fill="url(#tg-full)" />
      <path d={star2} fill="url(#tg-full)" opacity="0.7" />

      {/* ── Wordmark: bold sans-serif ── */}
      <text
        x={cx} y={textY}
        fontFamily="'Inter', system-ui, sans-serif"
        fontSize={height * 0.28}
        fontWeight="800"
        fill="#1A1714"
        textAnchor="middle"
        letterSpacing="-0.5"
      >
        Thalia
      </text>

      {/* ── Divider flanks ── */}
      <line x1={cx - divHalf - 6} y1={divY} x2={cx - 6} y2={divY} stroke="#D6A530" strokeWidth="0.8" strokeOpacity="0.6" />
      <line x1={cx + 6} y1={divY} x2={cx + divHalf + 6} y2={divY} stroke="#D6A530" strokeWidth="0.8" strokeOpacity="0.6" />

      {/* ── Tagline ── */}
      <text
        x={cx} y={tagY}
        fontFamily="'Inter', system-ui, sans-serif"
        fontSize={height * 0.09}
        fontWeight="500"
        fill="#857F77"
        textAnchor="middle"
        letterSpacing="3"
      >
        EVENT STUDIO
      </text>
    </svg>
  )
}

// ─── Wordmark Only ────────────────────────────────────────────────────────────
// Inline wordmark for headers, loading screens.
export function ThaliaWordmark({
  dark = false,
  size = 'md',
  className,
}: {
  dark?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const fontSizes = { sm: 16, md: 22, lg: 34 }
  const fs    = fontSizes[size]
  const totalW = fs * 4.2
  const totalH = fs * 1.6

  return (
    <svg
      width={totalW}
      height={totalH}
      viewBox={`0 0 ${totalW} ${totalH}`}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Thalia"
    >
      <text
        x={totalW / 2}
        y={fs}
        fontFamily="'Inter', system-ui, sans-serif"
        fontSize={fs}
        fontWeight="800"
        fill={dark ? '#FFFFFF' : '#1A1714'}
        textAnchor="middle"
        letterSpacing="-0.5"
      >
        Thalia
      </text>
      <text
        x={totalW / 2}
        y={totalH}
        fontFamily="'Inter', system-ui, sans-serif"
        fontSize={fs * 0.32}
        fontWeight="500"
        fill={dark ? '#D6A530' : '#857F77'}
        textAnchor="middle"
        letterSpacing="3"
      >
        EVENT STUDIO
      </text>
    </svg>
  )
}
