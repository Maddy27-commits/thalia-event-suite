import { useStore } from '../store'
import type { Event } from '../types'

/**
 * Returns only the events owned by the currently logged-in planner.
 *
 * Scoping rules:
 *   1. Events with no plannerEmail (legacy) are shown to all planners.
 *   2. Events stamped with 'demo@thalia.app' are only shown when no
 *      registered planner is active (i.e. the app is in its initial demo state).
 *   3. Events stamped with the current planner's email are shown to that planner.
 *   4. In planner-preview mode the hook still returns the planner's own events
 *      (the client view uses useClientEvent instead).
 */
export function usePlannerEvents(): Event[] {
  const { events, session } = useStore()

  if (!session) {
    // Unauthenticated — show nothing (routing will redirect to /welcome anyway)
    return []
  }

  const email = session.email.toLowerCase()

  return events.filter((e) => {
    if (!e.plannerEmail) return true                              // legacy events (no owner)
    return e.plannerEmail.toLowerCase() === email                // own events only
  })
}
