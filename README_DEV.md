# Thalia — Developer Guide

Architecture and onboarding reference for engineers working on Thalia. Pair
this with [`README.md`](./README.md) for the user-facing overview.

---

## Stack

| Layer            | Choice                                                         |
| ---------------- | -------------------------------------------------------------- |
| Build / dev      | Vite 5                                                         |
| Language         | TypeScript 5                                                   |
| UI               | React 18                                                       |
| Routing          | React Router v6 (`BrowserRouter`)                              |
| State            | Zustand 5 with `persist` middleware                            |
| Styling          | TailwindCSS 3 + custom palette (`brand`, `plum`, `ivory`)      |
| Icons            | lucide-react                                                   |
| Validation       | Zod 4                                                          |
| AI SDK           | `@anthropic-ai/sdk` (used both directly and via server proxy)  |
| Email (optional) | `@emailjs/browser` for in-browser reminder emails              |
| Hosting          | Cloudflare Pages (static + Pages Functions)                    |
| CI/CD            | GitHub Actions → `cloudflare/wrangler-action@v3`               |

There is **no backend service** in the traditional sense. The app is a SPA
that persists to `localStorage` and calls Anthropic either directly (when the
user provides their own API key) or via a thin Cloudflare Pages Function
proxy at `/api/ai`.

---

## Folder structure

```
.
├── functions/
│   └── api/
│       └── ai.ts             # Cloudflare Pages Function — Anthropic proxy
├── src/
│   ├── App.tsx               # Routes + shell + protected-route wrappers
│   ├── main.tsx              # ReactDOM.createRoot bootstrap
│   ├── index.css             # Tailwind layers + global tokens
│   ├── components/
│   │   ├── layout/           # Header, Sidebar, RoleSwitcher (app shell)
│   │   ├── planner/          # TaskDrawer, SendReminderModal
│   │   └── ui/               # Primitive components (Button, Card, Modal, Badge, Input, TagInput, ThaliaLogo)
│   ├── hooks/
│   │   ├── usePlannerEvents.ts  # Per-planner event filtering + legacy auto-claim
│   │   └── useClientEvent.ts    # Resolves the single event a client is locked to
│   ├── lib/
│   │   ├── claude.ts         # Unified AI caller (own-key or /api/ai proxy)
│   │   ├── aiParse.ts        # Balanced-brace JSON extraction + Zod schemas
│   │   ├── crypto.ts         # PBKDF2 password hashing (Web Crypto)
│   │   ├── images.ts         # Curated stock-image palette per concept theme
│   │   ├── signature.ts      # Email signature generator for planner emails
│   │   └── utils.ts          # Date math (offsetDate), formatters, classnames
│   ├── pages/
│   │   ├── auth/             # LandingPage, PlannerAuthPage, ClientAuthPage
│   │   ├── planner/          # PlannerDashboard, EventsPage, VendorsPage, ClientsPage, AIGeneratorPage
│   │   ├── client/           # ClientDashboard, ConceptsPage, ApprovalsPage, ProgressPage
│   │   └── settings/         # SettingsPage (shared by both roles)
│   ├── store/
│   │   └── index.ts          # Zustand store, sample data, migration helpers
│   └── types/
│       └── index.ts          # All shared TypeScript types
├── .github/workflows/deploy.yml
├── package.json
├── tailwind.config.js
└── vite.config.ts
```

---

## State management

Thalia keeps **all** client-visible state in a single Zustand store
(`src/store/index.ts`). Components read via `useStore()` and mutate via
named action methods (`addEvent`, `updateSubCategoryTask`, `setTaskPhase`,
etc.). Selectors are inline; there is no Redux-style slice / selector layer.

### Dual-key persistence

The store uses **two `localStorage` keys** with different retention policies:

| Key                  | What's in it                                                      | Versioned?         |
| -------------------- | ----------------------------------------------------------------- | ------------------ |
| `thalia-storage-v6`  | Events, vendors, profiles, session, role, active event, API key  | Yes — `version: 6` |
| `thalia-accounts`    | `RegisteredPlanner[]` — credentials (hash + salt)                 | No                 |

**Why two keys?** When we bump the storage version (`v6 → v7`) to invalidate
cached events/vendors after a schema change, we must *not* wipe accounts —
those are user-owned credentials, not derived data. Splitting accounts into
their own version-independent key is the cleanest way to make those two
retention policies independent.

