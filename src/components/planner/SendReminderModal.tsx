import { useState } from 'react'
import emailjs from '@emailjs/browser'
import {
  MessageCircle, Mail, Copy, Check, ExternalLink,
  AlertCircle, Phone, Send, Loader2, Settings, X,
} from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Textarea } from '../ui/Input'
import { Badge } from '../ui/Badge'
import { useStore } from '../../store'
import { useNavigate } from 'react-router-dom'
import type { Event } from '../../types'

interface Props {
  open: boolean
  onClose: () => void
  event: Event
}

// ── Message builders ──────────────────────────────────────────────────────────
function buildWhatsAppMessage(event: Event): string {
  const pending = event.concepts.filter((c) => c.status === 'pending')
  const list = pending.map((c) => `  • *${c.title}*`).join('\n')
  return [
    `Hi ${event.clientName}! 👋`,
    ``,
    `Just a gentle nudge from your Thalia planner regarding *${event.name}*:`,
    ``,
    `You have *${pending.length} design concept${pending.length !== 1 ? 's' : ''}* waiting for your review:`,
    list,
    ``,
    `Your feedback keeps us on track — please take a moment to share your thoughts!`,
    ``,
    `Thank you 🌟`,
  ].join('\n')
}

function buildEmailSubject(event: Event): string {
  const n = event.concepts.filter((c) => c.status === 'pending').length
  return `Action needed: ${n} design concept${n !== 1 ? 's' : ''} awaiting your approval — ${event.name}`
}

function buildEmailBody(event: Event): string {
  const pending = event.concepts.filter((c) => c.status === 'pending')
  const list = pending.map((c) => `  • ${c.title}  (est. ${c.estimatedBudget})`).join('\n')
  return [
    `Hi ${event.clientName},`,
    ``,
    `I hope you're excited about ${event.name}! Just a quick note to let you know that ${pending.length} design concept${pending.length !== 1 ? 's are' : ' is'} ready for your review:`,
    ``,
    list,
    ``,
    `Your feedback helps us move forward with bookings and timelines, so any thoughts you can share would be wonderful.`,
    ``,
    `Don't hesitate to reach out if you have any questions — I'm here to make your event perfect!`,
    ``,
    `Warmly,`,
    `Your Thalia Event Planner`,
  ].join('\n')
}

type Channel  = 'whatsapp' | 'email'
type EmailMode = 'mailto' | 'emailjs'
type SendState = 'idle' | 'sending' | 'sent' | 'error'

