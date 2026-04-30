import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { useStore } from '../../store'
import { ThaliaBloomMark } from '../../components/ui/ThaliaLogo'

type Tab = 'signin' | 'signup'

export function PlannerAuthPage() {
  const navigate = useNavigate()
  const { registeredPlanners, login, registerPlanner } = useStore()

  // Always open on sign-in — users with no account can switch to Create account
  const [tab, setTab]           = useState<Tab>('signin')
  const [name, setName]         = useState('')
  const [business, setBusiness] = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const switchTab = (t: Tab) => { setTab(t); setError('') }

  const handleSignIn = () => {
    setError('')
    if (!email.trim())    { setError('Please enter your email.'); return }
    if (!password)        { setError('Please enter your password.'); return }

    const match = registeredPlanners.find(
      (p) => p.email.toLowerCase() === email.trim().toLowerCase()
    )
    if (!match)                    { setError('No account found with that email.'); return }
    if (match.password !== password) { setError('Incorrect password.'); return }

    login({ role: 'planner', displayName: match.name, email: match.email, isPlannerPreview: false })
    navigate('/planner', { replace: true })
  }

  const handleSignUp = () => {
    setError('')
    if (!name.trim())         { setError('Please enter your name.'); return }
    if (!email.trim())        { setError('Please enter your email.'); return }
    if (password.length < 6)  { setError('Password must be at least 6 characters.'); return }

    setLoading(true)
    const result = registerPlanner({
      name: name.trim(),
      businessName: business.trim(),
      email: email.trim().toLowerCase(),
      password,
    })
    setLoading(false)
    if (result === 'email_taken') { setError('An account with that email already exists. Try signing in.'); return }

    login({ role: 'planner', displayName: name.trim(), email: email.trim().toLowerCase(), isPlannerPreview: false })
    navigate('/planner', { replace: true })
  }

  const inputCls = 'w-full bg-white/[0.05] ring-1 ring-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-stone-600 focus:outline-none focus:ring-2 focus:ring-brand-400/40 transition-all'
  const labelCls = 'block text-xs font-semibold text-stone-400 mb-1.5'

  return (
    <div className="min-h-dvh bg-[#0F0E0C] flex flex-col items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-brand-500/8 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm animate-fade-in">

        {/* Back */}
        <button
          onClick={() => navigate('/welcome')}
          className="flex items-center gap-1.5 text-stone-500 hover:text-stone-300 text-sm mb-8 transition-colors"
        >
          <ArrowLeft size={14} />
          Back
        </button>

        {/* Logo */}
        <div className="flex items-center gap-3 mb-7">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500/20 to-plum-500/10 ring-1 ring-brand-400/20 flex items-center justify-center">
            <ThaliaBloomMark size={22} dark />
          </div>
          <div>
            <p className="text-white font-extrabold text-lg tracking-[-0.03em] leading-none">Thalia</p>
            <p className="text-[9px] font-semibold tracking-[0.2em] uppercase text-brand-400/60 mt-0.5">Planner Suite</p>
          </div>
        </div>

        {/* Tab switcher — always visible */}
        <div className="flex p-1 rounded-2xl bg-white/[0.05] ring-1 ring-white/[0.07] mb-7">
          <button
            onClick={() => switchTab('signin')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              tab === 'signin'
                ? 'bg-brand-500 text-white shadow-sm'
                : 'text-stone-300 hover:text-white'
            }`}
          >
            Sign in
          </button>
          <button
            onClick={() => switchTab('signup')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              tab === 'signup'
                ? 'bg-brand-500 text-white shadow-sm'
                : 'text-stone-300 hover:text-white'
            }`}
          >
            Create account
          </button>
        </div>

        {/* ── Sign in ── */}
        {tab === 'signin' && (
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSignIn()}
                placeholder="you@studio.com"
                autoFocus
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSignIn()}
                  placeholder="••••••••"
                  className={`${inputCls} pr-11`}
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

            {error && <p className="text-rose-400 text-xs font-medium">{error}</p>}

            <button
              onClick={handleSignIn}
              className="w-full py-3.5 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm transition-all shadow-sm mt-2"
            >
              Sign in
            </button>

            <p className="text-center text-stone-600 text-xs pt-1">
              No account yet?{' '}
              <button onClick={() => switchTab('signup')} className="text-brand-400 hover:text-brand-300 font-semibold transition-colors">
                Create one
              </button>
            </p>
          </div>
        )}

        {/* ── Create account ── */}
        {tab === 'signup' && (
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Your name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Smith"
                autoFocus
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>
                Business name <span className="text-stone-600 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={business}
                onChange={(e) => setBusiness(e.target.value)}
                placeholder="Studio Events Co."
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@studio.com"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSignUp()}
                  placeholder="At least 6 characters"
                  className={`${inputCls} pr-11`}
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

            {error && <p className="text-rose-400 text-xs font-medium">{error}</p>}

            <button
              onClick={handleSignUp}
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-semibold text-sm transition-all shadow-sm mt-2"
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>

            <p className="text-center text-stone-600 text-xs pt-1">
              Already have an account?{' '}
              <button onClick={() => switchTab('signin')} className="text-brand-400 hover:text-brand-300 font-semibold transition-colors">
                Sign in
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