The store's `partialize` config explicitly omits `registeredPlanners`, and
`onRehydrateStorage` always re-reads accounts via `loadAccounts()`.
`loadAccounts()` also performs a one-time recovery scan over older versioned
keys (`thalia-storage-v3..v6`) to pull accounts forward from previous schemas.

### Dedup helpers

Two helpers in `store/index.ts` defend against duplicate records that older
builds occasionally produced:

- `dedupeById<T>(items)` — Maps by `id`, keeps the entry with the latest
  `updatedAt` (or `createdAt`). Run on `events` and `vendors` after
  rehydration.
- `dedupeByEmail(planners)` — Maps by lowercased email, keeps the most
  recently created. Run before every write to `thalia-accounts`.

### `migrateEvent` / `migrateTask`

Older versions of the schema lacked task phases, message threads, options
cards, and per-event access codes. `migrateEvent(e)` (called per event during
rehydration) backfills those fields with safe defaults:

- `accessCode` — generated via `generateAccessCode()` (6-digit zero-padded
  number from `crypto.getRandomValues`) if missing or malformed.
- `tasks[]` — passed through `migrateTask` which fills `currentPhase`
  (`'briefing'`), `messages` (`[]`), `options` (`[]`), `offsetDays` (30),
  and `dueDate` (`''`) when absent.

Existing user data is never destroyed — only enriched.

---

## Auth

### Planner sign-up / sign-in

- Implemented in `src/lib/crypto.ts` and the `registerPlanner` /
  `verifyPlannerPassword` actions in the store.
- **PBKDF2-SHA-256, 100,000 iterations, 256-bit derived key, 16-byte salt
  per user.** All via the Web Crypto `SubtleCrypto` API — zero dependencies.
- `safeEqual()` does constant-time hex comparison to defeat timing attacks.
- **Plaintext legacy migration:** very old accounts stored a `password`
  field directly. On first successful sign-in, `verifyPlannerPassword`
  detects the missing salt/hash, generates a fresh salt, hashes the
  candidate password, replaces the record, and persists. The user never
  sees this happen.

### Client sign-in (per-event access code)

- Clients do **not** create accounts. Each `Event` carries a 6-digit
  numeric `accessCode` generated when the event is created.
- The client signs in on `/auth/client` with their email plus the code; the
  app finds the event with a matching `clientEmail` and `accessCode` and
  builds an `AuthSession` with `clientEventId` set to that event's id.
- The planner shares the code out-of-band (text, in person, etc.).

### Planner preview mode

`enterPreviewMode(eventId, clientName, clientEmail)` flips a planner's
session into client-portal mode for one specific event without losing the
underlying planner credentials. `exitPreviewMode()` restores them. The
`PreviewBanner` component in `App.tsx` makes this state visible.

---

## Multi-tenancy

Each `Event` has an optional `plannerEmail` field stamped at creation by
`addEvent`. The `usePlannerEvents()` hook (`src/hooks/usePlannerEvents.ts`)
filters the global event list down to the current planner's events.

Ownership rules implemented there:

1. `plannerEmail` matches current session email → shown.
2. `plannerEmail` is empty (legacy events from before multi-tenancy) →
   shown **only if the current planner is the sole registered account**.
   If two or more accounts exist, legacy events are hidden — we cannot
   safely infer ownership.
3. `plannerEmail` belongs to a different account → hidden.

**Auto-claim** of legacy events runs as a side-effect inside the hook and
**only** fires in the single-planner case. This avoids the
"first-planner-to-log-in inherits everyone's orphan events" bug.

---

## AI integration

### Browser → AI

`src/lib/claude.ts` exports a `callAI(apiKey, params)` helper with this
priority order:

1. **User-provided key** (`Settings → API key`) → instantiate the Anthropic
   SDK with `dangerouslyAllowBrowser: true` and call directly.
2. **No user key** → POST to `/api/ai` (the Pages Function) with header
   `X-Thalia-Client: thalia-web`.

This lets the deployed app work for visitors with zero setup while still
letting power users plug in their own quota.

### `/api/ai` — Pages Function (`functions/api/ai.ts`)

Defenses, in order of cheapness:

- **Origin allow-list** — `https://thalia-event-suite.pages.dev`,
  `http://localhost:3000`, `http://localhost:5173`. Browsers can't spoof
  Origin from another site's JS.
