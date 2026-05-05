import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Eye, EyeOff, X } from 'lucide-react'
import { useStore } from '../../store'
import { ThaliaBloomMark } from '../../components/ui/ThaliaLogo'

type Tab = 'signin' | 'signup'

const MIN_PASSWORD_LENGTH = 8

/** Compute a 0..4 strength score for live feedback during sign-up. */
function passwordStrength(pw: string): { score: number; label: string; colour: string } {
  let score = 0
  if (pw.length >= 8)  score++
  if (pw.length >= 12) score++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  const labels = ['Too short', 'Weak', 'Okay', 'Strong', 'Excellent']
  const colours = ['bg-stone-300', 'bg-rose-400', 'bg-amber-400', 'bg-sage-500', 'bg-emerald-500']
  const idx = Math.min(score, labels.length - 1)
  return { score, label: labels[idx], colour: colours[idx] }
}

export function PlannerAuthPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { registeredPlanners, login, registerPlanner, verifyPlannerPassword } = useStore()

  const [tab, setTab]           = useState<Tab>('signin')
  const [name, setName]         = useState('')
  const [business, setBusiness] = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [showForgot, setShowForgot] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotMsg, setForgotMsg]   = useState('')

  // ── Demo-mode landing — auto-create / sign in to a sandboxed planner so a
  // first-time visitor can poke around without filling a sign-up form.
  useEffect(() => {
    if (searchParams.get('demo') !== '1') return
    let cancelled = false
    ;(async () => {
      const demoEmail = 'demo@thalia-events.com'
      const demoPwd   = 'demo-passphrase-2026'
      const exists = registeredPlanners.find((p) => p.email.toLowerCase() === demoEmail)
      if (!exists) {
        await registerPlanner({ name: 'Demo Planner', businessName: 'Thalia Demo Studio', email: demoEmail, password: demoPwd })
      }
      if (cancelled) return
      const ok = await verifyPlannerPassword(demoEmail, demoPwd)
      if (ok && !cancelled) {
        login({ role: 'planner', displayName: 'Demo Planner', email: demoEmail, isPlannerPreview: false })
        navigate('/planner', { replace: true })
      }
    })()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const switchTab = (t: Tab) => { setTab(t); setError('') }

  const handleForgotSubmit = () => {
    setForgotMsg('')
    const trimmed = forgotEmail.trim().toLowerCase()
    if (!trimmed) return
    const match = registeredPlanners.find((p) => p.email.toLowerCase() === trimmed)
    if (!match) {
      // Don't leak account existence — return the same friendly message
      setForgotMsg("If we have an account for that email, we've sent reset instructions. Check your inbox in the next few minutes.")
      return
    }
    // Real password recovery would email a signed reset link via the same
    // delivery service used for client emails. For this preview we display
    // a friendly stub so the UX is testable end-to-end.
    setForgotMsg("If we have an account for that email, we've sent reset instructions. (Preview build: email delivery is not yet wired — please contact the planner-suite admin to reset.)")
  }

  const handleSignIn = async () => {
    setError('')
    if (!email.trim())    { setError('Please enter your email.'); return }
    if (!password)        { setError('Please enter your password.'); return }

    const trimmedEmail = email.trim().toLowerCase()
    const match = registeredPlanners.find((p) => p.email.toLowerCase() === trimmedEmail)
    if (!match) { setError('No account found with that email.'); return }

    setLoading(true)
    const ok = await verifyPlannerPassword(trimmedEmail, password)
    setLoading(false)
    if (!ok) { setError('Incorrect password.'); return }

    login({ role: 'planner', displayName: match.name, email: match.email, isPlannerPreview: false })
    navigate('/planner', { replace: true })
  }

  const handleSignUp = async () => {
    setError('')
    if (!name.trim())                          { setError('Please enter your name.'); return }
    if (!email.trim())                         { setError('Please enter your email.'); return }
    if (password.length < MIN_PASSWORD_LENGTH) { setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`); return }

    setLoading(true)
    const result = await registerPlanner({
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
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-semibold text-sm transition-all shadow-sm mt-2"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>

            <p className="text-center text-stone-600 text-xs pt-1">
              No account yet?{' '}
              <button onClick={() => switchTab('signup')} className="text-brand-400 hover:text-brand-300 font-semibold transition-colors">
                Create one
              </button>
            </p>
            <p className="text-center text-stone-600 text-[11px]">
              <button onClick={() => { setForgotEmail(email); setForgotMsg(''); setShowForgot(true) }} className="text-stone-500 hover:text-stone-300 transition-colors underline-offset-4 hover:underline">
                Forgot password?
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
                  placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
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
              {/* Live strength meter — silent until the user starts typing */}
              {password.length > 0 && (() => {
                const s = passwordStrength(password)
                return (
                  <div className="mt-2">
                    <div className="flex gap-1">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < s.score ? s.colour : 'bg-white/10'}`} />
                      ))}
                    </div>
                    <p className={`text-[10px] mt-1 font-medium ${s.score >= 3 ? 'text-emerald-400' : s.score >= 2 ? 'text-amber-300' : 'text-rose-300'}`}>
                      {s.label} · use 8+ characters with letters, numbers and symbols.
                    </p>
                  </div>
                )
              })()}
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

      {/* ── Forgot password modal ── */}
      {showForgot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowForgot(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-[#1a1916] ring-1 ring-white/10 rounded-2xl max-w-sm w-full p-6 relative animate-fade-in">
            <button
              onClick={() => setShowForgot(false)}
              className="absolute top-3 right-3 text-stone-500 hover:text-white p-1 rounded-md hover:bg-white/5"
            >
              <X size={14} />
            </button>
            <p className="text-white font-bold text-base mb-1">Reset your password</p>
            <p className="text-stone-400 text-xs mb-4 leading-relaxed">
              Enter the email address on your account. We'll send instructions for resetting your password.
            </p>
            <input
              type="email"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              placeholder="you@studio.com"
              autoFocus
              className={inputCls}
            />
            {forgotMsg && <p className="text-emerald-400 text-xs mt-3 leading-relaxed">{forgotMsg}</p>}
            <button
              onClick={handleForgotSubmit}
              className="w-full mt-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm transition-all shadow-sm"
            >
              Send reset email
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
