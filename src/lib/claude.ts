import Anthropic from '@anthropic-ai/sdk'
import type { ConceptGeneratorInput, EventConcept, TaskInsight } from '../types'
import { fetchMoodboardImages } from './images'
import {
  parseAIResponse, conceptArraySchema, taskInsightSchema,
  starterPromptsSchema, optionSuggestionsSchema,
  type ParsedOptionSuggestion,
} from './aiParse'

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
  // The X-Thalia-Client header is required by the proxy to filter casual
  // abuse (curl loops, scrapers). Browsers auto-set Origin which the proxy
  // also validates against an allow-list.
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Thalia-Client': 'thalia-web',
    },
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
  // Robust extraction + Zod validation — survives markdown fences, prose
  // preamble, and shape drift (missing fields fall back to safe defaults).
  const parsed = parseAIResponse(text, conceptArraySchema)

  // Fetch moodboards for each concept in parallel so the user sees them
  // populate as soon as Unsplash returns. Promise.all keeps the loop tidy.
  const conceptsWithImages = await Promise.all(parsed.map(async (raw) => {
    const styleKw = raw.styleKeywords ?? input.style
    const images = await fetchMoodboardImages(raw.mood, input.eventType, styleKw, raw.colorPalette)
    return { raw, styleKw, images }
  }))

  conceptsWithImages.forEach(({ raw, images }, i) => {

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
  if (!content.trim()) return localExtractInsight(content)

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
    const parsed = parseAIResponse(text, taskInsightSchema)
    return {
      preferences: parsed.preferences.slice(0, 8),
      concerns:    parsed.concerns.slice(0, 8),
      decisions:   parsed.decisions.slice(0, 8),
      sentiment:   parsed.sentiment,
    }
  } catch (err) {
    console.warn('[extractTaskInsight] AI extraction failed, falling back to local heuristics:', err)
    return localExtractInsight(content)
  }
}

// ─── Discussion starters ──────────────────────────────────────────────────────
//
// Used by the in-task chat to nudge the planner with 3 phase-appropriate
// conversation starters. Reads the existing thread (if any) so suggestions
// build on prior context rather than restarting the discussion cold.

export interface StarterContext {
  phase: 'briefing' | 'recommendations' | 'client-review' | 'revisions' | 'final'
  taskLabel: string
  eventType: string
  ceremonyName?: string
  clientName?: string
  /** Last few messages, oldest first, for context. Plain text. */
  recentMessages: { author: string; content: string }[]
}

/**
 * Local fallback starters when no AI key is available — phase-aware AND
 * context-aware (different suggestions when the planner spoke last vs when
 * the client spoke last, so we never suggest the planner reply to themselves).
 */
function localStarters(ctx: StarterContext): string[] {
  const last = ctx.recentMessages[ctx.recentMessages.length - 1]
  const plannerSpokeLast = !!last && /^(you|planner)$/i.test(last.author.trim())

  // Planner just spoke — suggest gentle nudges / new angles, not replies.
  if (plannerSpokeLast) {
    return [
      `Just following up on my last note — any thoughts whenever you have a moment?`,
      `Happy to jump on a quick call if that's easier than typing.`,
      `If it helps, I can pull together a quick comparison while you decide.`,
    ]
  }

  // Client/vendor spoke last (or no messages yet) — suggest planner replies.
  switch (ctx.phase) {
    case 'briefing':
      return [
        `What's most important to you about ${ctx.taskLabel.toLowerCase()}?`,
        `Are there any inspirations or examples you've saved we should look at first?`,
        `Any non-negotiables — things you definitely want or definitely don't?`,
      ]
    case 'recommendations':
      return [
        `I've put together a few options for ${ctx.taskLabel.toLowerCase()} — want me to walk you through them?`,
        `Should I prioritise budget, style, or availability when shortlisting?`,
        `Any names or vendors you'd like me to consider — or avoid?`,
      ]
    case 'client-review':
      return [
        `Glad to hear your reaction — which one feels closest to your vision?`,
        `Want me to dig deeper into any of these options before you decide?`,
        `Happy to bring revised versions if anything's not quite right.`,
      ]
    case 'revisions':
      return [
        `Got it — based on your feedback, here's what I'm adjusting.`,
        `Should I bring back a revised proposal, or are we close to deciding?`,
        `Any concerns I should iron out before we lock this in?`,
      ]
    case 'final':
      return [
        `Confirmed on my end. Want me to send a final summary for your records?`,
        `All locked in — let me know if anything changes between now and the day.`,
        `Excited to move forward — anything else you need from me?`,
      ]
  }
}

/**
 * Suggest 3 discussion starters tuned to the current task phase and recent
 * conversation. Falls back to local templates if the AI call fails.
 */
