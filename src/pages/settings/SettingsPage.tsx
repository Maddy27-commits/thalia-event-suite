import { useState } from 'react'
import {
  User, MessageCircle, Mail, Palette,
  Check, Save, Phone, AtSign, Info, ExternalLink, Zap,
} from 'lucide-react'
import { useStore } from '../../store'
import { Card, CardBody } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { ThaliaFullLogo } from '../../components/ui/ThaliaLogo'

const AVATAR_GRADIENTS = [
  { label: 'Gold',   value: 'from-brand-400 to-brand-600'   },
  { label: 'Rose',   value: 'from-rose-400 to-pink-600'     },
  { label: 'Sage',   value: 'from-sage-400 to-sage-600'     },
  { label: 'Sky',    value: 'from-sky-400 to-blue-600'      },
  { label: 'Violet', value: 'from-violet-400 to-purple-600' },
  { label: 'Amber',  value: 'from-amber-400 to-orange-500'  },
  { label: 'Teal',   value: 'from-teal-400 to-emerald-600'  },
  { label: 'Slate',  value: 'from-slate-400 to-slate-600'   },
]

function SaveBanner({ saved }: { saved: boolean }) {
  if (!saved) return null
  return (
    <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 rounded-xl px-4 py-2.5 text-sm font-medium animate-fade-in">
      <Check size={14} />
      Changes saved successfully
    </div>
  )
}

