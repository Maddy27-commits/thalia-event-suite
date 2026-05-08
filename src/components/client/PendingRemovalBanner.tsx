import { AlertCircle } from 'lucide-react'
import { useStore } from '../../store'
import { useClientEvent } from '../../hooks/useClientEvent'

/**
 * Shown only to organisers — surfaces any pending stakeholder-removal
 * requests on the current event. Any organiser (other than the requester)
 * can approve. Self-removals never reach this banner because they
 * auto-approve on the spot.
 */
export function PendingRemovalBanner() {
  const { event, stakeholder } = useClientEvent()
  const { approveStakeholderRemoval, declinePendingAction } = useStore()
  if (!event || !stakeholder) return null
  if (stakeholder.role !== 'organiser') return null

  const myEmail = stakeholder.email.toLowerCase()
  const pending = (event.pendingActions ?? []).filter(
    (a) =>
      a.kind === 'remove-stakeholder' &&
      !a.approvedAt &&
      !a.declinedAt &&
      a.requestedBy.toLowerCase() !== myEmail   // can't approve your own request
  )
  if (pending.length === 0) return null

  return (
    <div className="space-y-2 animate-fade-in">
      {pending.map((action) => {
        const target = (event.stakeholders ?? []).find((s) => s.id === action.payload.stakeholderId)
        if (!target) return null
        return (
          <div
            key={action.id}
            className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl bg-amber-50 ring-1 ring-amber-200 px-4 py-3"
          >
            <AlertCircle size={16} className="text-amber-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-900">
                Approve removal of {target.name}?
              </p>
              <p className="text-[11px] text-amber-700 leading-relaxed">
                {action.requestedBy} requested this on {new Date(action.requestedAt).toLocaleDateString()}. Once approved, {target.name.split(' ')[0]} will lose portal access for this event.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => declinePendingAction(event.id, action.id)}
                className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white text-stone-600 ring-1 ring-stone-200 hover:bg-stone-50"
              >
                Decline
              </button>
              <button
                onClick={() => approveStakeholderRemoval(event.id, action.id, myEmail)}
                className="text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-600 text-white hover:bg-emerald-700"
              >
                Approve
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
