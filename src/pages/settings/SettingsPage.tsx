import { useState } from 'react'
import {
  User, Mail, Palette,
  Check, Save, AtSign,
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

      {/* Email — auto-managed */}
      <Card>
        <CardBody className="py-4 px-5">
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5">
              <Mail size={14} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-700 mb-0.5">Email delivery</p>
              <p className="text-xs text-stone-400 leading-relaxed">
                Reminder and concept emails are sent automatically via Thalia's delivery service. No setup required on your end.
              </p>
            </div>
          </div>
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

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const handleSave = () => {
    setClientProfile(form)

    // Sync email + name changes back to matching events
    const prevEmail = clientProfile.email.trim().toLowerCase()
    const prevName  = clientProfile.name.trim().toLowerCase()
    const newName   = form.name.trim()
    const newEmail  = form.email.trim()

    events.forEach(e => {
      const matchesEmail    = prevEmail && e.clientEmail.trim().toLowerCase() === prevEmail
      const matchesName     = prevName  && e.clientName.trim().toLowerCase()  === prevName
      const matchesNewEmail = newEmail  && e.clientEmail.trim().toLowerCase() === newEmail.toLowerCase()
      const matchesNewName  = newName   && e.clientName.trim().toLowerCase()  === newName.toLowerCase()

      if (matchesEmail || matchesName || matchesNewEmail || matchesNewName) {
        const updates: Record<string, string> = {}
        if (newEmail) updates.clientEmail = newEmail
        if (newName)  updates.clientName  = newName
        if (Object.keys(updates).length > 0) updateEvent(e.id, updates)
      }
    })

    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
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
          <SectionLabel icon={AtSign} label="Email Address" />
          <p className="text-xs text-stone-400 -mt-2">Your planner uses this email to send concept reviews and event updates.</p>
          <Input label="Email Address" type="email" placeholder="you@example.com"
            value={form.email} onChange={(e) => set('email', e.target.value)} />
        </CardBody>
      </Card>

      <div className="flex items-center justify-between pt-1">
        {saved ? (
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 rounded-xl px-4 py-2.5 text-sm font-medium animate-fade-in">
            <Check size={14} />
            Changes saved
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
              ? 'Manage your profile, avatar, and contact preferences.'
              : 'Update your contact details so your planner can reach you.'}
          </p>
        </div>
      </div>
      {isPlanner ? <PlannerSettings /> : <ClientSettings />}
    </div>
  )
}