function SectionLabel({ icon: Icon, label, accent }: { icon: React.ElementType; label: string; accent?: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${accent ?? 'bg-brand-50'}`}>
        <Icon size={14} className={accent ? 'text-white' : 'text-brand-600'} />
      </div>
      <h3 className="text-sm font-semibold text-stone-700">{label}</h3>
    </div>
  )
}

// ─── EmailJS Setup Steps ───────────────────────────────────────────────────────
function EmailJSSetupGuide() {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-xl border border-dashed border-stone-200 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-stone-50 transition-colors"
      >
        <div className="w-6 h-6 rounded-md bg-[#EA4335] flex items-center justify-center shrink-0">
          <Zap size={12} className="text-white" />
        </div>
        <span className="text-sm font-semibold text-stone-700 flex-1">How to set up direct email sending</span>
        <span className="text-xs text-stone-400">{open ? 'Hide' : 'Show steps'}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-stone-100 pt-3">
          <p className="text-xs text-stone-500">EmailJS lets you send emails directly from the browser — free up to 200/month. Takes ~5 minutes to set up.</p>
          {[
            { n: '1', text: 'Go to emailjs.com and create a free account.' },
            { n: '2', text: 'Click "Add New Service" → choose Gmail → connect your Google account. Copy your Service ID.' },
            { n: '3', text: 'Go to "Email Templates" → Create Template. Use these exact variables in the body:' },
            { n: '4', text: 'In the template "To Email" field enter: {{to_email}}. Set Subject to: {{subject}}. Set body content to: {{message}}. Save and copy the Template ID.' },
            { n: '5', text: 'Go to Account → "General" tab → copy your Public Key.' },
            { n: '6', text: 'Paste all three IDs below and hit Save. That\'s it — emails fire directly from Thalia.' },
          ].map((step) => (
            <div key={step.n} className="flex gap-3">
              <span className="w-5 h-5 rounded-full bg-stone-100 text-stone-500 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{step.n}</span>
              <p className="text-xs text-stone-600 leading-relaxed">{step.text}</p>
            </div>
          ))}
          <a
            href="https://www.emailjs.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 mt-1"
          >
            Open EmailJS <ExternalLink size={11} />
          </a>
        </div>
      )}
    </div>
  )
}

// ─── Planner Settings ──────────────────────────────────────────────────────────
function PlannerSettings() {
  const { plannerProfile, setPlannerProfile } = useStore()
  const [form, setForm] = useState({ ...plannerProfile })
  const [saved, setSaved] = useState(false)

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const handleSave = () => {
    setPlannerProfile(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const initial = form.name?.trim() ? form.name.charAt(0).toUpperCase() : 'P'
  const emailjsConnected = !!(form.emailjsServiceId?.trim() && form.emailjsTemplateId?.trim() && form.emailjsPublicKey?.trim())

  return (
    <div className="space-y-6">
      {/* Avatar preview */}
      <Card>
        <CardBody className="flex items-center gap-5 py-5">
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${form.avatarColor} flex items-center justify-center shadow-md shrink-0`}>
            <span className="font-display text-white text-2xl font-bold">{initial}</span>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-stone-900 text-base">{form.name || 'Your Name'}</p>
            <p className="text-sm text-stone-400">
              {form.title || 'Event Planner'}{form.businessName ? ` · ${form.businessName}` : ''}
            </p>
          </div>
          {emailjsConnected && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 ring-1 ring-emerald-200 px-3 py-1.5 rounded-full">
              <Check size={11} />
              Email connected
            </div>
          )}
        </CardBody>
      </Card>

      {/* Profile info */}
      <Card>
        <CardBody className="space-y-4 py-5">
          <SectionLabel icon={User} label="Profile Information" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Full Name" placeholder="e.g. Sophia Laurent"
              value={form.name} onChange={(e) => set('name', e.target.value)} />
            <Input label="Job Title" placeholder="e.g. Senior Event Planner"
              value={form.title} onChange={(e) => set('title', e.target.value)} />
            <Input label="Business / Agency Name" placeholder="e.g. Thalia Events Studio"
              value={form.businessName} onChange={(e) => set('businessName', e.target.value)}
              className="col-span-2" />
          </div>
        </CardBody>
      </Card>

      {/* Avatar color */}
      <Card>
        <CardBody className="py-5">
          <SectionLabel icon={Palette} label="Avatar Colour" />
          <div className="flex flex-wrap gap-2.5">
            {AVATAR_GRADIENTS.map((g) => (
              <button key={g.value} title={g.label}
                onClick={() => set('avatarColor', g.value)}
                className={`w-9 h-9 rounded-xl bg-gradient-to-br ${g.value} transition-all ${
                  form.avatarColor === g.value ? 'ring-2 ring-offset-2 ring-brand-500 scale-110' : 'hover:scale-105'
                }`}
              />
            ))}
          </div>
        </CardBody>
      </Card>

      {/* WhatsApp */}
      <Card>
        <CardBody className="py-5 space-y-4">
          <SectionLabel icon={MessageCircle} label="WhatsApp" />
          <div className="flex items-start gap-3 bg-[#25D366]/5 ring-1 ring-[#25D366]/20 rounded-xl px-4 py-3 text-sm text-stone-600">
            <Info size={14} className="text-[#25D366] shrink-0 mt-0.5" />
            <p>WhatsApp doesn't allow direct sending from web portals — messages open in the WhatsApp app with content pre-filled so you just tap Send. Save your number here so clients can also reach you back.</p>
          </div>
          <Input label="Your WhatsApp Number" placeholder="+1 415 555 0000"
            value={form.whatsappNumber} onChange={(e) => set('whatsappNumber', e.target.value)} />
        </CardBody>
      </Card>

      {/* Direct Email via EmailJS */}
      <Card>
        <CardBody className="py-5 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <SectionLabel icon={Mail} label="Email — Direct Send" />
            {emailjsConnected
              ? <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 ring-1 ring-emerald-200 px-2.5 py-1 rounded-full -mt-4 flex items-center gap-1"><Check size={10} />Connected</span>
              : <span className="text-xs font-semibold text-amber-600 bg-amber-50 ring-1 ring-amber-200 px-2.5 py-1 rounded-full -mt-4">Not configured</span>
            }
          </div>

          <EmailJSSetupGuide />

          <div className="space-y-3 pt-1">
            <Input label="EmailJS Service ID" placeholder="service_xxxxxxx"
              value={form.emailjsServiceId} onChange={(e) => set('emailjsServiceId', e.target.value)} />
            <Input label="EmailJS Template ID" placeholder="template_xxxxxxx"
              value={form.emailjsTemplateId} onChange={(e) => set('emailjsTemplateId', e.target.value)} />
            <Input label="EmailJS Public Key" placeholder="xxxxxxxxxxxxxxxxxxxx"
              value={form.emailjsPublicKey} onChange={(e) => set('emailjsPublicKey', e.target.value)} />
          </div>

          <p className="text-xs text-stone-400">
            Once connected, reminder emails send with one click directly from Thalia — no Gmail tab needed.
          </p>
        </CardBody>
      </Card>

      <div className="flex items-center justify-between pt-1">
        <SaveBanner saved={saved} />
        <Button icon={<Save size={15} />} onClick={handleSave} className="ml-auto">
          Save Changes
        </Button>
      </div>
    </div>
  )
}

