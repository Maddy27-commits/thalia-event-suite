# Thalia

Thalia is an event-planning collaboration platform that gives event planners
and their clients a single shared workspace. It supports weddings, birthdays,
corporate events, conferences, galas, anniversaries, and graduations — from
the first concept brief through final approvals.

**Live demo:** https://thalia-event-suite.pages.dev

## Who it's for

- **Event planners** who currently juggle WhatsApp threads, email chains,
  and spreadsheets across multiple clients and want one place to run their book of work.
- **Clients** of those planners — couples, families, corporate event leads —
  who want visibility into what's being planned without having to chase their planner.

Both roles use the same app; planners and clients each get a tailored portal,
and a planner can preview exactly what their client sees at any time.

## Key features

- **Planner dashboard** — at-a-glance view of every event, upcoming
  milestones, vendor activity, and pending client approvals.
- **Client portal** — a focused, read-friendly view of the single event the
  client is part of: timeline, design concepts to review, and progress.
- **AI concept generation** — generate fully-formed design concepts (theme,
  color palette, decor items with cost estimates, catering and entertainment
  notes, venue description, mood board) from a short brief.
- **Vendor network** — searchable directory with categories, price ranges,
  ratings, tags, and per-event vendor assignments.
- **Hierarchical milestone & task tracking** — every event breaks down into
  ceremonies (or days/sessions) → sub-categories (Decor, Catering, AV…) →
  individual tasks with due dates derived from the event date.
- **In-app chat per task** — every task has its own conversation thread with
  a phase indicator (briefing → recommendations → client review → revisions →
  final), so decisions never get lost in a 400-message group chat.
- **Design concept approvals** — clients approve, reject, or request
  revisions on each concept inline, with comments captured against the concept.
- **Planner-set 6-digit access codes** — every event gets a numeric code the
  planner shares with the client out-of-band; the client signs into their
  portal with email + code (no password setup needed on their side).

## Run it locally

Requires Node 20+.

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

The dev build seeds two sample events so you can poke around the planner and
client views immediately. AI features will work if you either (a) drop your
own Anthropic API key into Settings, or (b) point at a deployment that has
the server-side proxy configured.

## Deployment

Thalia is hosted on **Cloudflare Pages**. Every push to `main` triggers the
GitHub Actions workflow at `.github/workflows/deploy.yml`, which builds the
app and deploys via `cloudflare/wrangler-action@v3`. AI requests are proxied
through a Cloudflare Pages Function (`functions/api/ai.ts`) so the Anthropic
API key stays server-side.

For details on architecture, state, auth, and the deploy pipeline see
[`README_DEV.md`](./README_DEV.md).
