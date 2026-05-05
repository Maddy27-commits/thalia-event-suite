import { useNavigate } from 'react-router-dom'
import {
  Briefcase, Sparkles, ArrowRight, Wand2, Users, Calendar,
  Lock, MessageSquare, Store, CheckCircle2, ChevronRight,
} from 'lucide-react'
import { ThaliaBloomMark } from '../../components/ui/ThaliaLogo'

/**
 * Marketing-style landing page. Walks a first-time visitor from "what is this"
 * through "why do I want it" to a clear role-based CTA. Mirrors the dark luxe
 * aesthetic of the rest of the auth flow so the transition into sign-up feels
 * continuous.
 */
export function LandingPage() {
  const navigate = useNavigate()

  const goPlanner = () => navigate('/auth/planner')
  const goClient  = () => navigate('/auth/client')
  const goDemo    = () => navigate('/auth/planner?demo=1')

  return (
    <div className="min-h-dvh bg-[#0F0E0C] text-white relative overflow-x-hidden">

      {/* Ambient gradient field */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-brand-500/10 rounded-full blur-[140px]" />
        <div className="absolute top-[40vh] -right-40 w-[500px] h-[500px] bg-plum-500/8 rounded-full blur-[120px]" />
        <div className="absolute top-[80vh] -left-40 w-[400px] h-[400px] bg-sage-500/5 rounded-full blur-[120px]" />
      </div>

      {/* Sticky header */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-[#0F0E0C]/80 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500/25 to-plum-500/15 ring-1 ring-brand-400/25 flex items-center justify-center">
              <ThaliaBloomMark size={18} dark />
            </div>
            <span className="font-extrabold text-lg tracking-[-0.02em]">Thalia</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={goPlanner}
              className="text-xs sm:text-sm font-semibold text-stone-300 hover:text-white px-3 py-2 transition-colors"
            >
              Sign in
            </button>
            <button
              onClick={goPlanner}
              className="text-xs sm:text-sm font-semibold bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-full shadow-sm transition-all"
            >
              Get started
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 bg-white/[0.04] ring-1 ring-white/10 rounded-full px-3 py-1 mb-6 animate-fade-in">
          <Sparkles size={11} className="text-brand-400" />
          <span className="text-[11px] font-semibold tracking-wide text-stone-300">AI-powered event planning suite</span>
        </div>

        <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-[-0.03em] mb-6 animate-fade-in">
          Beautiful events,<br className="hidden sm:block" />
          <span className="bg-gradient-to-r from-brand-300 via-brand-400 to-plum-300 bg-clip-text text-transparent">brilliantly planned.</span>
        </h1>

        <p className="text-base sm:text-lg text-stone-400 leading-relaxed max-w-2xl mx-auto mb-10 animate-fade-in delay-75">
          One workspace where event planners run every detail and clients see exactly what's happening — concepts, approvals, vendors, and timelines, all in lockstep.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4 animate-fade-in delay-150">
          <button
            onClick={goPlanner}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm px-7 py-3.5 rounded-full shadow-md transition-all hover:scale-[1.02]"
          >
            <Briefcase size={15} />
            I'm a planner
            <ArrowRight size={14} className="opacity-70" />
          </button>
          <button
            onClick={goClient}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white/[0.06] hover:bg-white/[0.1] text-white font-semibold text-sm px-7 py-3.5 rounded-full ring-1 ring-white/15 transition-all"
          >
            <Sparkles size={15} className="text-sage-400" />
            I'm a client
          </button>
        </div>

        <button
          onClick={goDemo}
          className="text-xs text-stone-400 hover:text-stone-200 font-medium underline-offset-4 hover:underline transition-colors animate-fade-in delay-225"
        >
          Just curious? Try the demo workspace →
        </button>
      </section>

      {/* Feature grid */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pb-20">
        <div className="text-center mb-12">
          <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-brand-400 mb-2">Everything you need</p>
          <h2 className="font-display text-3xl sm:text-4xl font-semibold leading-tight">
            Six tools, one calm workflow.
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {[
            { icon: Wand2,         title: 'AI concept generation',   body: 'Generate three distinct mood boards in seconds — colours, decor, catering, all on-brand.' },
            { icon: Calendar,      title: 'Multi-stage tracking',    body: 'Wedding ceremonies, conference days, birthday weekends — every stage, every detail.' },
            { icon: MessageSquare, title: 'Per-task discussions',    body: 'Chat threads scoped to each decision so context never gets lost in a generic inbox.' },
            { icon: Store,         title: 'Vendor network',          body: 'Curated directory across regions and event specialities. Add yours, or import from CSV.' },
            { icon: Lock,          title: 'Secure client portal',    body: '6-digit access codes per event. Clients see what you let them see — nothing else.' },
            { icon: CheckCircle2,  title: 'Real-time milestones',    body: 'Gentle progress bars, overdue nudges, and a single source of truth for "where are we?"' },
          ].map((f, i) => (
            <div
              key={f.title}
              className="bg-white/[0.03] hover:bg-white/[0.05] ring-1 ring-white/10 hover:ring-brand-400/25 rounded-2xl p-5 transition-all animate-fade-in"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500/15 to-plum-500/10 ring-1 ring-brand-400/20 flex items-center justify-center mb-3">
                <f.icon size={17} className="text-brand-400" />
              </div>
              <p className="font-semibold text-base mb-1">{f.title}</p>
              <p className="text-stone-400 text-sm leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pb-20">
        <div className="text-center mb-12">
          <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-sage-400 mb-2">How it works</p>
          <h2 className="font-display text-3xl sm:text-4xl font-semibold leading-tight">
            From brief to "I do" in three steps.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          {[
            { num: '01', title: 'Set up the event', body: "Pick a template, add your client, and Thalia auto-creates ceremonies, sub-stages, and a starter timeline." },
            { num: '02', title: 'Generate concepts', body: 'AI drafts three on-brand mood boards using the brief. Tweak, regenerate, share with the client.' },
            { num: '03', title: 'Client approves',  body: 'Client signs in with their access code, reviews concepts, and approves — every change is tracked.' },
          ].map((step) => (
            <div key={step.num} className="relative bg-white/[0.03] ring-1 ring-white/10 rounded-2xl p-6">
              <div className="font-display text-5xl font-bold bg-gradient-to-br from-brand-300 to-plum-400 bg-clip-text text-transparent mb-3">
                {step.num}
              </div>
              <p className="font-semibold text-base mb-1.5">{step.title}</p>
              <p className="text-stone-400 text-sm leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Social proof */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pb-20">
        <div className="text-center mb-10">
          <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-plum-400 mb-2">In good company</p>
          <h2 className="font-display text-2xl sm:text-3xl font-semibold leading-tight">
            Loved by planners who hate spreadsheets.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { quote: '"It replaced four spreadsheets, two WhatsApp groups and a stack of mood boards. My weekends are mine again."', name: 'Maya R.',   role: 'Wedding planner, Mumbai' },
            { quote: '"The AI concept generator is uncanny — it actually nails the brief instead of giving me generic stock photos."', name: 'Tom L.',    role: 'Corporate event lead, London' },
            { quote: '"My clients used to email me ten times a day. Now they sign in and self-serve. I sleep better."',                name: 'Aaliyah B.', role: 'Independent planner, Atlanta' },
          ].map((t) => (
            <div key={t.name} className="bg-white/[0.03] ring-1 ring-white/10 rounded-2xl p-6">
              <p className="text-sm text-stone-200 leading-relaxed mb-4">{t.quote}</p>
              <p className="text-sm font-semibold text-white">{t.name}</p>
              <p className="text-xs text-stone-500">{t.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pb-20">
        <div className="text-center mb-10">
          <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-brand-400 mb-2">FAQ</p>
          <h2 className="font-display text-2xl sm:text-3xl font-semibold leading-tight">
            The honest answers.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FAQGroup
            title="For planners"
            items={[
              { q: 'How much does Thalia cost?',           a: 'Free during the preview. Pricing tiers will roll out alongside team features later this year.' },
              { q: 'Where is my data stored?',             a: 'In your browser, plus encrypted state for AI requests. We do not sell, share, or train models on your event data.' },
              { q: 'Can I bring vendors from a CSV?',      a: 'Yes — the Vendors page accepts a CSV upload that maps name, contact, region, and speciality.' },
            ]}
          />
          <FAQGroup
            title="For clients"
            items={[
              { q: 'How do I access my event?',            a: 'Your planner shares a 6-digit code. Sign in with your email and that code — that is it.' },
              { q: 'What if I lose my access code?',       a: 'Ask your planner to re-share it. They can re-send the code from your event card in one click.' },
              { q: 'Will my planner see my approvals?',    a: 'Instantly. Every approve / decline / change request is reflected in their dashboard the moment you save it.' },
            ]}
          />
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pb-24">
        <div className="bg-gradient-to-br from-brand-500/15 via-plum-500/10 to-transparent ring-1 ring-brand-400/25 rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(218,165,32,0.08),transparent_70%)] pointer-events-none" />
          <h2 className="relative font-display text-3xl sm:text-4xl font-bold leading-tight mb-3">
            Start planning beautifully.
          </h2>
          <p className="relative text-stone-400 text-sm sm:text-base mb-7 max-w-md mx-auto">
            Free to try. No credit card. Two clicks from sign-up to your first event.
          </p>
          <div className="relative flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={goPlanner}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm px-7 py-3.5 rounded-full shadow-md transition-all"
            >
              <Briefcase size={15} />
              I'm a planner
              <ChevronRight size={14} />
            </button>
            <button
              onClick={goClient}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white/[0.06] hover:bg-white/[0.1] text-white font-semibold text-sm px-7 py-3.5 rounded-full ring-1 ring-white/15 transition-all"
            >
              <Users size={15} className="text-sage-400" />
              I'm a client
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-brand-500/25 to-plum-500/15 ring-1 ring-brand-400/25 flex items-center justify-center">
              <ThaliaBloomMark size={14} dark />
            </div>
            <span className="text-sm font-bold tracking-tight">Thalia</span>
            <span className="text-xs text-stone-500 ml-3">© 2026 · Crafted for planners and the people they delight.</span>
          </div>
          <div className="flex items-center gap-5 text-xs">
            <button onClick={() => navigate('/privacy')} className="text-stone-500 hover:text-stone-300 transition-colors">Privacy</button>
            <button onClick={() => navigate('/terms')}   className="text-stone-500 hover:text-stone-300 transition-colors">Terms</button>
            <a href="mailto:hello@thalia-events.com" className="text-stone-500 hover:text-stone-300 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FAQGroup({ title, items }: { title: string; items: { q: string; a: string }[] }) {
  return (
    <div className="bg-white/[0.03] ring-1 ring-white/10 rounded-2xl p-5">
      <p className="text-sm font-bold mb-4 text-brand-400">{title}</p>
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.q}>
            <p className="text-sm font-semibold text-white mb-1">{item.q}</p>
            <p className="text-xs text-stone-400 leading-relaxed">{item.a}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
