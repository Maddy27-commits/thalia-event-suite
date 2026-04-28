import { cn } from '../../lib/utils'

type Variant = 'default' | 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'sage' | 'outline' | 'dark'

interface BadgeProps {
  children: React.ReactNode
  variant?: Variant
  className?: string
  dot?: boolean
}

const variants: Record<Variant, string> = {
  default:  'bg-stone-100 text-stone-600 ring-1 ring-stone-200/80',
  brand:    'bg-brand-100 text-brand-700 ring-1 ring-brand-200/80',
  success:  'bg-sage-50 text-sage-700 ring-1 ring-sage-200/80',
  warning:  'bg-amber-50 text-amber-700 ring-1 ring-amber-200/80',
  danger:   'bg-red-50 text-red-600 ring-1 ring-red-200/80',
  info:     'bg-sky-50 text-sky-700 ring-1 ring-sky-200/80',
  sage:     'bg-sage-50 text-sage-700 ring-1 ring-sage-200/80',
  outline:  'bg-transparent text-stone-500 ring-1 ring-stone-300',
  dark:     'bg-surface text-stone-100',
}

const dots: Record<Variant, string> = {
  default:  'bg-stone-400',
  brand:    'bg-brand-500',
  success:  'bg-sage-500',
  warning:  'bg-amber-500',
  danger:   'bg-red-500',
  info:     'bg-sky-500',
  sage:     'bg-sage-500',
  outline:  'bg-stone-400',
  dark:     'bg-stone-400',
}

export function Badge({ children, variant = 'default', className, dot }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
      variants[variant],
      className
    )}>
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dots[variant])} />}
      {children}
    </span>
  )
}
