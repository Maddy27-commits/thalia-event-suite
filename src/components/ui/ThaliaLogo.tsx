import { cn } from '../../lib/utils'

// ─── Bloom Mark ───────────────────────────────────────────────────────────────
// Extracted from the full logo — the central botanical bloom only.
// Works on both light and dark backgrounds.
export function ThaliaBloomMark({
  size = 36,
  className,
}: {
  size?: number
  className?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="277 103 126 126"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Thalia bloom mark"
    >
      {/* Outer decorative rings */}
      <circle cx="340" cy="166" r="63" fill="none" stroke="#E0DBD4" strokeWidth="0.8" />
      <circle cx="340" cy="166" r="56" fill="none" stroke="#E8D5BA" strokeWidth="0.5" />

      {/* Outer 8 petals — very soft */}
      <g fill="#B8956A" opacity="0.18">
        <ellipse cx="340" cy="130" rx="11" ry="26" />
        <ellipse cx="340" cy="130" rx="11" ry="26" transform="rotate(45 340 166)" />
        <ellipse cx="340" cy="130" rx="11" ry="26" transform="rotate(90 340 166)" />
        <ellipse cx="340" cy="130" rx="11" ry="26" transform="rotate(135 340 166)" />
        <ellipse cx="340" cy="130" rx="11" ry="26" transform="rotate(180 340 166)" />
        <ellipse cx="340" cy="130" rx="11" ry="26" transform="rotate(225 340 166)" />
        <ellipse cx="340" cy="130" rx="11" ry="26" transform="rotate(270 340 166)" />
        <ellipse cx="340" cy="130" rx="11" ry="26" transform="rotate(315 340 166)" />
      </g>

      {/* Mid 6 petals */}
      <g fill="#B8956A" opacity="0.35">
        <ellipse cx="340" cy="145" rx="8" ry="18" />
        <ellipse cx="340" cy="145" rx="8" ry="18" transform="rotate(60 340 166)" />
        <ellipse cx="340" cy="145" rx="8" ry="18" transform="rotate(120 340 166)" />
        <ellipse cx="340" cy="145" rx="8" ry="18" transform="rotate(180 340 166)" />
        <ellipse cx="340" cy="145" rx="8" ry="18" transform="rotate(240 340 166)" />
        <ellipse cx="340" cy="145" rx="8" ry="18" transform="rotate(300 340 166)" />
      </g>

      {/* Inner 5 petals */}
      <g fill="#B8956A" opacity="0.6">
        <ellipse cx="340" cy="152" rx="5.5" ry="12" />
        <ellipse cx="340" cy="152" rx="5.5" ry="12" transform="rotate(72 340 166)" />
        <ellipse cx="340" cy="152" rx="5.5" ry="12" transform="rotate(144 340 166)" />
        <ellipse cx="340" cy="152" rx="5.5" ry="12" transform="rotate(216 340 166)" />
        <ellipse cx="340" cy="152" rx="5.5" ry="12" transform="rotate(288 340 166)" />
      </g>

      {/* Centre disc glow */}
      <circle cx="340" cy="166" r="20" fill="#B8956A" opacity="0.18" />
      <circle cx="340" cy="166" r="13" fill="#B8956A" opacity="0.5" />
      {/* Centre dot */}
      <circle cx="340" cy="166" r="6" fill="#2C2420" />
      {/* Highlight */}
      <circle cx="338" cy="164" r="2" fill="#FAF8F4" opacity="0.55" />
    </svg>
  )
}

