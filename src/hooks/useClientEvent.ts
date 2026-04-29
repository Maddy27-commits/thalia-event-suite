import { useStore } from '../store'
import type { Event } from '../types'

/**
 * Resolve the event(s) that belong to the currently-logged-in client.
 *
 * Match priority:
 *   1. session.clientEventId  — set at login for clients; also set during planner preview
 *   2. clientProfile.email matches event.clientEmail (case-insensitive)
 *   3. clientProfile.name  matches event.clientName  (case-insensitive)
 *   4. activeEventId fallback (legacy / single-event setups)
 *   5. events[0] fallback (very first time setup, no profile yet)
 *
 * Returns:
 *   event   – the resolved event or null
 *   matches – every event matching the client identity (for picker UIs)
 */
export function useClientEvent(): { event: Event | null; matches: Event[] } {
  const { events, clientProfile, activeEventId, session } = useStore()

  // 1. Session clientEventId — most authoritative (set at login + preview)
  if (session?.clientEventId) {
    const locked = events.find(e => e.id === session.clientEventId)
    if (locked) return { event: locked, matches: [locked] }
  }

  // 2. Also check previewEventId (planner preview mode)
  if (session?.isPlannerPreview && session.previewEventId) {
    const preview = events.find(e => e.id === session.previewEventId)
    if (preview) return { event: preview, matches: [preview] }
  }

  const email = clientProfile.email.trim().toLowerCase()
  const name  = clientProfile.name.trim().toLowerCase()

  let matches: Event[] = []
  if (email) {
    matches = events.filter(e => e.clientEmail.trim().toLowerCase() === email)
  }
  if (matches.length === 0 && name) {
    matches = events.filter(e => e.clientName.trim().toLowerCase() === name)
  }

  // If we found matches, prefer the active one if present, else first
  if (matches.length > 0) {
    const active = matches.find(e => e.id === activeEventId)
    return { event: active ?? matches[0], matches }
  }

  // Legacy fallback: if no profile is set, use the active event or events[0]
  if (events.length > 0) {
    const active = events.find(e => e.id === activeEventId)
    return { event: active ?? events[0], matches: events }
  }

  return { event: null, matches: [] }
}
