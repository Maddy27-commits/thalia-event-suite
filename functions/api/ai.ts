/**
 * Cloudflare Pages Function — /api/ai
 *
 * Acts as a secure proxy between the browser and Anthropic's API.
 *
 * HOW THE API KEY STAYS SECRET:
 *   - ANTHROPIC_API_KEY is stored as an encrypted secret in the Cloudflare
 *     dashboard (Settings → Environment variables). It is injected into `env`
 *     at runtime by Cloudflare's infrastructure.
 *   - This file contains zero credentials. You can safely commit it to a
 *     public GitHub repo — there is nothing sensitive here.
 *
 * RATE LIMITING:
 *   - 15 AI requests per IP address per hour, tracked via Cloudflare KV.
 *   - If the KV binding (RATE_LIMITER) is not configured, rate limiting is
 *     skipped gracefully so the function still works during initial setup.
 *
 * SETUP (one-time, in Cloudflare dashboard):
 *   1. Add secret:   Settings → Environment variables → MADDY_API_KEY
 *   2. Create KV:    Workers & Pages → KV → Create namespace "RATE_LIMITER"
 *   3. Bind KV:      Pages project → Settings → Functions →
 *                    KV namespace bindings → variable name: RATE_LIMITER
 */

interface Env {
  MADDY_API_KEY: string
  RATE_LIMITER?: KVNamespace // optional — rate limiting skipped if not bound
}

// ─── Config ───────────────────────────────────────────────────────────────────
const REQUESTS_PER_HOUR = 15
const ALLOWED_MODELS = [
  'claude-sonnet-4-5',
  'claude-haiku-4-5',
  'claude-opus-4-20250514', // kept for fallback, rarely hit
]

// Allow-listed origins for browser requests. Add localhost in dev as needed.
const ALLOWED_ORIGINS = [
  'https://thalia-event-suite.pages.dev',
  'http://localhost:3000',
  'http://localhost:5173',
]

// Custom header the browser SDK sets so non-browser callers (curl, scripts)
// can be filtered out cheaply. Combined with the Origin check this defends
// against drive-by abuse without inconveniencing real users.
const CLIENT_HEADER = 'x-thalia-client'
const CLIENT_HEADER_VALUE = 'thalia-web'

// ─── Handler ──────────────────────────────────────────────────────────────────
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  // ── 1. Check server-side key is configured ──────────────────────────────────
  if (!env.MADDY_API_KEY) {
    return json(
      { error: 'Service temporarily unavailable. Please try again later.' },
      503,
    )
  }

  // ── 1a. Origin + client-header gate ─────────────────────────────────────────
  // Origin is set automatically by browsers and cannot be spoofed by JS in
  // another site. Server-side abusers can forge it, so we pair it with a
  // custom header check — together these block the casual abuse vectors
  // (curl loops, exposed-endpoint scrapers, leaked-URL replay).
  const origin = request.headers.get('Origin')
  if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
    return json({ error: 'Forbidden.' }, 403)
  }
  if (request.headers.get(CLIENT_HEADER) !== CLIENT_HEADER_VALUE) {
    return json({ error: 'Forbidden.' }, 403)
  }

  // ── 2. Rate limiting (per IP, per hour) ─────────────────────────────────────
  if (env.RATE_LIMITER) {
    const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown'
    const key = `rl:${ip}`

    const raw = await env.RATE_LIMITER.get(key)
    const count = raw ? parseInt(raw, 10) : 0

    if (count >= REQUESTS_PER_HOUR) {
      return json(
        { error: 'You\'ve reached the hourly AI request limit. Please try again in an hour.' },
        429,
      )
    }

    // Increment — expires automatically after 1 hour
    await env.RATE_LIMITER.put(key, String(count + 1), {
      expirationTtl: 3600,
    })
  }

  // ── 3. Parse and validate request body ──────────────────────────────────────
  let body: { model?: string; max_tokens?: number; messages?: unknown[] }
  try {
    body = await request.json()
  } catch {
    return json({ error: 'Invalid JSON body.' }, 400)
  }

  const { model, max_tokens, messages } = body

  if (!model || !messages || !Array.isArray(messages) || messages.length === 0) {
    return json({ error: 'Missing required fields: model, messages.' }, 400)
  }

  // Only allow models used by this app — blocks misuse if URL is discovered
  if (!ALLOWED_MODELS.includes(model)) {
    return json({ error: 'Model not permitted.' }, 403)
  }

  if (typeof max_tokens !== 'number' || max_tokens > 8192) {
    return json({ error: 'max_tokens must be a number ≤ 8192.' }, 400)
  }

  // ── 4. Forward to Anthropic ─────────────────────────────────────────────────
  //    The API key is added here, server-side, and never sent to the browser.
  let anthropicResponse: Response
  try {
    anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.MADDY_API_KEY,   // ← only lives here, at runtime
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({ model, max_tokens, messages }),
    })
  } catch (err) {
    console.error('[api/ai] Anthropic fetch failed:', err)
    return json({ error: 'Failed to reach AI service. Please try again.' }, 502)
  }

  // ── 5. Return Anthropic's response ──────────────────────────────────────────
  const data = await anthropicResponse.json()
  return json(data, anthropicResponse.status)
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      // Prevent responses from being cached — every AI call is live
      'Cache-Control': 'no-store',
    },
  })
}
