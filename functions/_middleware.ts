/**
 * Root-level Cloudflare Pages Functions middleware — SPA fallback.
 *
 * WHY THIS EXISTS:
 *   The standard Cloudflare Pages convention for single-page-app routing is
 *   a `public/_redirects` file with a `/*  /index.html  200` rewrite rule.
 *   That rule was added but did not take effect on this project's
 *   deployment — unmatched client-side routes (e.g. /welcome) continued to
 *   return the app shell with an HTTP 404 status instead of 200, even on a
 *   freshly created, immutable deployment alias (so it was not a caching or
 *   propagation issue — the rule was genuinely not being applied).
 *
 *   Rather than keep guessing at _redirects parsing quirks specific to this
 *   project's Pages Functions + Workers Builds setup, the SPA fallback is
 *   implemented directly in code here, which gives full control over the
 *   response and does not depend on _redirects being honoured at all.
 *
 * BEHAVIOUR:
 *   1. Requests to /api/* are passed straight through to their own
 *      dedicated function (ai.ts, images.ts) via `next()`.
 *   2. Every other request is first tried against the real static asset
 *      manifest. If a real file exists at that path (a JS bundle, CSS,
 *      favicon, etc.) it is served as-is with its normal status.
 *   3. If no real file exists at the requested path, the SPA shell
 *      (index.html) is served in its place, with the status forced to
 *      200. This is what makes a direct load of a client-side route like
 *      /welcome resolve correctly for browsers, crawlers, and social-card
 *      unfurlers (LinkedIn, Slack, iMessage) alike — all of which treat a
 *      404 status as "this page does not exist" regardless of what HTML
 *      happens to be in the body.
 */

interface Env {
  // Cloudflare Pages automatically injects a binding named ASSETS that can
  // fetch any file from the project's static asset manifest, independent
  // of the routing that would normally apply to an incoming request.
  ASSETS: Fetcher
}

export const onRequest: PagesFunction<Env> = async ({ request, next, env }) => {
  const url = new URL(request.url)

  // Dedicated API functions handle their own routes and error responses.
  if (url.pathname.startsWith('/api/')) {
    return next()
  }

  // Try the request as a real static asset first (JS, CSS, images, etc.).
  const assetResponse = await env.ASSETS.fetch(request)
  if (assetResponse.status !== 404) {
    return assetResponse
  }

  // No real file at this path — this is a client-side route. Serve the
  // SPA shell instead, forcing a 200 status so the page is treated as
  // real content by anything that checks the HTTP status before the body.
  const indexRequest = new Request(new URL('/index.html', request.url), request)
  const indexResponse = await env.ASSETS.fetch(indexRequest)
  return new Response(indexResponse.body, {
    status: 200,
    statusText: 'OK',
    headers: indexResponse.headers,
  })
}