// ── Component ─────────────────────────────────────────────────────────────────
export function SendReminderModal({ open, onClose, event }: Props) {
  const { clientProfile, plannerProfile, events } = useStore()
  const navigate = useNavigate()

  const [channel,    setChannel]    = useState<Channel>('whatsapp')
  const [copied,     setCopied]     = useState(false)
  const [waMessage,  setWaMessage]  = useState(() => buildWhatsAppMessage(event))
  const [emailBody,  setEmailBody]  = useState(() => buildEmailBody(event))
  const [sendState,  setSendState]  = useState<SendState>('idle')
  const [sendError,  setSendError]  = useState('')

  // Always read the LIVE version of the event from the store so we never use a
  // stale snapshot (e.g. client updated their profile after the modal was opened)
  const liveEvent = events.find((e) => e.id === event.id) ?? event

  const pending = liveEvent.concepts.filter((c) => c.status === 'pending')

  // Resolve contact info:
  // • clientProfile takes priority for email/phone because the client explicitly
  //   saved it themselves — treat it as more authoritative than whatever the
  //   planner typed when creating the event.
  // • Fall back to the event-stored value if the profile field is empty.
  const resolvedPhone = clientProfile.whatsappNumber?.trim() || liveEvent.clientPhone?.trim()
  const resolvedEmail = clientProfile.email?.trim()          || liveEvent.clientEmail?.trim()
  const hasPhone = !!resolvedPhone
  const hasEmail = !!resolvedEmail
  const phoneSource = clientProfile.whatsappNumber?.trim() ? 'profile' : liveEvent.clientPhone?.trim() ? 'event' : 'none'
  const emailSource = clientProfile.email?.trim()          ? 'profile' : liveEvent.clientEmail?.trim() ? 'event' : 'none'

  // EmailJS configured?
  const emailjsReady = !!(
    plannerProfile.emailjsServiceId?.trim() &&
    plannerProfile.emailjsTemplateId?.trim() &&
    plannerProfile.emailjsPublicKey?.trim()
  )
  const emailMode: EmailMode = emailjsReady ? 'emailjs' : 'mailto'

  // ── Deep links ──────────────────────────────────────────────────────────────
  const phone   = resolvedPhone?.replace(/\D/g, '')
  const waLink  = `https://wa.me/${phone}?text=${encodeURIComponent(waMessage)}`

  // mailto: works with any email client — zero setup, pre-fills everything
  const mailtoLink = `mailto:${encodeURIComponent(resolvedEmail ?? '')}?subject=${encodeURIComponent(buildEmailSubject(liveEvent))}&body=${encodeURIComponent(emailBody)}`

  // ── Actions ─────────────────────────────────────────────────────────────────
  const copyText = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const sendViaEmailJS = async () => {
    if (!emailjsReady || !resolvedEmail) return
    setSendState('sending')
    setSendError('')
    try {
      await emailjs.send(
        plannerProfile.emailjsServiceId,
        plannerProfile.emailjsTemplateId,
        {
          to_email:  resolvedEmail,
          to_name:   event.clientName,
          from_name: plannerProfile.name || 'Your Thalia Event Planner',
          subject:   buildEmailSubject(event),
          message:   emailBody,
        },
        plannerProfile.emailjsPublicKey,
      )
      setSendState('sent')
    } catch (err: any) {
      setSendError(err?.text || 'Send failed — double-check your EmailJS credentials in Settings.')
      setSendState('error')
    }
  }

  // ── No-pending guard ─────────────────────────────────────────────────────────
  if (pending.length === 0) {
    return (
      <Modal open={open} onClose={onClose} title="Send Reminder" size="md">
        <div className="p-6 py-12 flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-sage-50 flex items-center justify-center">
            <Check size={22} className="text-sage-500" />
          </div>
          <p className="font-semibold text-stone-800">All caught up!</p>
          <p className="text-sm text-stone-400">
            All concepts for <strong>{liveEvent.clientName}</strong> have already been reviewed.
          </p>
          <Button variant="secondary" className="mt-2" onClick={onClose}>Close</Button>
        </div>
      </Modal>
    )
  }

  // ── Contact pill ─────────────────────────────────────────────────────────────
  const ContactPill = ({ resolved, source, icon: Icon, missing }: {
    resolved: string | undefined
    source: string
    icon: React.ElementType
    missing: string
  }) => resolved ? (
    <div className="flex items-center gap-2.5 bg-sage-50 ring-1 ring-sage-200 rounded-xl px-4 py-2.5 text-sm text-sage-700">
      <Icon size={13} className="shrink-0" />
      <span className="font-medium">{resolved}</span>
      {source === 'profile' && (
        <span className="ml-auto text-[10px] bg-sage-100 text-sage-600 px-2 py-0.5 rounded-full">from profile</span>
      )}
    </div>
  ) : (
    <div className="flex items-center gap-2.5 bg-stone-50 ring-1 ring-red-200 rounded-xl px-4 py-2.5 text-sm text-red-600">
      <Icon size={13} className="shrink-0" />
      {missing}
    </div>
  )

  return (
    <Modal open={open} onClose={onClose} title="Send Approval Reminder" size="xl">
      <div className="p-6 space-y-5">

        {/* Pending summary */}
        <div className="flex items-center gap-3 bg-amber-50 ring-1 ring-amber-200 rounded-xl px-4 py-3">
          <AlertCircle size={15} className="text-amber-500 shrink-0" />
          <p className="text-sm text-amber-800">
            <strong>{liveEvent.clientName}</strong> has{' '}
            <strong>{pending.length} concept{pending.length !== 1 ? 's' : ''}</strong> pending
            approval on <em>{liveEvent.name}</em>.
          </p>
        </div>

        {/* Channel tabs */}
        <div className="flex gap-2 p-1 bg-stone-100 rounded-xl">
          {(['whatsapp', 'email'] as Channel[]).map((ch) => (
            <button
              key={ch}
              onClick={() => { setChannel(ch); setSendState('idle') }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                channel === ch
                  ? ch === 'whatsapp'
                    ? 'bg-white shadow-sm text-[#128C7E]'
                    : 'bg-white shadow-sm text-[#EA4335]'
                  : 'text-stone-400 hover:text-stone-600'
              }`}
            >
              {ch === 'whatsapp' ? <MessageCircle size={15} /> : <Mail size={15} />}
              {ch === 'whatsapp' ? 'WhatsApp' : 'Email'}
            </button>
          ))}
        </div>

        {/* Pending concepts list */}
        <div className="space-y-1.5">
          {pending.map((c) => (
            <div key={c.id} className="flex items-center gap-2.5 bg-stone-50 rounded-lg px-3 py-2">
              <div className={`w-5 h-5 rounded-md bg-gradient-to-br ${c.coverGradient} shrink-0`} />
              <span className="text-sm font-medium text-stone-800 flex-1">{c.title}</span>
              <span className="text-xs text-stone-400">{c.estimatedBudget}</span>
              <Badge variant="warning">Pending</Badge>
            </div>
          ))}
        </div>

        {/* ── WhatsApp panel ── */}
        {channel === 'whatsapp' && (
          <div className="space-y-4">
            <ContactPill
              resolved={resolvedPhone}
              source={phoneSource}
              icon={Phone}
              missing="No phone number saved. Add it in the event or ask the client to save theirs in Settings."
            />
            <div className="flex items-start gap-2.5 bg-stone-50 ring-1 ring-stone-100 rounded-xl px-3.5 py-3 text-xs text-stone-500">
              <MessageCircle size={13} className="shrink-0 mt-0.5 text-[#25D366]" />
              WhatsApp doesn't allow web apps to send messages directly. The button below opens WhatsApp with your message pre-filled — just tap Send.
            </div>
            <Textarea label="Message (editable)" rows={8}
              value={waMessage} onChange={(e) => setWaMessage(e.target.value)} />
            <div className="flex gap-2">
              <Button variant="ghost" size="sm"
                icon={copied ? <Check size={14} /> : <Copy size={14} />}
                onClick={() => copyText(waMessage)}>
                {copied ? 'Copied' : 'Copy'}
              </Button>
              <button
                disabled={!hasPhone}
                onClick={() => window.open(waLink, '_blank')}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: hasPhone ? '#25D366' : '#aaa' }}
              >
                <ExternalLink size={14} />
                Open in WhatsApp
              </button>
            </div>
          </div>
        )}

        {/* ── Email panel ── */}
        {channel === 'email' && (
          <div className="space-y-4">
            <ContactPill
              resolved={resolvedEmail}
              source={emailSource}
              icon={Mail}
              missing="No email saved. Add it in the event or ask the client to save theirs in Settings."
            />

            {/* Mode indicator */}
            {emailMode === 'emailjs' ? (
              <div className="flex items-center gap-2 bg-emerald-50 ring-1 ring-emerald-200 rounded-xl px-4 py-2.5 text-sm text-emerald-700">
                <Check size={13} className="shrink-0" />
                <span>EmailJS connected — email will send directly without opening any app.</span>
              </div>
            ) : (
              <div className="flex items-start gap-2.5 bg-blue-50 ring-1 ring-blue-100 rounded-xl px-4 py-3 text-sm">
                <Mail size={14} className="text-blue-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-blue-800 font-medium">Opens your email app, pre-filled and ready to send</p>
                  <p className="text-blue-600 text-xs mt-0.5">Works with Gmail, Outlook, Apple Mail — whatever you use. Just click Send.</p>
                </div>
                <button
                  onClick={() => { onClose(); navigate('/planner/settings') }}
                  className="text-xs text-blue-400 hover:text-blue-600 flex items-center gap-1 shrink-0"
                >
                  <Settings size={11} /> Upgrade to direct send
                </button>
              </div>
            )}

            {/* Success / error banners */}
            {sendState === 'sent' && (
              <div className="flex items-center gap-2 bg-emerald-50 ring-1 ring-emerald-200 rounded-xl px-4 py-2.5 text-sm text-emerald-700 font-semibold">
                <Check size={14} /> Email sent to {resolvedEmail}!
              </div>
            )}
            {sendState === 'error' && (
              <div className="flex items-center gap-2 bg-red-50 ring-1 ring-red-200 rounded-xl px-4 py-2.5 text-sm text-red-700">
                <X size={14} /> {sendError}
              </div>
            )}

            {/* Subject preview */}
            <div>
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-1.5">Subject</p>
              <div className="bg-stone-50 ring-1 ring-stone-200 rounded-xl px-3.5 py-2.5 text-sm text-stone-700 font-medium">
                {buildEmailSubject(event)}
              </div>
            </div>

            <Textarea label="Email Body (editable)" rows={9}
              value={emailBody} onChange={(e) => setEmailBody(e.target.value)} />

            <div className="flex gap-2">
              <Button variant="ghost" size="sm"
                icon={copied ? <Check size={14} /> : <Copy size={14} />}
                onClick={() => copyText(emailBody)}>
                {copied ? 'Copied' : 'Copy'}
              </Button>

              {emailMode === 'emailjs' ? (
                <button
                  disabled={!hasEmail || sendState === 'sending' || sendState === 'sent'}
                  onClick={sendViaEmailJS}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: '#EA4335' }}
                >
                  {sendState === 'sending' ? <Loader2 size={14} className="animate-spin" /> :
                   sendState === 'sent'    ? <Check size={14} /> :
                                            <Send size={14} />}
                  {sendState === 'sending' ? 'Sending…' : sendState === 'sent' ? 'Sent!' : 'Send Email Now'}
                </button>
              ) : (
                <a
                  href={hasEmail ? mailtoLink : undefined}
                  onClick={!hasEmail ? (e) => e.preventDefault() : undefined}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white transition-all ${!hasEmail ? 'opacity-40 cursor-not-allowed' : 'hover:opacity-90'}`}
                  style={{ background: '#EA4335' }}
                >
                  <Mail size={14} />
                  Open Email App
                </a>
              )}
            </div>
          </div>
        )}

      </div>
    </Modal>
  )
}
