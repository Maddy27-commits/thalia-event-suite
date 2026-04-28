import { Briefcase, Sparkles } from 'lucide-react'
import { useStore } from '../../store'
import type { Role } from '../../types'

export function RoleSwitcher() {
  const { role, setRole } = useStore()

  const options: { value: Role; label: string; icon: React.ReactNode }[] = [
    { value: 'planner', label: 'Planner', icon: <Briefcase size={12} /> },
    { value: 'client',  label: 'Client',  icon: <Sparkles  size={12} /> },
  ]

  return (
    <div className="flex items-center p-0.5 rounded-xl bg-stone-100 ring-1 ring-black/[0.04]">
      {options.map((opt) => {
        const active = role === opt.value
        return (
          <button
            key={opt.value}
            onClick={() => setRole(opt.value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-xs font-semibold transition-all duration-200 ${
              active
                ? opt.value === 'planner'
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'bg-sage-500 text-white shadow-sm'
                : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            {opt.icon}
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
