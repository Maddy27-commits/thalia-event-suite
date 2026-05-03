import { useEffect } from 'react'
import { useStore } from '../store'
import type { Event } from '../types'

/**
 * Returns only the events owned by the currently logged-in planner.
 *
 * Ownership rules:
 *   1. `plannerEmail` matches current session email → shown.
 *   2. `plannerEmail` is empty/missing (legacy) → shown ONLY if the current
 *      planner is the sole registered account (genuine single-user upgrade
 *      from a pre-multi-tenant build). Otherwise hidden — we cannot infer
 *      ownership, so it is safer to hide than to leak across accounts.
 *   3. `plannerEmail` belongs to a different account → hidden.
 *
 * Auto-claim only fires in the single-planner case to avoid the "first
 * planner who logs in inherits everyone's orphan events" bug.
 */
export function usePlannerEvents(): Event[] {
  const { events, session, registeredPlanners, updateEvent } = useStore()

  const isSolePlanner = registeredPlanners.length <= 1

  useEffect(() => {
    if (!session || session.role !== 'planner' || session.isPlannerPreview) return
    if (!isSolePlanner) return // Multiple planners exist — never auto-claim
    events.forEach((e) => {
      if (!e.plannerEmail || e.plannerEmail === '') {
        updateEvent(e.id, { plannerEmail: session.email })
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.email, isSolePlanner])

  if (!session) return []

  const email = session.email.toLowerCase()

  return events.filter((e) => {
    if (!e.plannerEmail || e.plannerEmail === '') {
      // Only show legacy events when we're confident they belong to this user
      return isSolePlanner
    }
    return e.plannerEmail.toLowerCase() === email
  })
}
