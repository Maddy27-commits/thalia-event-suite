import { useState } from 'react'
import { Mail, Copy, Check, AlertCircle } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Textarea } from '../ui/Input'
import { Badge } from '../ui/Badge'
import { useStore } from '../../store'
import type { Event } from '../../types'

interface Props {
  open: boolean
  onClose: () => void
  event: Event
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

export function SendReminderModal({ open, onClose, event }: Props) {
  const { events } = useStore()
  const [copied, setCopied]     = useState(false)
  const [emailBody, setEmailBody] = useState(() => buildEmailBody(event))

  // Always use the live event so nothing is stale
  const liveEvent   = events.find((e) => e.id === event.id) ?? event
  const pending     = liveEvent.concepts.filter((c) => c.status === 'pending')
  const clientEmail = liveEvent.clientEmail?.trim()
  const hasEmail    = !!clientEmail

  // mailto: URLs hit OS-imposed length caps (~2000 chars on Windows, ~8KB on
  // most Macs/Linux). Once the encoded URL crosses ~1800 chars we switch to a
  // Gmail web compose URL — which has no practical cap — so the email still
  // opens correctly. Plain mailto is preferred when it fits because it works
  // with the user's *default* mail client (Apple Mail, Outlook, etc.).
  const subject = buildEmailSubject(liveEvent)
  const mailtoLink   = `mailto:${encodeURIComponent(clientEmail ?? '')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`
  const gmailLink    = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(clientEmail ?? '')}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`
  const useGmail     = mailtoLink.length > 1800
  const composeLink  = useGmail ? gmailLink : mailtoLink

  const copyText = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ── Nothing pending ────────────────────────────────────────────────────────
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

        {/* Client email */}
        {hasEmail ? (
          <div className="flex items-center gap-2.5 bg-sage-50 ring-1 ring-sage-200 rounded-xl px-4 py-2.5 text-sm text-sage-700">
            <Mail size={13} className="shrink-0" />
            <span className="font-medium">{clientEmail}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 bg-stone-50 ring-1 ring-red-200 rounded-xl px-4 py-2.5 text-sm text-red-600">
            <Mail size={13} className="shrink-0" />
            No email saved — add the client email in the event details to enable sending.
          </div>
        )}

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

        {/* Subject preview */}
        <div>
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-1.5">Subject</p>
          <div className="bg-stone-50 ring-1 ring-stone-200 rounded-xl px-3.5 py-2.5 text-sm text-stone-700 font-medium">
            {buildEmailSubject(liveEvent)}
          </div>
        </div>

        {/* Editable email body */}
        <Textarea
          label="Email Body (editable)"
          rows={9}
          value={emailBody}
          onChange={(e) => setEmailBody(e.target.value)}
        />

        {/* Info note */}
        <div className="flex items-start gap-2.5 bg-blue-50 ring-1 ring-blue-100 rounded-xl px-4 py-3 text-sm">
          <Mail size={14} className="text-blue-500 shrink-0 mt-0.5" />
          <p className="text-blue-700">
            Opens your email app pre-filled and ready to send — works with Gmail, Outlook, Apple Mail, or any default email client.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            icon={copied ? <Check size={14} /> : <Copy size={14} />}
            onClick={() => copyText(emailBody)}
          >
            {copied ? 'Copied' : 'Copy'}
          </Button>
          <a
            href={hasEmail ? composeLink : undefined}
            target={useGmail ? '_blank' : undefined}
            rel={useGmail ? 'noreferrer noopener' : undefined}
            onClick={!hasEmail ? (e) => e.preventDefault() : undefined}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white transition-all ${
              !hasEmail ? 'opacity-40 cursor-not-allowed bg-stone-400' : 'bg-[#EA4335] hover:opacity-90'
            }`}
          >
            <Mail size={14} />
            {useGmail ? 'Open in Gmail' : 'Open Email App'}
          </a>
        </div>

      </div>
    </Modal>
  )
}
