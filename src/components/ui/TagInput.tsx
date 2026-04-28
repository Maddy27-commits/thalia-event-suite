import { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'

interface TagInputProps {
  label?: string
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  hint?: string
  className?: string
}

export function TagInput({ label, value, onChange, placeholder, hint, className }: TagInputProps) {
  const [raw, setRaw] = useState(value.join(', '))
  const syncRef = useRef(false)

  useEffect(() => {
    if (!syncRef.current) setRaw(value.join(', '))
    syncRef.current = false
  }, [value])

  const commit = (str: string) => {
    const parsed = str.split(',').map((s) => s.trim()).filter(Boolean)
    syncRef.current = true
    onChange(parsed)
  }

  const removeTag = (tag: string) => {
    const next = value.filter((t) => t !== tag)
    syncRef.current = true
    onChange(next)
    setRaw(next.join(', '))
  }

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && <label className="text-sm font-medium text-stone-700">{label}</label>}

      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((tag) => (
            <span key={tag} className="inline-flex items-center gap-1 bg-brand-100 border border-brand-200 text-brand-700 text-xs px-2.5 py-1 rounded-full font-medium">
              {tag}
              <button type="button" onClick={() => removeTag(tag)} className="text-brand-400 hover:text-brand-700 transition-colors">
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}

      <input
        type="text"
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        onBlur={() => commit(raw)}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commit(raw) } }}
        placeholder={placeholder ?? 'Type values separated by commas…'}
        className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-brand-400/30 focus:border-brand-400 transition-all"
      />
      {hint && <p className="text-xs text-stone-400">{hint}</p>}
    </div>
  )
}
