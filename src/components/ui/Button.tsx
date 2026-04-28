import { cn } from '../../lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'client' | 'glass' | 'dark'
type Size = 'xs' | 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: React.ReactNode
}

const variants: Record<Variant, string> = {
  primary:
    'bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white shadow-brand-sm hover:shadow-brand-md',
  secondary:
    'bg-stone-100 hover:bg-stone-200 active:bg-stone-200 text-stone-700 hover:text-stone-900',
  ghost:
    'hover:bg-stone-100 active:bg-stone-200 text-stone-500 hover:text-stone-800',
  danger:
    'bg-red-500 hover:bg-red-600 active:bg-red-700 text-white shadow-sm',
  outline:
    'border border-stone-200 hover:border-stone-300 bg-white hover:bg-stone-50 text-stone-700',
  client:
    'bg-sage-500 hover:bg-sage-600 active:bg-sage-700 text-white shadow-sm hover:shadow-md',
  glass:
    'bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white border border-white/20 hover:border-white/30',
  dark:
    'bg-surface text-white hover:bg-surface-soft border border-surface-border',
}

const sizes: Record<Size, string> = {
  xs: 'px-2.5 py-1 text-xs gap-1 rounded-lg',
  sm: 'px-3.5 py-1.5 text-sm gap-1.5 rounded-xl',
  md: 'px-4 py-2 text-sm gap-2 rounded-xl',
  lg: 'px-5 py-2.5 text-[15px] gap-2 rounded-xl',
}

export function Button({
  children, variant = 'primary', size = 'md',
  loading, icon, className, disabled, ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-medium transition-all duration-150',
        'disabled:opacity-50 disabled:cursor-not-allowed select-none',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {loading
        ? <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin shrink-0" />
        : icon
          ? <span className="shrink-0">{icon}</span>
          : null}
      {children}
    </button>
  )
}
