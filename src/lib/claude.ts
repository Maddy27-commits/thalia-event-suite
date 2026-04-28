import Anthropic from '@anthropic-ai/sdk'
import type { ConceptGeneratorInput, EventConcept, TaskInsight } from '../types'
import { getImagesForConcept } from './images'

// ─── Unified AI caller ────────────────────────────────────────────────────────
// Priority: user-supplied key (direct to Anthropic) → server proxy → error.
// This lets the app owner host the key server-side (zero friction for visitors)
// while still allowing power users to supply their own key in Settings.
async function callAI(
  apiKey: string,
  params: Anthropic.Messages.MessageCreateParamsNonStreaming,
): Promise<Anthropic.Messages.Message> {
  // User has their own key — call Anthropic directly from the browser.
  if (apiKey) {
    const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })
    return client.messages.create(params)
  }

  // No user key — route through the server-side proxy (/api/ai).
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })

  if (!res.ok) {
    const { error } = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(error ?? `Server AI proxy returned ${res.status}`)
  }

  return res.json() as Promise<Anthropic.Messages.Message>
}

const GRADIENTS = [
  'from-rose-400 via-pink-300 to-orange-200',
  'from-brand-400 via-brand-500 to-brand-700',
  'from-sky-400 via-cyan-300 to-teal-200',
  'from-emerald-400 via-green-300 to-lime-200',
  'from-amber-400 via-yellow-300 to-orange-200',
  'from-fuchsia-500 via-pink-400 to-rose-300',
  'from-indigo-500 via-blue-400 to-sky-300',
  'from-teal-400 via-emerald-300 to-cyan-200',
]