export async function suggestDiscussionStarters(
  ctx: StarterContext,
  apiKey: string,
): Promise<string[]> {
  const recent = ctx.recentMessages.slice(-6).map((m) => `${m.author}: ${m.content}`).join('\n') || '(no messages yet)'
  const lastMsg = ctx.recentMessages[ctx.recentMessages.length - 1]
  // Detect "the planner just spoke last" so we don't suggest a reply to the
  // planner's own message. Common author labels: 'You', 'Planner'.
  const plannerSpokeLast = !!lastMsg && /^(you|planner)$/i.test(lastMsg.author.trim())

  const guidance = !lastMsg
    ? 'There are no messages yet. Suggest a warm opening question that gets the client talking about their preferences for this task.'
    : plannerSpokeLast
      ? `The PLANNER spoke last (their message was: "${lastMsg.content.slice(0, 200)}"). DO NOT suggest replies that answer the planner's own question — that would be the planner replying to themselves. Instead suggest natural follow-ups: a polite nudge if the client hasn't replied yet, a clarifying question if the previous message was complex, or a fresh angle that moves the conversation forward.`
      : `The CLIENT/VENDOR spoke last (their message was: "${lastMsg.content.slice(0, 200)}"). Suggest planner replies that acknowledge their input and move the decision forward.`

  const prompt = `You are an experienced event planner helping a colleague draft their NEXT message in a chat thread with a client.

Context:
- Event type: ${ctx.eventType}
- Ceremony / phase: ${ctx.ceremonyName ?? 'n/a'}
- Task being decided: ${ctx.taskLabel}
- Client name: ${ctx.clientName ?? 'the client'}
- Current planning phase: ${ctx.phase}

Recent messages (oldest first):
${recent}

CRITICAL CONTEXT: ${guidance}

The drafts you generate will be SENT BY THE PLANNER. They must read as something the planner would naturally say next, given who spoke last.

Suggest exactly 3 short message drafts the planner could send next, written in the planner's voice (warm, professional, concise). Each one should be different in approach.

Return ONLY a JSON array of 3 strings — no markdown, no commentary. Each string is the message body, ≤25 words.`

  try {
    const response = await callAI(apiKey, {
      model: 'claude-haiku-4-5',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
    })
    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const parsed = parseAIResponse(text, starterPromptsSchema)
    return parsed.slice(0, 3)
  } catch (err) {
    console.warn('[suggestDiscussionStarters] AI failed, using local fallback:', err)
    return localStarters(ctx)
  }
}

// ─── Option / recommendation suggestions ──────────────────────────────────────
//
// Used inside the Recommendations phase of a task. Generates a small set of
// concrete option ideas (vendors / approaches / packages) the planner can
// then keep, edit, or reject. Pulls existing options + any captured client
// preferences into the prompt so suggestions are relevant.

export interface OptionSuggestionContext {
  taskLabel: string
  eventType: string
  ceremonyName?: string
  budget?: number
  preferences?: string[]
  concerns?: string[]
  /** Existing option titles so AI doesn't suggest duplicates. */
  existingTitles?: string[]
}

/**
 * Generate 3–5 concrete option ideas for the Recommendations phase.
 * Throws on failure (no useful local fallback for "specific vendor names").
 */
export async function suggestTaskOptions(
  ctx: OptionSuggestionContext,
  apiKey: string,
): Promise<ParsedOptionSuggestion[]> {
  const prompt = `You are an experienced event planner shortlisting concrete options for a task.

Context:
- Event type: ${ctx.eventType}
- Ceremony / phase: ${ctx.ceremonyName ?? 'n/a'}
- Task: ${ctx.taskLabel}
${ctx.budget ? `- Total event budget: $${ctx.budget.toLocaleString()}` : ''}
${ctx.preferences?.length ? `- Client preferences: ${ctx.preferences.join('; ')}` : ''}
${ctx.concerns?.length ? `- Client concerns: ${ctx.concerns.join('; ')}` : ''}
${ctx.existingTitles?.length ? `- Already shortlisted (don't repeat): ${ctx.existingTitles.join(', ')}` : ''}

Suggest 4 distinct option ideas the planner could present to the client. Each should be a specific concept (e.g. a venue type, vendor archetype, package, or approach), with realistic estimated cost.

Return ONLY a JSON array — no markdown, no commentary. Each item:
{
  "title":         "Specific name or concept (3–6 words)",
  "description":   "1 sentence on why this option fits this client",
  "estimatedCost": "$X,XXX–$Y,YYY or 'Included' or similar",
  "pros":          ["3–5 word strength", "another"],
  "cons":          ["3–5 word trade-off", "another"]
}

Make options visually/functionally distinct from each other. 4 items.`

  const response = await callAI(apiKey, {
    model: 'claude-sonnet-4-5',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  })
  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  return parseAIResponse(text, optionSuggestionsSchema)
}
