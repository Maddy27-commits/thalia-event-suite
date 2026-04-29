import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Sparkles, Mail } from 'lucide-react'
import { useStore } from '../../store'
import { ThaliaBloomMark } from '../../components/ui/ThaliaLogo'

export function ClientAuthPage() {
  const navigate  = useNavigate()
  const { events, login } = useStore()

  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleAccess = () => {
    setError('')
    const trimmed = email.trim().toLowerCase()
    if (!trimmed) { setError('Please enter your email address.'); return }

    setLoading(true)
    // Small delay for perceived loading
    setTimeout(() => {
      const matchedEvent = events.find(
        (e) => e.clientEmail?.toLowerCase() === trimmed
      )

      if (!matchedEvent) {
        setError("We couldn't find an event linked to that email. Please check with your planner.")
        setLoading(false)
        return
      }

      login({
        role: 'client',
        displayName: matchedEvent.clientName,
        email: trimmed,
        clientEventId: matchedEvent.id,
        isPlannerPreview: false,
      })
      navigate('/client', { replace: true })
    }, 400)
  }

  return (
    <div className="min-h-dvh bg-white flex flex-col items-center justify-center px-4 relative overflow-hidden">

      {/* Soft background gradient */}
      <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-stone-50 to-white pointer-events-none" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-sage-50/80 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm animate-fade-in">

        {/* Back */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-stone-400 hover:text-stone-600 text-sm mb-8 transition-colors"
        >
          <ArrowLeft size={14} />
          Back
        </button>

        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-50 to-brand-100/60 ring-1 ring-brand-200/60 flex items-center justify-center">
            <ThaliaBloomMark size={22} dark={false} />
          </div>
          <div>
            <p className="text-stone-900 font-extrabold text-lg tracking-[-0.03em] leading-none">Thalia</p>
            <p className="text-[9px] font-semibold tracking-[0.2em] uppercase text-stone-400 mt-0.5">Client Portal</p>
          </div>
        </div>

        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-xl bg-sage-100 ring-1 ring-sage-200/60 flex items-center justify-center">
            <Sparkles size={15} className="text-sage-600" />
          </div>
          <h1 className="text-stone-900 font-bold text-xl tracking-tight">Client Portal</h1>
        </div>
        <p className="text-stone-400 text-sm mb-8 leading-relaxed">
          Enter the email address your planner used when setting up your event.
        </p>

        {/* Email input */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-stone-500 mb-1.5">Your email address</label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300">
              <Mail size={15} />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAccess()}
              placeholder="your@email.com"
              autoFocus
              className="w-full bg-stone-50 ring-1 ring-stone-200 rounded-xl pl-10 pr-4 py-3 text-stone-900 text-sm placeholder:text-stone-300 focus:outline-none focus:ring-sage-400/50 transition-all"
            />
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 ring-1 ring-rose-200/60">
            <p className="text-rose-600 text-xs font-medium">{error}</p>
          </div>
        )}

        <button
          onClick={handleAccess}
          disabled={loading}
          className="w-full py-3.5 rounded-2xl bg-sage-500 hover:bg-sage-600 disabled:opacity-60 text-white font-semibold text-sm transition-all shadow-sm"
        >
          {loading ? 'Checking…' : 'Access my event'}
        </button>

        {/* Demo hint */}
        <div className="mt-6 p-4 rounded-2xl bg-stone-50 ring-1 ring-stone-100">
          <p className="text-stone-400 text-xs leading-relaxed">
            <span className="text-stone-500 font-semibold">Demo accounts:</span>
            <br />
            <span className="font-mono text-stone-500">aisha@example.com</span> — Aisha & Rohan Wedding
            <br />
            <span className="font-mono text-stone-500">diana@nexustech.com</span> — Nexus Tech Gala
          </p>
        </div>
      </div>
    </div>
  )
}
