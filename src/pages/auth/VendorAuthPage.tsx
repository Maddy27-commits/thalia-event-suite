import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Store } from 'lucide-react'
import { useStore } from '../../store'
import { ThaliaBloomMark } from '../../components/ui/ThaliaLogo'

/**
 * Vendor sign-in. No access code by design — a vendor can only see events
 * the planner has explicitly added them to, and only the content the
 * planner has chosen to share with vendors. Auth is therefore a soft check
 * (email match against the vendor directory + at least one event assignment).
 *
 * For the preview build this is acceptable: vendors don't approve anything
 * and the surface area they see is curated by the planner. Real production
 * would add OAuth or magic-link verification.
 */
export function VendorAuthPage() {
  const navigate = useNavigate()
  const { vendors, events, login } = useStore()

  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignIn = () => {
    setError('')
    const trimmed = email.trim().toLowerCase()
    if (!trimmed) { setError('Please enter your email address.'); return }

    setLoading(true)
    setTimeout(() => {
      const vendor = vendors.find((v) => v.email.toLowerCase() === trimmed)
      if (!vendor) {
        setError("We couldn't find a vendor with that email. Ask the planner who hired you to add your details.")
        setLoading(false)
        return
      }
      const assignedToAny = events.some((e) => e.vendorIds.includes(vendor.id))
      if (!assignedToAny) {
        setError("You're in the directory but not yet assigned to an event. Reach out to the planner to be added.")
        setLoading(false)
        return
      }
      login({
        role: 'vendor',
        displayName: vendor.contact || vendor.name,
        email: vendor.email,
        vendorId: vendor.id,
        isPlannerPreview: false,
      })
      navigate('/vendor', { replace: true })
    }, 350)
  }

  return (
    <div className="min-h-dvh bg-white flex flex-col items-center justify-center px-4 relative overflow-hidden">

      {/* Soft warm background */}
      <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-amber-50/40 to-white pointer-events-none" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-amber-50/60 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm animate-fade-in">

        {/* Back */}
        <button
          onClick={() => navigate('/welcome')}
          className="flex items-center gap-1.5 text-stone-400 hover:text-stone-600 text-sm mb-8 transition-colors"
        >
          <ArrowLeft size={14} />
          Back
        </button>

        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100/60 ring-1 ring-amber-200/60 flex items-center justify-center">
            <ThaliaBloomMark size={22} dark={false} />
          </div>
          <div>
            <p className="text-stone-900 font-extrabold text-lg tracking-[-0.03em] leading-none">Thalia</p>
            <p className="text-[9px] font-semibold tracking-[0.2em] uppercase text-amber-600 mt-0.5">Vendor Portal</p>
          </div>
        </div>

        <h1 className="text-stone-900 font-bold text-2xl tracking-tight mb-2">Sign in</h1>
        <p className="text-stone-400 text-sm mb-8 leading-relaxed">
          Use the email the planner has on file for you. You'll see only the events you've been assigned to.
        </p>

        {/* Email */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-stone-500 mb-1.5">Your email address</label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300">
              <Store size={15} />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSignIn()}
              placeholder="hello@yourbusiness.com"
              autoFocus
              className="w-full bg-stone-50 ring-1 ring-stone-200 rounded-xl pl-10 pr-4 py-3 text-stone-900 text-sm placeholder:text-stone-300 focus:outline-none focus:ring-amber-400/50 transition-all"
            />
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 ring-1 ring-rose-200/60">
            <p className="text-rose-600 text-xs font-medium">{error}</p>
          </div>
        )}

        <button
          onClick={handleSignIn}
          disabled={loading}
          className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-semibold text-sm transition-all shadow-sm"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>

        <div className="mt-6 p-4 rounded-2xl bg-stone-50 ring-1 ring-stone-100">
          <p className="text-stone-400 text-xs leading-relaxed">
            New here? Vendors are added by event planners — reach out to whoever hired you and they'll add your details to the platform.
          </p>
        </div>
      </div>
    </div>
  )
}
