import { cn } from '../../lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  onClick?: () => void
  hover?: boolean
  glow?: 'brand' | 'sage' | 'amber' | 'rose' | 'plum'
  flush?: boolean   // removes default padding from CardBody
}

const glowMap = {
  brand: 'ring-1 ring-brand-200 shadow-brand-sm',
  sage:  'ring-1 ring-sage-200 shadow-[0_2px_8px_rgba(59,148,105,0.15)]',
  amber: 'ring-1 ring-amber-200 shadow-[0_2px_8px_rgba(251,191,36,0.15)]',
  rose:  'ring-1 ring-rose-200 shadow-[0_2px_8px_rgba(244,63,94,0.15)]',
  plum:  'ring-1 ring-plum-200 shadow-plum-sm',
}

export function Card({ children, className, style, onClick, hover, glow, flush }: CardProps) {
  return (
    <div
      onClick={onClick}
      style={style}
      className={cn(
        'bg-white rounded-2xl shadow-card ring-1 ring-black/[0.04]',
        hover && 'hover:shadow-card-hover hover:ring-black/[0.07] transition-all duration-200 cursor-pointer active:scale-[0.99]',
        glow && glowMap[glow],
        glow && 'shadow-md',
        flush && '[&>*]:px-0 [&>*]:py-0',
        className
      )}
    >
      {children}
    </div>
  )
}

export function CardHeader({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('px-5 py-4 border-b border-stone-100/80', className)}>
      {children}
    </div>
  )
}

export function CardBody({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('px-5 py-4 sm:px-6 sm:py-5', className)}>
      {children}
    </div>
  )
}
