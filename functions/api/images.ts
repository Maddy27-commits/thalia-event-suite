/**
 * Cloudflare Pages Function — /api/images
 *
 * Server-side proxy to the Unsplash Search API. Returns query-relevant
 * photo URLs the client can use as moodboard imagery.
 *
 * Why this exists: the previous "AI moodboard" was a curated static bank
 * keyed by event type only — colours and mood prompts had no effect on the
 * actual photos returned ("butter yellow" produced a generic wedding shot).
 * Routing through Unsplash Search means the photos genuinely reflect the
 * planner's prompt.
 *
 * Setup (one-time, in Cloudflare dashboard):
 *   1. Create an Unsplash app at https://unsplash.com/oauth/applications
 *   2. Copy the Access Key.
 *   3. Add it as an env var:  Settings → Environment variables → UNSPLASH_ACCESS_KEY
 *
 * If the key is not configured, the endpoint returns a friendly 503 and
 * the client falls back to its curated bank — the moodboard never breaks.
 *
 * Auth (same gates as /api/ai):
 *   - Origin allow-list
 *   - X-Thalia-Client header
 *   - Optional KV-backed rate limit (UNSPLASH_RATE_LIMITER)
 */

interface Env {
  UNSPLASH_ACCESS_KEY?: string
  UNSPLASH_RATE_LIMITER?: KVNamespace
}

// Same gate values as /api/ai.
const ALLOWED_ORIGINS = [
  'https://thalia-event-suite.pages.dev',
  'http://localhost:3000',
  'http://localhost:5173',
]
const CLIENT_HEADER = 'x-thalia-client'
const CLIENT_HEADER_VALUE = 'thalia-web'

// Cap: Unsplash free tier is 50 req/hr. We allow up to 30/hr/IP so abuse
// can't blow the whole quota for everyone.
const REQUESTS_PER_HOUR = 30

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  // ── Auth gates ───────────────────────────────────────────────────────────
  const origin = request.headers.get('Origin')
  if (!origin || !ALLOWED_ORIGINS.includes(origin)) return json({ error: 'Forbidden.' }, 403)
  if (request.headers.get(CLIENT_HEADER) !== CLIENT_HEADER_VALUE) return json({ error: 'Forbidden.' }, 403)

  // ── No key configured: tell the client to fall back ─────────────────────
  if (!env.UNSPLASH_ACCESS_KEY) {
    return json({ error: 'Image search not configured. Using curated fallback.' }, 503)
  }

  // ── Rate limit ──────────────────────────────────────────────────────────
  if (env.UNSPLASH_RATE_LIMITER) {
    const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown'
    const key = `irl:${ip}`
    const raw = await env.UNSPLASH_RATE_LIMITER.get(key)
    const count = raw ? parseInt(raw, 10) : 0
    if (count >= REQUESTS_PER_HOUR) {
      return json({ error: 'Too many image searches. Please wait an hour.' }, 429)
    }
    await env.UNSPLASH_RATE_LIMITER.put(key, String(count + 1), { expirationTtl: 3600 })
  }

  // ── Parse query ─────────────────────────────────────────────────────────
  const url = new URL(request.url)
  const q = (url.searchParams.get('q') ?? '').trim()
  const n = Math.max(1, Math.min(12, parseInt(url.searchParams.get('n') ?? '6')))
  if (!q) return json({ error: 'Missing q parameter.' }, 400)
  if (q.length > 200) return json({ error: 'Query too long.' }, 400)

  // ── Forward to Unsplash ─────────────────────────────────────────────────
  const upstream = new URL('https://api.unsplash.com/search/photos')
  upstream.searchParams.set('query', q)
  upstream.searchParams.set('per_page', String(n))
  upstream.searchParams.set('orientation', 'landscape')
  upstream.searchParams.set('content_filter', 'high')

  let res: Response
  try {
    res = await fetch(upstream.toString(), {
      headers: {
        'Authorization': `Client-ID ${env.UNSPLASH_ACCESS_KEY}`,
        'Accept-Version': 'v1',
      },
    })
  } catch (err) {
    console.error('[api/images] Unsplash fetch failed:', err)
    return json({ error: 'Image service unreachable.' }, 502)
  }

  if (!res.ok) {
    return json({ error: `Unsplash returned ${res.status}` }, 502)
  }

  type UnsplashPhoto = { urls?: { regular?: string }; alt_description?: string; user?: { name?: string } }
  const data = (await res.json()) as { results?: UnsplashPhoto[] }
  const photos = (data.results ?? [])
    .map((p) => ({
      url: p.urls?.regular ?? '',
      alt: p.alt_description ?? '',
      credit: p.user?.name ?? '',
    }))
    .filter((p) => p.url.length > 0)

  return json({ photos })
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      // Cache for 5 min — same query in quick succession reuses results
      'Cache-Control': status === 200 ? 'public, max-age=300' : 'no-store',
    },
  })
}
