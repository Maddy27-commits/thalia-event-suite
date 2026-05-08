import { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
}

const sizes = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
}

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    // Modal container: bottom-aligned on phones (sheet-style, easy thumb
    // reach) and centered on desktop. The `p-2 sm:p-4` change tightens
    // outer padding so the modal can use more screen real estate on small
    // viewports — previously the 16px padding was eating ~10% of width.
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-2 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cn(
          'relative w-full bg-white rounded-2xl shadow-2xl animate-slide-up',
          // On mobile: max-h slightly larger and rounded-t only so it reads
          // as a bottom sheet. On sm+: original card look.
          'max-h-[92dvh] sm:max-h-[85dvh]',
          sizes[size],
        )}
      >
        {title && (
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 pr-2 truncate">{title}</h2>
            <button
              onClick={onClose}
              className="shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        )}
        <div className="overflow-y-auto max-h-[78dvh] sm:max-h-[75dvh]">{children}</div>
      </div>
    </div>
  )
}