// ─── Client Settings ───────────────────────────────────────────────────────────
function ClientSettings() {
  const { clientProfile, setClientProfile, events, updateEvent } = useStore()
  const [form, setForm] = useState({ ...clientProfile })
  const [saved, setSaved] = useState(false)
  const [syncedCount, setSyncedCount] = useState(0)

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const handleSave = () => {
    setClientProfile(form)

    // Sync contact info to ALL events that match this client (by previous email
    // or name, so the user can update their email and still propagate it).
    const prevEmail = clientProfile.email.trim().toLowerCase()
    const prevName  = clientProfile.name.trim().toLowerCase()
    const newName   = form.name.trim()
    const newEmail  = form.email.trim()
    const newPhone  = form.whatsappNumber.trim()

    let count = 0
    events.forEach(e => {
      const matchesEmail = prevEmail && e.clientEmail.trim().toLowerCase() === prevEmail
      const matchesName  = prevName  && e.clientName.trim().toLowerCase()  === prevName
      // Also match against the new email/name in case the user is updating their profile for the first time
      const matchesNewEmail = newEmail && e.clientEmail.trim().toLowerCase() === newEmail.toLowerCase()
      const matchesNewName  = newName  && e.clientName.trim().toLowerCase()  === newName.toLowerCase()

      if (matchesEmail || matchesName || matchesNewEmail || matchesNewName) {
        const updates: Record<string, string> = {}
        if (newPhone) updates.clientPhone = newPhone
        if (newEmail) updates.clientEmail = newEmail
        if (newName)  updates.clientName  = newName
        if (Object.keys(updates).length > 0) {
          updateEvent(e.id, updates)
          count++
        }
      }
    })

    setSyncedCount(count)
    setSaved(true)
    setTimeout(() => { setSaved(false); setSyncedCount(0) }, 4000)
  }

  const initial = form.name?.trim() ? form.name.charAt(0).toUpperCase() : 'C'

  return (
    <div className="space-y-6">
      <Card>
        <CardBody className="flex items-center gap-5 py-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sage-400 to-sage-600 flex items-center justify-center shadow-md shrink-0">
            <span className="font-display text-white text-2xl font-bold">{initial}</span>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-stone-900 text-base">{form.name || 'Your Name'}</p>
            <p className="text-sm text-stone-400">{form.email || 'No email set'}</p>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-4 py-5">
          <SectionLabel icon={User} label="Your Details" />
          <Input label="Full Name" placeholder="e.g. Aisha Patel"
            value={form.name} onChange={(e) => set('name', e.target.value)} />
        </CardBody>
      </Card>

      <Card>
        <CardBody className="py-5 space-y-4">
          <SectionLabel icon={Phone} label="WhatsApp Number" />
          <div className="flex items-start gap-3 bg-[#25D366]/5 ring-1 ring-[#25D366]/20 rounded-xl px-4 py-3 text-sm text-stone-600">
            <Info size={14} className="text-[#25D366] shrink-0 mt-0.5" />
            <p>Your planner will send approval reminders to this number via WhatsApp.</p>
          </div>
          <Input label="WhatsApp Number" placeholder="+1 415 555 0101"
            value={form.whatsappNumber} onChange={(e) => set('whatsappNumber', e.target.value)} />
        </CardBody>
      </Card>

      <Card>
        <CardBody className="py-5 space-y-4">
          <SectionLabel icon={AtSign} label="Email Address" />
          <div className="flex items-start gap-3 bg-[#EA4335]/5 ring-1 ring-[#EA4335]/20 rounded-xl px-4 py-3 text-sm text-stone-600">
            <Info size={14} className="text-[#EA4335] shrink-0 mt-0.5" />
            <p>Your planner will email design concept reviews and event updates directly to this address.</p>
          </div>
          <Input label="Email Address" type="email" placeholder="you@example.com"
            value={form.email} onChange={(e) => set('email', e.target.value)} />
        </CardBody>
      </Card>

      <div className="flex items-center justify-between pt-1">
        {saved ? (
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 rounded-xl px-4 py-2.5 text-sm font-medium animate-fade-in">
            <Check size={14} />
            Changes saved{syncedCount > 0 ? ` — synced to ${syncedCount} event${syncedCount !== 1 ? 's' : ''}` : ''}
          </div>
        ) : <span />}
        <Button variant="client" icon={<Save size={15} />} onClick={handleSave} className="ml-auto">
          Save Changes
        </Button>
      </div>
    </div>
  )
}

// ─── Page shell ────────────────────────────────────────────────────────────────
export function SettingsPage() {
  const { role } = useStore()
  const isPlanner = role === 'planner'

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl animate-fade-in">
      {/* Logo hero strip */}
      <div className="flex items-center gap-4 sm:gap-6 mb-6 sm:mb-8 pb-6 sm:pb-7 border-b border-stone-100">
        <ThaliaFullLogo width={110} className="shrink-0" />
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-stone-900">
            {isPlanner ? 'Planner Settings' : 'My Profile'}
          </h1>
          <p className="text-stone-500 mt-1 text-sm">
            {isPlanner
              ? 'Manage your profile, connect email for direct sending, and configure notifications.'
              : 'Update your contact details so your planner can reach you.'}
          </p>
        </div>
      </div>
      {isPlanner ? <PlannerSettings /> : <ClientSettings />}
    </div>
  )
}
