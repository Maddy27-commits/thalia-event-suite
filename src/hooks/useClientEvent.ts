import { useStore } from '../store'
import type { Event } from '../types'

/**
 * Resolve the event(s) that belong to the currently-logged-in client.
 *
 * Match priority:
 *   1. clientProfile.email matches event.clientEmail (case-insensitive)
 *   2. clientProfile.name  matches event.clientName  (case-insensitive)
 *   3. activeEventId fallback (legacy / single-event setups)
 *   4. events[0] fallback (very first time setup, no profile yet)
 *
 * Returns:
 *   event   – the resolved event or null
 *   matches – every event matching the client identity (for picker UIs)
 */
export function useClientEvent(): { event: Event | null; matches: Event[] } {
  const { events, clientProfile, activeEventId } = useStore()

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
