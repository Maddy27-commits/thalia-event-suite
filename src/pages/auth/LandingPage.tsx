import { useNavigate } from 'react-router-dom'
import { Briefcase, Sparkles, ArrowRight } from 'lucide-react'
import { ThaliaBloomMark } from '../../components/ui/ThaliaLogo'

export function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-dvh bg-[#0F0E0C] flex flex-col items-center justify-center relative overflow-hidden px-4">

      {/* ── Ambient background glows ── */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-brand-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-plum-500/8 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/3 left-0 w-[300px] h-[300px] bg-brand-400/6 rounded-full blur-[80px] pointer-events-none" />

      {/* ── Content ── */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-lg w-full animate-fade-in">

        {/* Mark */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500/20 to-plum-500/15 ring-1 ring-brand-400/25 flex items-center justify-center mb-6 shadow-plum-md">
          <ThaliaBloomMark size={36} dark />
        </div>

        {/* Wordmark */}
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-[-0.03em] leading-none mb-2">
          Thalia
        </h1>
        <p className="text-[11px] font-semibold tracking-[0.25em] uppercase text-brand-400/70 mb-8">
          Event Studio
        </p>

        {/* Tagline */}
        <p className="text-stone-400 text-base sm:text-lg leading-relaxed mb-12 max-w-sm">
          The planning suite that makes extraordinary events feel effortless.
        </p>

        {/* Role cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
          {/* Planner card */}
          <button
            onClick={() => navigate('/auth/planner')}
            className="group relative flex flex-col items-start p-5 rounded-2xl bg-white/[0.04] ring-1 ring-white/10 hover:bg-white/[0.07] hover:ring-brand-400/30 transition-all duration-200 text-left overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <div className="w-10 h-10 rounded-xl bg-brand-500/15 ring-1 ring-brand-400/20 flex items-center justify-center mb-3">
                <Briefcase size={18} className="text-brand-400" />
              </div>
              <p className="text-white font-bold text-base leading-tight mb-1">I'm a Planner</p>
              <p className="text-stone-500 text-xs leading-relaxed">
                Manage events, vendors, and client approvals.
              </p>
              <div className="flex items-center gap-1 mt-3 text-brand-400 text-xs font-semibold">
                Sign in or register
                <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>
          </button>

          {/* Client card */}
          <button
            onClick={() => navigate('/auth/client')}
            className="group relative flex flex-col items-start p-5 rounded-2xl bg-white/[0.04] ring-1 ring-white/10 hover:bg-white/[0.07] hover:ring-sage-400/30 transition-all duration-200 text-left overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-sage-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <div className="w-10 h-10 rounded-xl bg-sage-500/15 ring-1 ring-sage-400/20 flex items-center justify-center mb-3">
                <Sparkles size={18} className="text-sage-400" />
              </div>
              <p className="text-white font-bold text-base leading-tight mb-1">I'm a Client</p>
              <p className="text-stone-500 text-xs leading-relaxed">
                View your event, review concepts, and track planning.
              </p>
              <div className="flex items-center gap-1 mt-3 text-sage-400 text-xs font-semibold">
                Access my event
                <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>
          </button>
        </div>

        {/* Footer note */}
        <p className="text-stone-600 text-xs mt-10">
          Thalia — AI Event Planning Suite
        </p>
      </div>
    </div>
  )
}
