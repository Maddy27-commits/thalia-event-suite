import { useEffect } from 'react'
import { useStore } from '../store'
import type { Event } from '../types'

/**
 * Returns only the events owned by the currently logged-in planner.
 *
 * Ownership rules:
 *   1. `plannerEmail` matches current session email → shown.
 *   2. `plannerEmail` is empty/missing (legacy) → shown AND stamped with the
 *      current planner's email via a side-effect so it won't float freely again.
 *   3. `plannerEmail` belongs to a different account → hidden.
 */
export function usePlannerEvents(): Event[] {
  const { events, session, updateEvent } = useStore()

  // Claim any legacy events that have no owner — stamp them with the current
  // planner's email so they stop being visible to every account.
  useEffect(() => {
    if (!session || session.role !== 'planner' || session.isPlannerPreview) return
    events.forEach((e) => {
      if (!e.plannerEmail || e.plannerEmail === '') {
        updateEvent(e.id, { plannerEmail: session.email })
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.email])

  if (!session) return []

  const email = session.email.toLowerCase()

  return events.filter((e) => {
    // Legacy (unclaimed) — show until the effect above stamps them
    if (!e.plannerEmail || e.plannerEmail === '') return true
    // Owned by this planner
    return e.plannerEmail.toLowerCase() === email
  })
}
