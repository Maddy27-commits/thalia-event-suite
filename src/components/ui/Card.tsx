import { cn } from '../../lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  onClick?: () => void
  hover?: boolean
  glow?: 'brand' | 'sage' | 'amber' | 'rose'
}

const glowMap = {
  brand: 'ring-1 ring-brand-200 shadow-brand-sm',
  sage:  'ring-1 ring-sage-200 shadow-sage-100',
  amber: 'ring-1 ring-amber-200 shadow-amber-100',
  rose:  'ring-1 ring-rose-200 shadow-rose-100',
}

export function Card({ children, className, style, onClick, hover, glow }: CardProps) {
  return (
    <div
      onClick={onClick}
      style={style}
      className={cn(
        'bg-white rounded-2xl shadow-sm ring-1 ring-black/[0.04]',
        hover && 'hover:shadow-md hover:ring-black/[0.08] transition-all duration-200 cursor-pointer',
        glow && glowMap[glow],
        glow && 'shadow-md',
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
    <div className={cn('px-6 py-4 border-b border-gray-100/80', className)}>{children}</div>
  )
}

export function CardBody({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={cn('px-6 py-5', className)}>{children}</div>
}
