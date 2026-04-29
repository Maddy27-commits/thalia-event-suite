import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Briefcase, Eye, EyeOff } from 'lucide-react'
import { useStore } from '../../store'
import { ThaliaBloomMark } from '../../components/ui/ThaliaLogo'

type Mode = 'choose' | 'signin' | 'signup'

export function PlannerAuthPage() {
  const navigate    = useNavigate()
  const { registeredPlanners, login, registerPlanner } = useStore()

  const [mode, setMode]         = useState<Mode>('choose')
  const [name, setName]         = useState('')
  const [business, setBusiness] = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [error, setError]       = useState('')

  const hasAccounts = registeredPlanners.length > 0

  const handleSignIn = () => {
    setError('')
    const match = registeredPlanners.find(
      (p) => p.email.toLowerCase() === email.trim().toLowerCase()
    )
    if (!match) { setError('No account found with that email.'); return }
    if (match.password !== password) { setError('Incorrect password.'); return }

    login({
      role: 'planner',
      displayName: match.name,
      email: match.email,
      isPlannerPreview: false,
    })
    navigate('/planner', { replace: true })
  }

  const handleSignUp = () => {
    setError('')
    if (!name.trim())     { setError('Please enter your name.'); return }
    if (!email.trim())    { setError('Please enter your email.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }

    const result = registerPlanner({
      name: name.trim(),
      businessName: business.trim(),
      email: email.trim().toLowerCase(),
      password,
    })
    if (result === 'email_taken') { setError('An account with that email already exists.'); return }

    login({
      role: 'planner',
      displayName: name.trim(),
      email: email.trim().toLowerCase(),
      isPlannerPreview: false,
    })
    navigate('/planner', { replace: true })
  }

  return (
    <div className="min-h-dvh bg-[#0F0E0C] flex flex-col items-center justify-center px-4 relative overflow-hidden">

      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-brand-500/8 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm animate-fade-in">

        {/* Back */}
        <button
          onClick={() => mode === 'choose' ? navigate('/') : setMode('choose')}
          className="flex items-center gap-1.5 text-stone-500 hover:text-stone-300 text-sm mb-8 transition-colors"
        >
          <ArrowLeft size={14} />
          Back
        </button>

        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500/20 to-plum-500/10 ring-1 ring-brand-400/20 flex items-center justify-center">
            <ThaliaBloomMark size={22} dark />
          </div>
          <div>
            <p className="text-white font-extrabold text-lg tracking-[-0.03em] leading-none">Thalia</p>
            <p className="text-[9px] font-semibold tracking-[0.2em] uppercase text-brand-400/60 mt-0.5">Planner Suite</p>
          </div>
        </div>

        {/* ── Choose mode ── */}
        {mode === 'choose' && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-brand-500/15 ring-1 ring-brand-400/20 flex items-center justify-center">
                <Briefcase size={15} className="text-brand-400" />
              </div>
              <h1 className="text-white font-bold text-xl tracking-tight">Planner Portal</h1>
            </div>
            <p className="text-stone-500 text-sm mb-8">Sign in to your account or create a new one.</p>

            <div className="space-y-3">
              {hasAccounts && (
                <button
                  onClick={() => { setMode('signin'); setError('') }}
                  className="w-full py-3.5 px-5 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm transition-all shadow-plum-sm"
                >
                  Sign in to existing account
                </button>
              )}
              <button
                onClick={() => { setMode('signup'); setError('') }}
                className={`w-full py-3.5 px-5 rounded-2xl font-semibold text-sm transition-all ${
                  hasAccounts
                    ? 'bg-white/[0.06] ring-1 ring-white/10 text-white hover:bg-white/[0.10]'
                    : 'bg-brand-500 hover:bg-brand-600 text-white shadow-plum-sm'
                }`}
              >
                Create a new account
              </button>
            </div>

            {/* Demo hint */}
            <div className="mt-6 p-4 rounded-xl bg-white/[0.03] ring-1 ring-white/[0.06]">
              <p className="text-stone-500 text-xs leading-relaxed">
                <span className="text-stone-400 font-semibold">Demo:</span> Create a new account to get started. Your events and vendors are already seeded.
              </p>
            </div>
          </div>
        )}

        {/* ── Sign in ── */}
        {mode === 'signin' && (
          <div>
            <h1 className="text-white font-bold text-xl tracking-tight mb-1">Welcome back</h1>
            <p className="text-stone-500 text-sm mb-8">Sign in with your planner account.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-400 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSignIn()}
                  placeholder="you@studio.com"
                  className="w-full bg-white/[0.05] ring-1 ring-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-stone-600 focus:outline-none focus:ring-brand-400/40 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-400 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSignIn()}
                    placeholder="••••••••"
                    className="w-full bg-white/[0.05] ring-1 ring-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-stone-600 focus:outline-none focus:ring-brand-400/40 transition-all pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 transition-colors"
                  >
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <p className="mt-3 text-rose-400 text-xs font-medium">{error}</p>
            )}

            <button
              onClick={handleSignIn}
              className="w-full mt-6 py-3.5 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm transition-all shadow-plum-sm"
            >
              Sign in
            </button>

            <button
              onClick={() => { setMode('signup'); setError('') }}
              className="w-full mt-3 text-stone-500 hover:text-stone-300 text-xs transition-colors"
            >
              Don't have an account? Create one
            </button>
          </div>
        )}

        {/* ── Sign up ── */}
        {mode === 'signup' && (
          <div>
            <h1 className="text-white font-bold text-xl tracking-tight mb-1">Create your account</h1>
            <p className="text-stone-500 text-sm mb-8">Set up your planner profile to get started.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-400 mb-1.5">Your name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Smith"
                  className="w-full bg-white/[0.05] ring-1 ring-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-stone-600 focus:outline-none focus:ring-brand-400/40 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-400 mb-1.5">
                  Business name <span className="text-stone-600 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={business}
                  onChange={(e) => setBusiness(e.target.value)}
                  placeholder="Studio Events Co."
                  className="w-full bg-white/[0.05] ring-1 ring-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-stone-600 focus:outline-none focus:ring-brand-400/40 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-400 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@studio.com"
                  className="w-full bg-white/[0.05] ring-1 ring-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-stone-600 focus:outline-none focus:ring-brand-400/40 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-400 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSignUp()}
                    placeholder="At least 6 characters"
                    className="w-full bg-white/[0.05] ring-1 ring-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-stone-600 focus:outline-none focus:ring-brand-400/40 transition-all pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 transition-colors"
                  >
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <p className="mt-3 text-rose-400 text-xs font-medium">{error}</p>
            )}

            <button
              onClick={handleSignUp}
              className="w-full mt-6 py-3.5 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm transition-all shadow-plum-sm"
            >
              Create account
            </button>

            {hasAccounts && (
              <button
                onClick={() => { setMode('signin'); setError('') }}
                className="w-full mt-3 text-stone-500 hover:text-stone-300 text-xs transition-colors"
              >
                Already have an account? Sign in
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