- **Custom client header** — `x-thalia-client: thalia-web` blocks casual
  curl/scraper traffic.
- **Model allow-list** — only `claude-sonnet-4-5`, `claude-haiku-4-5`,
  `claude-opus-4-20250514` are forwarded.
- **`max_tokens` cap** — 8192.
- **Per-IP rate limit** — 15 requests/hour, tracked in a Cloudflare KV
  binding called `RATE_LIMITER`. If the binding is missing, rate limiting
  is gracefully skipped (so first-time setups still work).
- **Server-only API key** — `MADDY_API_KEY` is read from `env` at runtime
  and never sent to the browser. The function itself contains zero
  credentials.

### Response parsing — `src/lib/aiParse.ts`

Claude responses sometimes include prose ("Here is the JSON:") or
```json fences around the payload. `extractJsonBlock(text)` walks the
string char-by-char tracking string state and brace depth to find the
first **balanced** `{...}` or `[...]` block — robust to fences, prefixes,
and trailing text. `parseAIResponse(text, schema)` then validates against a
Zod schema and returns a typed value (or throws).

The file exports schemas for the data shapes the app consumes:
`conceptArraySchema`, `taskInsightSchema`, etc.

---

## Hierarchical data model

```
Event
 └── EventCeremony[]            (e.g. Mehendi, Sangeet, Wedding, Reception)
      └── EventSubCategory[]    (e.g. Decor, Catering, Photography)
           └── SubCategoryTask[]
                ├── messages: TaskMessage[]   (cross-channel thread)
                ├── options:  TaskOption[]    (vendor/recommendation cards)
                └── currentPhase: TaskPhase