export async function generateEventConcepts(
  input: ConceptGeneratorInput,
  apiKey: string,
  onConcept: (concept: EventConcept, index: number) => void
): Promise<void> {
  const prompt = `You are an expert luxury event designer. Generate 3 distinct, creative event concept designs.

Event Type: ${input.eventType}
Budget: $${input.budget.toLocaleString()}
Location: ${input.location}
Theme: ${input.theme}
Guest Count: ${input.guestCount}
Style Preferences: ${input.style.join(', ')}
Color Preferences: ${input.colorPreferences.join(', ')}
Dietary Requirements: ${input.dietary.join(', ')}
Additional Notes: ${input.additionalNotes}

Return a JSON array of exactly 3 concept objects with these exact fields:
{
  "title": "Concept name (2–4 evocative words)",
  "tagline": "One poetic sentence",
  "theme": "Theme name",
  "colorPalette": ["Color 1", "Color 2", "Color 3", "Color 4"],
  "mood": "2–3 mood adjectives",
  "venueDescription": "1–2 sentences on how the space looks and feels. Be concise.",
  "decorItems": [
    {
      "name": "Short visual noun phrase — use specific item names like 'Peony Floral Arch', 'Crystal Chandelier', 'Fairy Light Canopy', 'Velvet Lounge Seating', 'Grazing Table', 'Gold Chiavari Chairs', 'Champagne Bar' — so someone can immediately picture it",
      "description": "One sentence max",
      "estimatedCost": "$X–$Y"
    }
  ],
  "cateringNotes": "2–3 concise bullet ideas (write as comma-separated sentences, not a list)",
  "entertainmentNotes": "2–3 concise bullet ideas (comma-separated sentences)",
  "estimatedBudget": "$X,000–$Y,000",
  "styleKeywords": ["keyword1", "keyword2", "keyword3"]
}

Rules:
- Each concept must be VISUALLY distinct from the others
- decorItems must have 4–5 items with SPECIFIC, visual names (not abstract like "ambient touches")
- Keep all text fields brief — clients scan, not read
- Return only valid JSON, no markdown`

  const response = await callAI(apiKey, {
    model: 'claude-sonnet-4-5',   // Sonnet: ~80% cheaper than Opus, same quality for structured generation
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  const parsed = JSON.parse(cleaned) as Array<{
    title: string
    tagline: string
    theme: string
    colorPalette: string[]
    mood: string
    venueDescription: string
    decorItems: Array<{ name: string; description: string; estimatedCost: string }>
    cateringNotes: string
    entertainmentNotes: string
    estimatedBudget: string
    styleKeywords?: string[]
  }>

  parsed.forEach((raw, i) => {
    const styleKw = raw.styleKeywords ?? input.style
    const images = getImagesForConcept(raw.mood, input.eventType, styleKw, raw.colorPalette)

    const concept: EventConcept = {
      id: `c_${Date.now()}_${i}`,
      eventId: '',
      title: raw.title,
      tagline: raw.tagline,
      theme: raw.theme,
      colorPalette: raw.colorPalette,
      mood: raw.mood,
      venueDescription: raw.venueDescription,
      decorItems: raw.decorItems,
      cateringNotes: raw.cateringNotes,
      entertainmentNotes: raw.entertainmentNotes,
      estimatedBudget: raw.estimatedBudget,
      status: 'pending',
      clientComment: '',
      plannerNotes: '',
      coverGradient: GRADIENTS[i % GRADIENTS.length],
      images,
      generatedAt: new Date().toISOString(),
      sharedWithClient: false,
    }
    onConcept(concept, i)
  })
}

// ─── Task message → structured insight extraction ──────────────────────────────
//
// Used by the task-drawer "Smart paste" flow: planner pastes a raw natural-
// language message (WhatsApp / SMS / email body / call summary) and we ask
// Claude to pull out structured preferences, concerns, decisions, and
// sentiment so they show up as chips on the message and aggregate into the
// task's AI summary.

const POSITIVE_WORDS = ['love', 'perfect', 'great', 'amazing', 'beautiful', 'wonderful', 'awesome', 'yes', 'exactly', 'thanks', 'thank you']
const NEGATIVE_WORDS = ["don't", 'hate', 'avoid', 'no ', 'not ', 'never', 'expensive', 'too much', 'worried', 'concerned', 'unhappy', 'disappointed', 'over budget']

/** Cheap, no-API-key fallback so the feature still adds value without Claude. */
function localExtractInsight(text: string): TaskInsight {
  const lower = text.toLowerCase()
  let score = 0
  POSITIVE_WORDS.forEach(w => { if (lower.includes(w)) score += 1 })
  NEGATIVE_WORDS.forEach(w => { if (lower.includes(w)) score -= 1 })
  const sentiment: TaskInsight['sentiment'] = score > 0 ? 'positive' : score < 0 ? 'negative' : 'neutral'

  const sentences = text.split(/[.!?\n]+/).map(s => s.trim()).filter(Boolean)
  const preferences: string[] = []
  const concerns: string[] = []
  for (const s of sentences) {
    const sl = s.toLowerCase()
    if (/(love|like|prefer|want|loved|loving|interested in|partial to)/.test(sl)) {
      preferences.push(s.length > 60 ? s.slice(0, 60) + '…' : s)
    } else if (/(worried|concerned|avoid|don.?t|not |over budget|expensive|too )/.test(sl)) {
      concerns.push(s.length > 60 ? s.slice(0, 60) + '…' : s)
    }
  }
  return {
    preferences: preferences.slice(0, 5),
    concerns: concerns.slice(0, 5),
    decisions: [],
    sentiment,
  }
}

export interface ExtractContext {
  taskLabel: string
  eventType: string
  ceremonyName?: string
  clientName?: string
}

/**
 * Extract structured insights from a free-form client message. Uses Claude
 * Haiku for fast, cheap structured output; falls back to local heuristics
 * if no API key or the call fails.
 */
export async function extractTaskInsight(
  content: string,
  context: ExtractContext,
  apiKey: string
): Promise<TaskInsight> {
  if (!apiKey || !content.trim()) return localExtractInsight(content)

  const prompt = `You are an experienced event-planning assistant analysing a client message.

Context:
- Event type: ${context.eventType}
- Ceremony / phase: ${context.ceremonyName ?? 'n/a'}
- Task being decided: ${context.taskLabel}
- Client name: ${context.clientName ?? 'the client'}

Client message:
"""
${content}
"""

Extract structured insights so the planner can act on them. Return ONLY a single JSON object (no markdown, no commentary) with this exact shape:

{
  "preferences": ["short phrase per preference, ≤8 words each"],
  "concerns":    ["short phrase per concern, ≤8 words each"],
  "decisions":   ["any explicit decisions made / vendors chosen / rejected, ≤8 words each"],
  "sentiment":   "positive" | "neutral" | "negative"
}

Rules:
- Be specific and concrete. "wants soft pastels" beats "likes nice colors".
- Empty arrays are fine — don't invent items.
- Only include things actually said or strongly implied.`

  try {
    const response = await callAI(apiKey, {
      model: 'claude-haiku-4-5',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    })
    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(cleaned)
    return {
      preferences: Array.isArray(parsed.preferences) ? parsed.preferences.slice(0, 8) : [],
      concerns:    Array.isArray(parsed.concerns)    ? parsed.concerns.slice(0, 8)    : [],
      decisions:   Array.isArray(parsed.decisions)   ? parsed.decisions.slice(0, 8)   : [],
      sentiment:   parsed.sentiment === 'positive' || parsed.sentiment === 'negative' ? parsed.sentiment : 'neutral',
    }
  } catch (err) {
    console.warn('[extractTaskInsight] AI extraction failed, falling back to local heuristics:', err)
    return localExtractInsight(content)
  }
}