// ─── Sidebar Logo ─────────────────────────────────────────────────────────────
// Bloom mark + "THALIA" wordmark side by side.
// dark=true for planner's dark sidebar, dark=false for client's white sidebar.
export function ThaliaSidebarLogo({
  dark = false,
  subtitle,
}: {
  dark?: boolean
  subtitle?: string
}) {
  return (
    <div className="flex items-center gap-3">
      <div className={cn(
        'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-md',
        dark ? 'bg-white/8 ring-1 ring-white/10' : 'bg-brand-50 ring-1 ring-brand-100',
      )}>
        <ThaliaBloomMark size={30} />
      </div>
      <div>
        <p className={cn(
          'font-display font-semibold text-lg leading-none tracking-wide',
          dark ? 'text-white' : 'text-stone-900',
        )}>
          Thalia
        </p>
        {subtitle && (
          <p className={cn(
            'text-[10px] mt-0.5 font-medium tracking-widest uppercase',
            dark ? 'text-brand-400/80' : 'text-stone-400',
          )}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Full Logo ────────────────────────────────────────────────────────────────
// The complete branded logo: wreath + bloom + wordmark + tagline.
// Use for splash screens, empty states, and hero moments.
export function ThaliaFullLogo({
  width = 340,
  className,
}: {
  width?: number
  className?: string
}) {
  const h = Math.round(width * (420 / 680))
  return (
    <svg
      width={width}
      height={h}
      viewBox="110 22 460 376"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Thalia — Event Studio"
    >
      {/* Card background */}
      <rect x="110" y="22" width="460" height="376" rx="20" fill="#FFFFFF" stroke="#E8D5BA" strokeWidth="1" />

      {/* ── Left Laurel Wreath ── */}
      <g fill="#7A8C6E">
        <ellipse cx="231" cy="220" rx="14" ry="6" transform="rotate(-50 231 220)" />
        <ellipse cx="220" cy="200" rx="14" ry="5.5" transform="rotate(-38 220 200)" />
        <ellipse cx="215" cy="179" rx="14" ry="5.5" transform="rotate(-25 215 179)" />
        <ellipse cx="215" cy="158" rx="14" ry="5" transform="rotate(-12 215 158)" />
        <ellipse cx="222" cy="138" rx="14" ry="5" transform="rotate(4 222 138)" />
        <ellipse cx="234" cy="121" rx="14" ry="5" transform="rotate(18 234 121)" />
        <ellipse cx="250" cy="108" rx="13" ry="5" transform="rotate(33 250 108)" />
        <ellipse cx="269" cy="98" rx="13" ry="5" transform="rotate(47 269 98)" />
        <ellipse cx="291" cy="91" rx="13" ry="5" transform="rotate(61 291 91)" />
        <ellipse cx="314" cy="88" rx="12" ry="5" transform="rotate(74 314 88)" />
      </g>
      <path d="M340 244 Q280 242 228 220" fill="none" stroke="#7A8C6E" strokeWidth="1.5" strokeOpacity="0.45" />
      <path d="M340 89 Q295 88 238 108" fill="none" stroke="#7A8C6E" strokeWidth="1.5" strokeOpacity="0.45" />

      {/* ── Right Laurel Wreath ── */}
      <g fill="#7A8C6E">
        <ellipse cx="449" cy="220" rx="14" ry="6" transform="rotate(50 449 220)" />
        <ellipse cx="460" cy="200" rx="14" ry="5.5" transform="rotate(38 460 200)" />
        <ellipse cx="465" cy="179" rx="14" ry="5.5" transform="rotate(25 465 179)" />
        <ellipse cx="465" cy="158" rx="14" ry="5" transform="rotate(12 465 158)" />
        <ellipse cx="458" cy="138" rx="14" ry="5" transform="rotate(-4 458 138)" />
        <ellipse cx="446" cy="121" rx="14" ry="5" transform="rotate(-18 446 121)" />
        <ellipse cx="430" cy="108" rx="13" ry="5" transform="rotate(-33 430 108)" />
        <ellipse cx="411" cy="98" rx="13" ry="5" transform="rotate(-47 411 98)" />
        <ellipse cx="389" cy="91" rx="13" ry="5" transform="rotate(-61 389 91)" />
        <ellipse cx="366" cy="88" rx="12" ry="5" transform="rotate(-74 366 88)" />
      </g>
      <path d="M340 244 Q400 242 452 220" fill="none" stroke="#7A8C6E" strokeWidth="1.5" strokeOpacity="0.45" />
      <path d="M340 89 Q385 88 442 108" fill="none" stroke="#7A8C6E" strokeWidth="1.5" strokeOpacity="0.45" />

      {/* ── Wreath Bow ── */}
      <path d="M294 244 Q317 256 340 252 Q363 256 386 244" fill="none" stroke="#B8956A" strokeWidth="2" strokeLinecap="round" />
      <circle cx="340" cy="252" r="3.5" fill="#B8956A" />
      <path d="M294 244 Q274 251 262 247" fill="none" stroke="#B8956A" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M386 244 Q406 251 418 247" fill="none" stroke="#B8956A" strokeWidth="1.5" strokeLinecap="round" />

      {/* ── Central Bloom ── */}
      <circle cx="340" cy="166" r="63" fill="none" stroke="#E0DBD4" strokeWidth="0.8" />
      <circle cx="340" cy="166" r="56" fill="none" stroke="#E8D5BA" strokeWidth="0.5" />
      <g fill="#B8956A" opacity="0.12">
        <ellipse cx="340" cy="130" rx="11" ry="26" />
        <ellipse cx="340" cy="130" rx="11" ry="26" transform="rotate(45 340 166)" />
        <ellipse cx="340" cy="130" rx="11" ry="26" transform="rotate(90 340 166)" />
        <ellipse cx="340" cy="130" rx="11" ry="26" transform="rotate(135 340 166)" />
        <ellipse cx="340" cy="130" rx="11" ry="26" transform="rotate(180 340 166)" />
        <ellipse cx="340" cy="130" rx="11" ry="26" transform="rotate(225 340 166)" />
        <ellipse cx="340" cy="130" rx="11" ry="26" transform="rotate(270 340 166)" />
        <ellipse cx="340" cy="130" rx="11" ry="26" transform="rotate(315 340 166)" />
      </g>
      <g fill="#B8956A" opacity="0.28">
        <ellipse cx="340" cy="145" rx="8" ry="18" />
        <ellipse cx="340" cy="145" rx="8" ry="18" transform="rotate(60 340 166)" />
        <ellipse cx="340" cy="145" rx="8" ry="18" transform="rotate(120 340 166)" />
        <ellipse cx="340" cy="145" rx="8" ry="18" transform="rotate(180 340 166)" />
        <ellipse cx="340" cy="145" rx="8" ry="18" transform="rotate(240 340 166)" />
        <ellipse cx="340" cy="145" rx="8" ry="18" transform="rotate(300 340 166)" />
      </g>
      <g fill="#B8956A" opacity="0.5">
        <ellipse cx="340" cy="152" rx="5.5" ry="12" />
        <ellipse cx="340" cy="152" rx="5.5" ry="12" transform="rotate(72 340 166)" />
        <ellipse cx="340" cy="152" rx="5.5" ry="12" transform="rotate(144 340 166)" />
        <ellipse cx="340" cy="152" rx="5.5" ry="12" transform="rotate(216 340 166)" />
        <ellipse cx="340" cy="152" rx="5.5" ry="12" transform="rotate(288 340 166)" />
      </g>
      <circle cx="340" cy="166" r="20" fill="#B8956A" opacity="0.14" />
      <circle cx="340" cy="166" r="13" fill="#B8956A" opacity="0.45" />
      <circle cx="340" cy="166" r="6" fill="#2C2420" />
      <circle cx="338" cy="164" r="2" fill="#FAF8F4" opacity="0.5" />

      {/* ── Wordmark ── */}
      <text
        x="340" y="302"
        fontFamily="'Cormorant Garamond', Palatino, Georgia, serif"
        fontSize="56"
        fontWeight="500"
        fill="#1A1714"
        textAnchor="middle"
        letterSpacing="10"
      >
        THALIA
      </text>

      {/* Flanking lines */}
      <line x1="163" y1="323" x2="260" y2="323" stroke="#B8956A" strokeWidth="0.6" />
      <line x1="420" y1="323" x2="517" y2="323" stroke="#B8956A" strokeWidth="0.6" />
      <text x="275" y="327" fontFamily="Georgia, serif" fontSize="9" fill="#B8956A" textAnchor="middle">✦</text>
      <text x="405" y="327" fontFamily="Georgia, serif" fontSize="9" fill="#B8956A" textAnchor="middle">✦</text>

      {/* Tagline */}
      <text
        x="340" y="327"
        fontFamily="'DM Sans', Helvetica, sans-serif"
        fontSize="10"
        fontWeight="300"
        fill="#6B6560"
        textAnchor="middle"
        letterSpacing="4"
      >
        EVENT STUDIO
      </text>

      {/* Greek attribution */}
      <text
        x="340" y="360"
        fontFamily="'Cormorant Garamond', Georgia, serif"
        fontSize="14"
        fontStyle="italic"
        fontWeight="400"
        fill="#B8956A"
        textAnchor="middle"
        letterSpacing="1.5"
      >
        Muse of celebration
      </text>
    </svg>
  )
}

// ─── Wordmark Only ────────────────────────────────────────────────────────────
// Just "THALIA" with flanking lines — for header strips, loading screens.
export function ThaliaWordmark({
  dark = false,
  size = 'md',
  className,
}: {
  dark?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const fontSize = size === 'sm' ? 18 : size === 'md' ? 28 : 42
  const spacing  = size === 'sm' ? 5  : size === 'md' ? 8  : 12
  const lineW    = size === 'sm' ? 30 : size === 'md' ? 50 : 80
  const totalW   = (fontSize * 6) + (lineW * 2) + 32
  const cy       = fontSize + 4

  return (
    <svg
      width={totalW}
      height={cy + 16}
      viewBox={`0 0 ${totalW} ${cy + 16}`}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Thalia"
    >
      <text
        x={totalW / 2} y={cy}
        fontFamily="'Cormorant Garamond', Georgia, serif"
        fontSize={fontSize}
        fontWeight="500"
        fill={dark ? '#FFFFFF' : '#1A1714'}
        textAnchor="middle"
        letterSpacing={spacing}
      >
        THALIA
      </text>
      {/* Flanking lines + stars */}
      <line x1="8" y1={cy + 8} x2={lineW + 2} y2={cy + 8} stroke="#B8956A" strokeWidth="0.7" />
      <line x1={totalW - lineW - 2} y1={cy + 8} x2={totalW - 8} y2={cy + 8} stroke="#B8956A" strokeWidth="0.7" />
      <text x={lineW + 10} y={cy + 12} fontFamily="Georgia" fontSize="7" fill="#B8956A" textAnchor="middle">✦</text>
      <text x={totalW - lineW - 10} y={cy + 12} fontFamily="Georgia" fontSize="7" fill="#B8956A" textAnchor="middle">✦</text>
      <text
        x={totalW / 2} y={cy + 12}
        fontFamily="Helvetica, sans-serif"
        fontSize={size === 'sm' ? 7 : 8}
        fontWeight="300"
        fill={dark ? '#B8956A' : '#6B6560'}
        textAnchor="middle"
        letterSpacing="3"
      >
        EVENT STUDIO
      </text>
    </svg>
  )
}