```

`TaskPhase` is a string union:

```ts
type TaskPhase = 'briefing' | 'recommendations' | 'client-review' | 'revisions' | 'final'
```

The `TASK_PHASES` constant in `src/types/index.ts` is the single source of
truth for labels and descriptions used by the UI.

`SUB_OFFSETS` in `store/index.ts` maps sub-category names to default
lead-times in days before the ceremony. `getDefaultCeremonies(type, eventDate)`
builds out the canonical ceremony tree for each `EventType`.

Mutating any of these is done via path-based actions on the store
(`updateSubCategoryTask`, `addTaskMessage`, `setTaskPhase`, etc.) which
internally use the `mapCeremony` / `mapTask` helpers to clone-and-replace
along the full path.

---

## Routing map

All routes are defined inline in `src/App.tsx`. Protected routes are
wrapped in `ProtectedPlanner` or `ProtectedClient`, which redirect based on
`session.role` and `session.isPlannerPreview`.

| Path                       | Component                |
| -------------------------- | ------------------------ |
| `/`                        | `RootRedirect`           |
| `/welcome`                 | `LandingPage`            |
| `/auth/planner`            | `PlannerAuthPage`        |
| `/auth/client`             | `ClientAuthPage`         |
| `/planner`                 | `PlannerDashboard`       |
| `/planner/events`          | `EventsPage`             |
| `/planner/vendors`         | `VendorsPage`            |
| `/planner/clients`         | `ClientsPage`            |
| `/planner/ai-generator`    | `AIGeneratorPage`        |
| `/planner/settings`        | `SettingsPage`           |
| `/client`                  | `ClientDashboard`        |
| `/client/concepts`         | `ConceptsPage`           |
| `/client/approvals`        | `ApprovalsPage`          |
| `/client/progress`         | `ProgressPage`           |
| `/client/settings`         | `SettingsPage`           |
| `*` (catch-all)            | redirect to `/`          |

---

## Build & deploy

### Build script

```json
"build": "tsc && vite build && cp dist/index.html dist/404.html"
```

The `cp dist/index.html dist/404.html` step is the **SPA fallback for
Cloudflare Pages**. Cloudflare serves `404.html` for any path it can't find
on disk; by making it identical to the SPA entry, deep links like
`/client/concepts` reload cleanly instead of returning a real 404.

### GitHub Actions (`.github/workflows/deploy.yml`)

- Trigger: `push` to `main`, plus manual `workflow_dispatch`.
- Steps: checkout → Node 20 with npm cache → `npm ci` → `npm run build` →
  `cloudflare/wrangler-action@v3` running
  `pages deploy dist --project-name=thalia-event-suite`.

### Required GitHub secrets

| Secret                   | Why                                          |
| ------------------------ | -------------------------------------------- |
| `CLOUDFLARE_API_TOKEN`   | Wrangler auth                                |
| `CLOUDFLARE_ACCOUNT_ID`  | Tells Wrangler which account to deploy to    |

### Required Cloudflare configuration

| Item                          | Required?  | Purpose                                  |
| ----------------------------- | ---------- | ---------------------------------------- |
| Env var `MADDY_API_KEY`       | Required   | Anthropic API key — server-side only     |
| KV binding `RATE_LIMITER`     | Optional   | Enables per-IP AI rate limiting          |

---

## Cross-check checklist

**Read this before opening a PR that touches any of the areas listed.** When
you change one of these things, you almost always need to update one of the
others — and you should keep this README in sync as well.

- [ ] **State shape (`src/types/index.ts`)** — Did you add/rename/remove a
      field on `Event`, `EventCeremony`, `EventSubCategory`,
      `SubCategoryTask`, `TaskMessage`, `TaskOption`, `EventConcept`,
      `RegisteredPlanner`, `AuthSession`, or `AppState`? If yes:
      - Update `partialize` in `store/index.ts` if the field needs persisting.
      - Update `migrateEvent` / `migrateTask` to backfill the field on
        rehydration.
      - Bump the persistence version (see next item).
- [ ] **Persistence keys** — If a schema change makes old data unsafe,
      bump `name: 'thalia-storage-v6' → v7` and `version: 6 → 7` in the
      `persist` config. **Do NOT touch `thalia-accounts`** — credentials
      must survive version bumps.
- [ ] **Store schema migrations** — `onRehydrateStorage` runs `dedupeById`
      and `migrateEvent` over rehydrated data. Anything new persisted needs
      a migration path here.
- [ ] **Route names (`src/App.tsx`)** — If you add/rename a route, update
      the routing map in this README and double-check the
      `ProtectedPlanner` / `ProtectedClient` wrappers, sidebar links
      (`src/components/layout/Sidebar.tsx`), and the `RootRedirect`.
- [ ] **API contract (`functions/api/ai.ts` ⇄ `src/lib/claude.ts`)** —
      If you change request/response shape, allowed models, allowed origins,
      `max_tokens` cap, or rate-limit constants, update both ends and this
      README's "AI integration" section.
- [ ] **Env vars / secrets** — If you add a new Cloudflare env var or KV
      binding, document it in the "Required Cloudflare configuration"
      table above. Same for new GitHub secrets.
- [ ] **Build script** — If you change `npm run build`, verify the
      `dist/404.html` fallback still gets produced. Without it, Cloudflare
      Pages will 404 on hard refreshes of deep links.
- [ ] **Auth flow** — Any change to PBKDF2 parameters (`ITERATIONS`,
      `KEY_LENGTH`, `SALT_BYTES`) breaks all existing accounts unless
      paired with a re-hash-on-login migration like the legacy plaintext
      one. Don't change them lightly.
- [ ] **Per-event access code format** — If `generateAccessCode()` changes
      length/format, update `migrateEvent`'s validation regex
      (`/^\d{6}$/`) and the client sign-in form.

---

## Key files to read first

In rough dependency order — if you read these eight files you'll have a
complete mental model of the app:

1. **`src/types/index.ts`** — every shared shape lives here.
2. **`src/store/index.ts`** — the Zustand store, sample data, persistence,
   and migrations.
3. **`src/App.tsx`** — routing, protected routes, app shell, preview mode.
4. **`src/pages/planner/PlannerDashboard.tsx`** — the main entry view for
   planners; ties together events, milestones, and concepts.
5. **`src/pages/planner/EventsPage.tsx`** — the event creation/editing
   wizard; biggest single piece of UI logic.
6. **`src/components/planner/TaskDrawer.tsx`** — task drill-down with phase
   tracker, message thread, and options cards. Demonstrates the full
   hierarchical state model.
7. **`src/pages/client/ClientDashboard.tsx`** — mirror view from the
   client's perspective.
8. **`src/lib/claude.ts`**, **`src/lib/aiParse.ts`**,
   **`functions/api/ai.ts`** — the full AI request lifecycle, browser to
   server and back.
