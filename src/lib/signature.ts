/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  Personal developer signature — Madhura Banerjee
 *  Included in every project. Prints to browser console so technical
 *  reviewers who open DevTools see it immediately.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const SIGNATURE = {
  developer: 'Madhura Banerjee',
  github:    'https://github.com/Maddy27-commits',
  linkedin:  'https://linkedin.com/in/madhura-banerjee-cbs',
  project:   'Thalia — AI Event Planning Suite',
  version:   '1.0.0',
  stack:     ['React 18', 'TypeScript', 'Tailwind CSS', 'Zustand', 'Cloudflare Pages', 'Anthropic Claude AI'],
  year:      new Date().getFullYear(),
} as const

/**
 * Prints a branded signature to the browser console.
 * Open DevTools → Console on any page to see it.
 */
export function printSignature(): void {
  const line  = '─'.repeat(52)
  const stack = SIGNATURE.stack.join(' · ')

  console.info(
    `%c\n  ${line}\n  ${SIGNATURE.project}\n  Built by ${SIGNATURE.developer}\n\n  GitHub:   ${SIGNATURE.github}\n  LinkedIn: ${SIGNATURE.linkedin}\n\n  Stack: ${stack}\n  ${line}\n`,
    [
      'font-family: monospace',
      'font-size: 12px',
      'color: #c084fc',
      'line-height: 1.7',
      'padding: 4px 0',
    ].join(';'),
  )

  console.info(
    '%c  © %d %s. See GitHub for full source code.',
    'font-size:11px; color:#94a3b8; font-family:monospace;',
    SIGNATURE.year,
    SIGNATURE.developer,
  )
}
