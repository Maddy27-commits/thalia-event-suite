export function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(' ')
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount)
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function daysUntil(dateStr: string): number {
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 10)
}

export function completionPercent(milestones: { completed: boolean }[]): number {
  if (!milestones.length) return 0
  return Math.round((milestones.filter((m) => m.completed).length / milestones.length) * 100)
}

/**
 * Offset an ISO date string by N days (positive = later, negative = earlier).
 * Returns ISO YYYY-MM-DD form.
 */
export function offsetDate(isoDate: string, days: number): string {
  if (!isoDate) return ''
  const d = new Date(isoDate)
  if (isNaN(d.getTime())) return ''
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}
