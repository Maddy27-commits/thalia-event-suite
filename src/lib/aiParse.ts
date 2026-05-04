/**
 * Robust JSON extraction + Zod validation for Claude responses.
 *
 * Why this matters: Claude can wrap JSON in ```json fences, prepend
 * commentary ("Here is the JSON:..."), or occasionally truncate. Naive
 * `JSON.parse(text)` and a regex-only strip will throw and crash the
 * caller. We do balanced-brace extraction first, then validate against
 * a Zod schema so callers get either a typed value or a clear error.
 */
import { z } from 'zod'

/** Find the first balanced JSON object/array in `text`. Returns null if none. */
export function extractJsonBlock(text: string): string | null {
  if (!text) return null

  // Find the earliest opening brace/bracket
  const objStart = text.indexOf('{')
  const arrStart = text.indexOf('[')
  let start = -1
  let openCh = ''
  let closeCh = ''

  if (objStart === -1 && arrStart === -1) return null
  if (objStart === -1)      { start = arrStart; openCh = '['; closeCh = ']' }
  else if (arrStart === -1) { start = objStart; openCh = '{'; closeCh = '}' }
  else if (objStart < arrStart) { start = objStart; openCh = '{'; closeCh = '}' }
  else                          { start = arrStart; openCh = '['; closeCh = ']' }

  // Walk forward tracking string state and brace depth
  let depth = 0
  let inString = false
  let escaped = false
  for (let i = start; i < text.length; i++) {
    const ch = text[i]
    if (inString) {
      if (escaped) { escaped = false; continue }
      if (ch === '\\') { escaped = true; continue }
      if (ch === '"')  { inString = false; continue }
      continue
    }
    if (ch === '"') { inString = true; continue }
    if (ch === openCh)  depth++
    else if (ch === closeCh) {
      depth--
      if (depth === 0) return text.slice(start, i + 1)
    }
  }
  return null
}

/** Parse + validate a Claude response against a Zod schema. Throws on failure. */
export function parseAIResponse<T>(text: string, schema: z.ZodType<T>): T {
  const block = extractJsonBlock(text)
  if (!block) {
    throw new Error('AI response did not contain a JSON object or array.')
  }
  let raw: unknown
  try {
    raw = JSON.parse(block)
  } catch (err) {
    throw new Error(`AI response was not valid JSON: ${(err as Error).message}`)
  }
  const result = schema.safeParse(raw)
  if (!result.success) {
    const issues = result.error.issues.slice(0, 3).map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
    throw new Error(`AI response failed validation: ${issues}`)
  }
  return result.data
}

// ─── Schemas ──────────────────────────────────────────────────────────────────

export const decorItemSchema = z.object({
  name:          z.string().min(1),
  description:   z.string().default(''),
  estimatedCost: z.string().default(''),
})

export const conceptSchema = z.object({
  title:              z.string().min(1),
  tagline:            z.string().default(''),
  theme:              z.string().default(''),
  colorPalette:       z.array(z.string()).default([]),
  mood:               z.string().default(''),
  venueDescription:   z.string().default(''),
  decorItems:         z.array(decorItemSchema).default([]),
  cateringNotes:      z.string().default(''),
  entertainmentNotes: z.string().default(''),
  estimatedBudget:    z.string().default(''),
  styleKeywords:      z.array(z.string()).optional(),
})

export const conceptArraySchema = z.array(conceptSchema).min(1)

export const taskInsightSchema = z.object({
  preferences: z.array(z.string()).default([]),
  concerns:    z.array(z.string()).default([]),
  decisions:   z.array(z.string()).default([]),
  sentiment:   z.enum(['positive', 'neutral', 'negative']).default('neutral'),
})

/** Discussion starter prompts surfaced inside a task's chat composer. */
export const starterPromptsSchema = z.array(z.string().min(1)).min(1).max(5)

/** Option/recommendation suggestions surfaced inside the Recommendations phase. */
export const optionSuggestionsSchema = z.array(z.object({
  title:         z.string().min(1),
  description:   z.string().default(''),
  estimatedCost: z.string().default(''),
  pros:          z.array(z.string()).default([]),
  cons:          z.array(z.string()).default([]),
})).min(1).max(6)

export type ParsedConcept = z.infer<typeof conceptSchema>
export type ParsedTaskInsight = z.infer<typeof taskInsightSchema>
export type ParsedOptionSuggestion = z.infer<typeof optionSuggestionsSchema>[number]
