# Thalia — AI Event Planning Suite

A full-stack event planning tool for professional event managers. Built with React, TypeScript, and Anthropic Claude AI. Deployed on Cloudflare Pages.

**Live demo → [thalia-event-suite.pages.dev](https://thalia-event-suite.pages.dev)**

---

## What it does

Thalia replaces scattered spreadsheets and WhatsApp threads with a structured planning workflow — from onboarding a new client through to the day of the event.

### For the event planner

**Smart event onboarding**
Select an event category (wedding, corporate gala, conference, birthday, etc.) and Thalia auto-generates the right planning structure. A wedding gets Roka → Mehendi → Haldi → Sangeet → Wedding → Reception with pre-filled decision deadlines based on real planning lead times. A corporate conference gets a different structure entirely.

**3-level planning hierarchy**
Every event is broken into Ceremonies → Sub-categories → Tasks. Each task has a pre-filled due date (e.g. venue decisions default to 180 days before the event, beauty bookings to 30 days). All dates are editable.

**Task decision workflow**
Clicking any task opens a full decision drawer with five phases: Briefing → Recommendations → Client Review → Revisions → Final. Each task holds a cross-channel conversation thread (WhatsApp, email, SMS, in-app, notes) and a list of options being considered (venues, vendors, dishes) with status tracking (Proposed → Shortlisted → Selected).

**AI concept generator**
Generate three distinct event design concepts based on the client's budget, style preferences, and venue. Each concept includes a colour palette, decor items, catering direction, and entertainment notes.

**AI message extraction**
Paste any client message (WhatsApp, email, SMS) into a task's conversation thread and hit "Add & Extract". Claude reads the natural language and surfaces structured preferences, concerns, and decisions as chips on the message — aggregated into a per-task AI summary.

**Vendor management**
Maintain a full vendor directory with categories, ratings, price ranges, and tags. Assign vendors to specific events.

**Client reminders**
Send milestone reminders via WhatsApp or email directly from the planner dashboard, powered by EmailJS.

### For the client

A separate client portal with:
- Event concept approval flow (approve / reject / request revision with comments)
- Progress view across all ceremonies and sub-categories
- Milestone timeline with due-date tracking

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS |
| State | Zustand (persisted to localStorage) |
| AI | Anthropic Claude API (Sonnet + Haiku) |
| Hosting | Cloudflare Pages |
| API proxy | Cloudflare Pages Functions |
| Rate limiting | Cloudflare KV |
| Email | EmailJS |

---

## Architecture decisions

**Server-side API proxy**
All Anthropic calls route through `functions/api/ai.ts` — a Cloudflare Pages Function. The API key lives only in Cloudflare's encrypted runtime secrets and is never present in the codebase. Anyone can read the full source without finding credentials.

**IP-based rate limiting**
Cloudflare KV tracks requests per IP with a 1-hour TTL. Visitors get 15 AI requests per hour — enough for any legitimate reviewer to explore the full feature set, not enough for abuse.

**Model selection by task**
Concept generation uses Claude Sonnet (structured, creative output). Message insight extraction uses Claude Haiku (fast, cheap, well-suited to short classification tasks). Local keyword-based fallback runs if no API key is configured.

**Offline-first state**
All planning data lives in the browser's localStorage via Zustand persist. No backend database required. Schema migrations run on rehydration so existing data survives app updates.

**Category-driven defaults**
`getDefaultCeremonies()` in the store generates planning structures appropriate to each event type — including realistic date offsets derived from actual event planning practice (venue: 180 days, florals: 120 days, beauty: 30 days, etc.).

---

## Running locally

```bash
git clone https://github.com/Maddy27-commits/thalia-event-suite.git
cd thalia-event-suite
npm install
npm run dev
```

AI features require an [Anthropic API key](https://console.anthropic.com). Add it in the app under **Planner → Settings → API Key**. It is stored only in your browser.

---

## Deploying your own instance

1. Fork this repo
2. Connect to [Cloudflare Pages](https://pages.cloudflare.com) — build command `npm run build`, output directory `dist`
3. Add `ANTHROPIC_API_KEY` as an encrypted environment variable in the Cloudflare dashboard
4. Create a KV namespace called `RATE_LIMITER` and bind it to the project under **Settings → Functions → KV namespace bindings**

---

## Project structure

```
src/
  components/
    planner/        # TaskDrawer, SendReminderModal
    ui/             # Button, Card, Badge, Input, Modal
    layout/         # Sidebar, AppLayout
  pages/
    planner/        # Dashboard, Events, Vendors, Clients, AI Generator, Settings
    client/         # My Event, Concepts, Approvals, Progress, Settings
  store/            # Zustand store — events, vendors, ceremonies, task actions
  lib/
    claude.ts       # AI calls — concept generation + message insight extraction
    utils.ts        # Formatting, date helpers, offsetDate
    signature.ts    # Developer signature (prints to browser console)
  types/            # Full TypeScript type definitions
functions/
  api/
    ai.ts           # Cloudflare Pages Function — Anthropic proxy + rate limiting
```

---

Built by [Madhura Banerjee](https://linkedin.com/in/madhura-banerjee-cbs) · [GitHub](https://github.com/Maddy27-commits)
