import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  AppState, Event, Vendor, ConceptStatus, Role,
  PlannerProfile, ClientProfile, EventType,
  EventCeremony, EventStage, StageTask, TaskMessage,
  AuthSession, RegisteredPlanner,
} from '../types'
import { offsetDate } from '../lib/utils'
import { hashPassword, generateSalt, safeEqual } from '../lib/crypto'

const uid = () => Math.random().toString(36).slice(2, 9)

// ─── Sub-category default lead-times (days BEFORE the ceremony) ────────────────
// Sourced from typical Indian-wedding planning timelines and adapted for
// other event types. These power the "decor is decided 120 days before"
// auto-suggestion shown in the onboarding wizard.
const SUB_OFFSETS: Record<string, number> = {
  'Venue & Logistics':    180,
  'Photography & Video':  120,
  'Decor':                120,
  'Outfits & Shopping':    90,
  'Catering & Food':       90,
  'Entertainment':         60,
  'Invitations':           60,
  'Beauty & Grooming':     30,
  'Guest Management':      45,
  // Birthday / smaller events
  'Theme & Decor':         60,
  'Food & Cake':           30,
  'Photography':           45,
  'Guest Experience':      30,
  // Corporate / conference
  'AV & Technology':       60,
  'Branding & Collaterals':45,
  'Speakers & Agenda':     90,
  'AV & Tech':             60,
  'Venue & Setup':         90,
  'Speakers & Content':    90,
  'Catering':              45,
  'Collaterals':           30,
  // Anniversary
  'Venue & Decor':         90,
  'Food & Celebration':    45,
  'Entertainment & Moments': 30,
  // Gala
  'Venue & Ambience':      120,
  'Food & Beverage':       60,
  // Graduation
  'Food & Refreshments':   30,
  'Gifts & Mementos':      14,
  // Generic fallback
  'Food & Beverages':      30,
}

const offsetFor = (subName: string): number => SUB_OFFSETS[subName] ?? 30

// ─── Deduplication helpers ──────────────────────────────────────────────────────
/**
 * Deduplicate an array of items by `id`, keeping the entry with the latest
 * `updatedAt` (or `createdAt` if there's no `updatedAt`).
 */
function dedupeById<T extends { id: string; updatedAt?: string; createdAt?: string }>(
  items: T[],
): T[] {
  const map = new Map<string, T>()
  for (const item of items) {
    const existing = map.get(item.id)
    if (!existing) {
      map.set(item.id, item)
    } else {
      const existingTs = existing.updatedAt ?? existing.createdAt ?? ''
      const newTs      = item.updatedAt      ?? item.createdAt      ?? ''
      if (newTs > existingTs) map.set(item.id, item)
    }
  }
  return [...map.values()]
}

/** Deduplicate planner accounts by email, keeping the most recently created one. */
function dedupeByEmail(planners: RegisteredPlanner[]): RegisteredPlanner[] {
  const map = new Map<string, RegisteredPlanner>()
  for (const p of planners) {
    const key      = p.email.toLowerCase()
    const existing = map.get(key)
    if (!existing || p.createdAt > existing.createdAt) map.set(key, p)
  }
  return [...map.values()]
}

// ─── Dedicated accounts store (version-independent) ────────────────────────────
// Stored under a key that never changes, so accounts survive any future storage
// version bumps. We also try to recover accounts from older versioned keys.
//
// DESIGN NOTE — fragmented persistence is intentional:
// We deliberately split persistence into two keys instead of a single Zustand
// `persist` partialize. The reason: if we bump the storage version (`v6 → v7`)
// to invalidate cached events/vendors, we must NOT also wipe accounts —
// accounts are user-owned credentials, not derived data. Keeping accounts in
// their own version-independent key (`thalia-accounts`) is the cleanest way
// to make those two retention policies independent. A unified persist with
// migrations would also work but adds more risk than the dual-key split.
const ACCOUNTS_KEY = 'thalia-accounts'

function loadAccounts(): RegisteredPlanner[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as RegisteredPlanner[]
      return dedupeByEmail(parsed)
    }

    // Recovery: scan older versioned Zustand keys for accounts that haven't
    // been migrated yet (happens when upgrading from pre-fix versions).
    const recovered: RegisteredPlanner[] = []
    for (const oldKey of ['thalia-storage-v6', 'thalia-storage-v5', 'thalia-storage-v4', 'thalia-storage-v3']) {
      try {
        const oldRaw = localStorage.getItem(oldKey)
        if (!oldRaw) continue
        const parsed = JSON.parse(oldRaw)
        const accounts = parsed?.state?.registeredPlanners as RegisteredPlanner[] | undefined
        if (accounts?.length) recovered.push(...accounts)
      } catch { /* ignore parse errors */ }
    }
    if (recovered.length) {
      const deduped = dedupeByEmail(recovered)
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(deduped))
      return deduped
    }
    return []
  } catch { return [] }
}

function saveAccounts(accounts: RegisteredPlanner[]): void {
  try {
    // Always deduplicate before writing so the key stays clean
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(dedupeByEmail(accounts)))
  } catch { /* ignore */ }
}

// ─── Sub-category factory helpers ──────────────────────────────────────────────
function mkTask(label: string, off: number, ceremonyDate: string): StageTask {
  return {
    id: uid(),
    label,
    completed: false,
    notes: '',
    offsetDays: off,
    dueDate: offsetDate(ceremonyDate, -off),
    currentPhase: 'briefing',
    messages: [],
    options: [],
  }
}

function mkSub(name: string, emoji: string, taskLabels: string[], ceremonyDate: string): EventStage {
  const off = offsetFor(name)
  return {
    id: uid(),
    name,
    emoji,
    defaultOffsetDays: off,
    tasks: taskLabels.map(label => mkTask(label, off, ceremonyDate)),
  }
}

/**
 * Backfill the new drill-down fields on tasks coming from older persisted state
 * (storage was previously v4 without phases/messages/options). This keeps users'
 * existing checklists intact when the app upgrades.
 */
function migrateTask(t: Partial<StageTask> & Pick<StageTask, 'id' | 'label'>): StageTask {
  return {
    id: t.id,
    label: t.label,
    completed: t.completed ?? false,
    notes: t.notes ?? '',
    offsetDays: t.offsetDays ?? 30,
    dueDate: t.dueDate ?? '',
    currentPhase: t.currentPhase ?? 'briefing',
    messages: t.messages ?? [],
    options: t.options ?? [],
  }
}

/** Generates a 6-digit zero-padded numeric access code for client portal sign-in. */
function generateAccessCode(): string {
  const arr = new Uint32Array(1)
  crypto.getRandomValues(arr)
  return String(arr[0] % 1_000_000).padStart(6, '0')
}

/**
 * Bring a persisted Event up to the current schema. Two known migrations:
 *   1. Generate an access code if one is missing (added in a later release).
 *   2. Field rename: `subCategories` -> `stages`. Pre-rename localStorage
 *      entries still carry `subCategories`; we copy them across so they
 *      keep working without a destructive reset.
 */
function migrateEvent(e: Event): Event {
  return {
    ...e,
    accessCode: e.accessCode && /^\d{6}$/.test(e.accessCode) ? e.accessCode : generateAccessCode(),
    ceremonies: (e.ceremonies ?? []).map(c => {
      // Legacy: pre-rename ceremonies persisted with `subCategories` instead of `stages`.
      const legacy = c as unknown as { subCategories?: EventStage[] }
      const sourceStages: EventStage[] = c.stages ?? legacy.subCategories ?? []
      return {
        ...c,
        stages: sourceStages.map(stage => ({
          ...stage,
          tasks: stage.tasks.map(migrateTask),
        })),
      }
    }),
  }
}

// Default stage sets for different ceremony "kinds"
function weddingCeremonySubs(date: string): EventStage[] {
  return [
    mkSub('Venue & Logistics', '🚐', [
      'Venue confirmed',
      'Setup & teardown timeline',
      'Guest transportation',
      'Parking arrangements',
    ], date),
    mkSub('Decor', '🌸', [
      'Mandap / stage design',
      'Floral arrangements',
      'Backdrop & entrance decor',
      'Table centrepieces',
      'Lighting & uplighting',
    ], date),
    mkSub('Catering & Food', '🍽️', [
      'Caterer finalised',
      'Menu tasting done',
      'Welcome drinks & mocktails',
      'Sweets / mithai selection',
      'Dietary restrictions confirmed',
    ], date),
    mkSub('Outfits & Shopping', '👗', [
      'Bridal outfit fitted',
      "Groom's outfit fitted",
      'Family outfits',
      'Jewellery & accessories',
    ], date),
    mkSub('Beauty & Grooming', '💄', [
      'Makeup artist booked',
      'Hair stylist booked',
      'Mehendi artist booked',
      'Trial session done',
    ], date),
    mkSub('Photography & Video', '📸', [
      'Photographer booked',
      'Videographer booked',
      'Shot list confirmed',
      'Drone videography',
    ], date),
    mkSub('Entertainment', '🎵', [
      'DJ / music booked',
      'Live band / dhol',
      'Anchor / emcee',
      'Choreography rehearsed',
    ], date),
  ]
}

function lightCeremonySubs(date: string): EventStage[] {
  // smaller ceremonies (Roka, Haldi) need fewer stages
  return [
    mkSub('Venue & Logistics', '🚐', [
      'Venue confirmed',
      'Setup arrangement',
    ], date),
    mkSub('Decor', '🌸', [
      'Floral & ambient decor',
      'Seating arrangement',
    ], date),
    mkSub('Catering & Food', '🍽️', [
      'Menu confirmed',
      'Sweets & beverages',
    ], date),
    mkSub('Outfits & Shopping', '👗', [
      'Outfits decided',
    ], date),
    mkSub('Beauty & Grooming', '💄', [
      'Hair & makeup',
    ], date),
    mkSub('Photography & Video', '📸', [
      'Photographer booked',
    ], date),
  ]
}

function birthdaySubs(date: string): EventStage[] {
  return [
    mkSub('Theme & Decor', '🎈', [
      'Theme decided',
      'Balloon arch / backdrop',
      'Cake table decor',
    ], date),
    mkSub('Food & Cake', '🎂', [
      'Caterer / restaurant booked',
      'Birthday cake ordered',
      'Snacks & beverages',
    ], date),
    mkSub('Entertainment', '🎤', [
      'DJ / music playlist',
      'Games & activities',
      'Photo booth',
    ], date),
    mkSub('Guest Experience', '🎁', [
      'Invitations sent',
      'RSVP tracking',
      'Return gifts / favours',
    ], date),
    mkSub('Photography', '📸', [
      'Photographer booked',
    ], date),
  ]
}

function corporateSubs(date: string): EventStage[] {
  return [
    mkSub('Venue & Setup', '🏛️', [
      'Hall layout confirmed',
      'Registration desk setup',
      'Breakout rooms',
    ], date),
    mkSub('AV & Technology', '🎙️', [
      'Sound system',
      'Projectors / LED screens',
      'Microphones tested',
      'Live streaming setup',
    ], date),
    mkSub('Speakers & Agenda', '📋', [
      'Speaker confirmations',
      'Agenda finalised',
      'Rehearsals scheduled',
    ], date),
    mkSub('Catering', '🍽️', [
      'Welcome refreshments',
      'Lunch / dinner menu',
      'Tea & coffee breaks',
    ], date),
    mkSub('Branding & Collaterals', '🏷️', [
      'Signage & banners',
      'Badges & lanyards',
      'Programme booklets',
    ], date),
    mkSub('Guest Management', '👥', [
      'Invitations dispatched',
      'Accommodation (outstation)',
      'Transport & parking',
    ], date),
  ]
}

function galaSubs(date: string): EventStage[] {
  return [
    mkSub('Venue & Ambience', '🏛️', [
      'Venue confirmed',
      'Red carpet / entrance',
      'Lighting & draping',
    ], date),
    mkSub('Food & Beverage', '🥂', [
      'Caterer confirmed',
      'Welcome cocktails',
      'Cocktail hour menu',
      'Dinner / buffet menu',
    ], date),
    mkSub('Entertainment', '🎭', [
      'Anchor / emcee booked',
      'Performers / artistes',
      'DJ / live band',
    ], date),
    mkSub('Guest Experience', '✨', [
      'Invitations & dress code',
      'RSVP management',
      'Gift bags / favours',
    ], date),
    mkSub('Photography & Video', '📸', [
      'Photographer booked',
      'Videographer booked',
    ], date),
  ]
}

function genericSubs(date: string): EventStage[] {
  return [
    mkSub('Venue & Setup', '🏛️', ['Venue confirmed', 'Layout planned'], date),
    mkSub('Food & Beverages', '🍽️', ['Caterer booked', 'Menu confirmed'], date),
    mkSub('Entertainment', '🎵', ['Entertainment booked'], date),
    mkSub('Guest Management', '👥', ['Invitations sent', 'RSVPs tracked'], date),
    mkSub('Photography', '📸', ['Photographer booked'], date),
  ]
}

// ─── Default ceremony lists per event type ─────────────────────────────────────

/** Wedding ceremony defaults — offsetDays measured from the main `wedding` date. */
const WEDDING_CEREMONIES: Array<{ name: string; emoji: string; offsetDays: number; light?: boolean }> = [
  { name: 'Roka / Engagement', emoji: '💍', offsetDays: -180, light: true },
  { name: 'Mehendi',           emoji: '🌿', offsetDays: -2,   light: true },
  { name: 'Haldi',             emoji: '💛', offsetDays: -1,   light: true },
  { name: 'Sangeet',           emoji: '🎶', offsetDays: -1 },
  { name: 'Wedding',           emoji: '🛕', offsetDays:  0 },
  { name: 'Reception',         emoji: '🥂', offsetDays:  1 },
]

/**
 * Build the default ceremony list for a given event type, with each ceremony's
 * date computed from the main event date plus its offset.
 */
export function getDefaultCeremonies(type: EventType, eventDate: string): EventCeremony[] {
  const mk = (name: string, emoji: string, offsetDays: number, subs: EventStage[]): EventCeremony => ({
    id: uid(),
    name,
    emoji,
    offsetDaysFromEvent: offsetDays,
    date: offsetDate(eventDate, offsetDays),
    notes: '',
    stages: subs,
  })

  switch (type) {
    case 'wedding':
      return WEDDING_CEREMONIES.map(c => {
        const date = offsetDate(eventDate, c.offsetDays)
        const subs = c.light ? lightCeremonySubs(date) : weddingCeremonySubs(date)
        return mk(c.name, c.emoji, c.offsetDays, subs)
      })

    case 'birthday':
      return [mk('Birthday Party', '🎂', 0, birthdaySubs(eventDate))]

    case 'anniversary':
      return [mk('Anniversary Celebration', '💖', 0, birthdaySubs(eventDate))]

    case 'corporate':
      return [mk('Conference Day', '🏢', 0, corporateSubs(eventDate))]

    case 'conference':
      return [
        mk('Day 1',  '📅', 0, corporateSubs(eventDate)),
        mk('Day 2',  '📅', 1, corporateSubs(offsetDate(eventDate, 1))),
      ]

    case 'gala':
      return [mk('Gala Night', '✨', 0, galaSubs(eventDate))]

    case 'graduation':
      return [mk('Graduation Celebration', '🎓', 0, birthdaySubs(eventDate))]

    default:
      return [mk('Main Event', '🎉', 0, genericSubs(eventDate))]
  }
}

// ─── Sample data ───────────────────────────────────────────────────────────────

// Curated sample directory — real-feeling spread across categories, regions
// and event specialities so the planner's first impression of "Vendors" feels
// useful, not empty. All contacts are placeholder values.
const SAMPLE_VENDORS: Vendor[] = [
  // ── North America ────────────────────────────────────────────────────────
  {
    id: 'v1', name: 'Bloom & Petal Florals', category: 'florals',
    contact: 'Sarah Chen', email: 'sarah@bloomandpetal.com', phone: '+1 555-0101',
    priceRange: '$800–$3,000', rating: 5, tags: ['luxury', 'garden', 'romantic'],
    region: 'North America', specialties: ['wedding', 'anniversary'],
    notes: 'NYC-based. Specializes in garden-style arrangements. Books 6 months out.', createdAt: new Date().toISOString(),
  },
  {
    id: 'v2', name: 'Golden Frame Photography', category: 'photography',
    contact: 'Marcus Lee', email: 'marcus@goldenframe.com', phone: '+1 555-0202',
    priceRange: '$2,500–$6,000', rating: 5, tags: ['editorial', 'candid', 'luxury'],
    region: 'North America', specialties: ['wedding', 'gala', 'corporate'],
    notes: 'Award-winning Brooklyn studio. Candid style. Requires 50% deposit.', createdAt: new Date().toISOString(),
  },
  {
    id: 'v3', name: 'Saveur Catering Co.', category: 'catering',
    contact: 'Elena Russo', email: 'elena@saveur.com', phone: '+1 555-0303',
    priceRange: '$85–$150 per head', rating: 4, tags: ['farm-to-table', 'vegan-friendly', 'plated'],
    region: 'North America', specialties: ['wedding', 'corporate', 'gala'],
    notes: 'San Francisco. Excellent vegan options. Provides servers and bartenders.', createdAt: new Date().toISOString(),
  },
  {
    id: 'v4', name: 'Luminary Lighting & Decor', category: 'lighting',
    contact: 'James Park', email: 'james@luminecor.com', phone: '+1 555-0404',
    priceRange: '$1,200–$5,000', rating: 4, tags: ['fairy-lights', 'uplighting', 'marquee'],
    region: 'North America', specialties: ['wedding', 'gala', 'corporate'],
    notes: 'Toronto + GTA. Great for outdoor and tented events. Setup crew included.', createdAt: new Date().toISOString(),
  },
  {
    id: 'v5', name: 'The Greenhouse Estate', category: 'venue',
    contact: 'Olivia Tan', email: 'events@greenhouseestate.com', phone: '+1 555-0505',
    priceRange: '$8,000–$22,000', rating: 5, tags: ['conservatory', 'glasshouse', 'natural-light'],
    region: 'North America', specialties: ['wedding', 'corporate', 'gala'],
    notes: 'LA area. 200-cap glasshouse. Stunning natural light, in-house catering optional.', createdAt: new Date().toISOString(),
  },
  {
    id: 'v6', name: 'Cinematic Story Films', category: 'videography',
    contact: 'Diego Alvarez', email: 'diego@cinematicstory.com', phone: '+1 555-0606',
    priceRange: '$3,500–$8,500', rating: 5, tags: ['drone', 'documentary', 'cinematic'],
    region: 'North America', specialties: ['wedding', 'gala', 'graduation'],
    notes: 'Chicago-based. 4K drone, two-shooter coverage. Same-day teaser available.', createdAt: new Date().toISOString(),
  },
  {
    id: 'v7', name: 'Velvet Sound DJs', category: 'music',
    contact: 'Aaliyah Brooks', email: 'hello@velvetsound.com', phone: '+1 555-0707',
    priceRange: '$1,200–$3,500', rating: 4, tags: ['dj', 'mc', 'open-format'],
    region: 'North America', specialties: ['wedding', 'birthday', 'corporate'],
    notes: 'Atlanta. Open-format DJ + bilingual MC. Brings own lighting rig.', createdAt: new Date().toISOString(),
  },

  // ── UK & Ireland ────────────────────────────────────────────────────────
  {
    id: 'v8', name: 'Marlowe & Vine Florists', category: 'florals',
    contact: 'Edith Marlowe', email: 'edith@marloweandvine.co.uk', phone: '+44 20 7946 0011',
    priceRange: '£1,200–£4,500', rating: 5, tags: ['english-garden', 'wildflower', 'sustainable'],
    region: 'UK & Ireland', specialties: ['wedding', 'anniversary'],
    notes: 'London + Cotswolds. Foam-free, locally sourced stems.', createdAt: new Date().toISOString(),
  },
  {
    id: 'v9', name: 'The Old Mill Estate', category: 'venue',
    contact: 'Hugh Pemberton', email: 'enquiries@oldmillestate.co.uk', phone: '+44 1865 555-9090',
    priceRange: '£12,000–£28,000', rating: 5, tags: ['historic', 'manor', 'gardens'],
    region: 'UK & Ireland', specialties: ['wedding', 'gala'],
    notes: 'Oxfordshire. 16th-century mill, on-site overnight rooms for 30.', createdAt: new Date().toISOString(),
  },
  {
    id: 'v10', name: 'Fennel & Fig Catering', category: 'catering',
    contact: 'Priya Anand', email: 'priya@fennelandfig.co.uk', phone: '+44 161 555-1212',
    priceRange: '£70–£140 per head', rating: 4, tags: ['seasonal', 'modern-british', 'halal-options'],
    region: 'UK & Ireland', specialties: ['wedding', 'corporate', 'conference'],
    notes: 'Manchester. Seasonal modern British menus, halal and kosher available.', createdAt: new Date().toISOString(),
  },
  {
    id: 'v11', name: 'Dublin Strings Quartet', category: 'music',
    contact: 'Niamh O\'Sullivan', email: 'bookings@dublinstrings.ie', phone: '+353 1 555-3030',
    priceRange: '€800–€2,200', rating: 5, tags: ['classical', 'ceremony', 'cocktail-hour'],
    region: 'UK & Ireland', specialties: ['wedding', 'gala', 'anniversary'],
    notes: 'Dublin. Classical + contemporary repertoire. Travels across UK & Ireland.', createdAt: new Date().toISOString(),
  },

  // ── Europe ──────────────────────────────────────────────────────────────
  {
    id: 'v12', name: 'Studio Lumière Paris', category: 'photography',
    contact: 'Camille Rousseau', email: 'camille@studio-lumiere.fr', phone: '+33 1 55 55 04 04',
    priceRange: '€3,000–€7,500', rating: 5, tags: ['fine-art', 'film', 'luxury'],
    region: 'Europe', specialties: ['wedding', 'gala'],
    notes: 'Paris. Fine-art film + digital. Available for destination weddings across Europe.', createdAt: new Date().toISOString(),
  },
  {
    id: 'v13', name: 'Villa Costiera', category: 'venue',
    contact: 'Matteo Greco', email: 'eventi@villacostiera.it', phone: '+39 089 555-7070',
    priceRange: '€18,000–€45,000', rating: 5, tags: ['cliffside', 'mediterranean', 'destination'],
    region: 'Europe', specialties: ['wedding', 'anniversary', 'gala'],
    notes: 'Amalfi Coast. 3-night minimum stay. Iconic destination property.', createdAt: new Date().toISOString(),
  },
  {
    id: 'v14', name: 'Berliner Klang Productions', category: 'music',
    contact: 'Lukas Weber', email: 'lukas@berlinerklang.de', phone: '+49 30 555-8080',
    priceRange: '€1,800–€5,500', rating: 4, tags: ['live-band', 'jazz', 'corporate'],
    region: 'Europe', specialties: ['corporate', 'gala', 'conference'],
    notes: 'Berlin. 4–9 piece live band. Strong jazz + funk repertoire.', createdAt: new Date().toISOString(),
  },
  {
    id: 'v15', name: 'Ámbar Floral Studio', category: 'florals',
    contact: 'Sofía Méndez', email: 'sofia@ambarfloral.es', phone: '+34 91 555-9090',
    priceRange: '€600–€2,800', rating: 4, tags: ['mediterranean', 'dried-florals', 'minimal'],
    region: 'Europe', specialties: ['wedding', 'corporate', 'birthday'],
    notes: 'Madrid + Barcelona. Modern Mediterranean palette, dried-floral specialist.', createdAt: new Date().toISOString(),
  },

  // ── India & South Asia ──────────────────────────────────────────────────
  {
    id: 'v16', name: 'Saffron Banquets', category: 'venue',
    contact: 'Rohan Kapoor', email: 'events@saffronbanquets.in', phone: '+91 11 4555 1010',
    priceRange: '₹4,00,000–₹12,00,000', rating: 5, tags: ['banquet', 'multi-cuisine', 'mandap'],
    region: 'India & South Asia', specialties: ['wedding', 'birthday', 'anniversary'],
    notes: 'Delhi NCR. Up to 800 guests, in-house mandap and stage decor packages.', createdAt: new Date().toISOString(),
  },
  {
    id: 'v17', name: 'Mehndi Stories Photography', category: 'photography',
    contact: 'Aanya Iyer', email: 'aanya@mehndistories.in', phone: '+91 22 4555 2020',
    priceRange: '₹1,80,000–₹6,00,000', rating: 5, tags: ['candid', 'pre-wedding', 'multi-day'],
    region: 'India & South Asia', specialties: ['wedding', 'anniversary'],
    notes: 'Mumbai. Specialises in 3–5 day Indian weddings. Two-team coverage standard.', createdAt: new Date().toISOString(),
  },
  {
    id: 'v18', name: 'Spice Route Catering', category: 'catering',
    contact: 'Vikram Joshi', email: 'vikram@spiceroute.in', phone: '+91 80 4555 3030',
    priceRange: '₹1,200–₹2,800 per head', rating: 4, tags: ['multi-regional', 'jain-options', 'live-counters'],
    region: 'India & South Asia', specialties: ['wedding', 'corporate', 'birthday'],
    notes: 'Bengaluru. North + South + Indo-Chinese. Jain and satvik menus available.', createdAt: new Date().toISOString(),
  },
  {
    id: 'v19', name: 'Roshani Lights & Mandap', category: 'lighting',
    contact: 'Devika Rao', email: 'roshani@roshanilights.in', phone: '+91 40 4555 4040',
    priceRange: '₹1,50,000–₹6,00,000', rating: 4, tags: ['mandap', 'led-walls', 'fairy-lights'],
    region: 'India & South Asia', specialties: ['wedding', 'birthday', 'anniversary'],
    notes: 'Hyderabad. Mandap design + LED walls + outdoor uplighting.', createdAt: new Date().toISOString(),
  },
  {
    id: 'v20', name: 'Karwaan Wedding Cars', category: 'transportation',
    contact: 'Imran Sheikh', email: 'imran@karwaancars.in', phone: '+91 22 4555 5050',
    priceRange: '₹15,000–₹80,000 per day', rating: 4, tags: ['vintage', 'luxury', 'baraat'],
    region: 'India & South Asia', specialties: ['wedding', 'anniversary'],
    notes: 'Mumbai + Pune. Vintage cars, luxury sedans, decorated baraat horse.', createdAt: new Date().toISOString(),
  },

  // ── Middle East ─────────────────────────────────────────────────────────
  {
    id: 'v21', name: 'Al Noor Events Hall', category: 'venue',
    contact: 'Layla Al-Hamadi', email: 'events@alnoorhall.ae', phone: '+971 4 555 6060',
    priceRange: 'AED 80,000–250,000', rating: 5, tags: ['ballroom', 'segregated-options', 'luxury'],
    region: 'Middle East', specialties: ['wedding', 'gala', 'corporate'],
    notes: 'Dubai. Ballroom with optional gender-segregated layouts. Catering in-house.', createdAt: new Date().toISOString(),
  },
  {
    id: 'v22', name: 'Cedar & Cardamom Catering', category: 'catering',
    contact: 'Tarek Haddad', email: 'tarek@cedarcardamom.com', phone: '+961 1 555-7070',
    priceRange: '$60–$140 per head', rating: 5, tags: ['levantine', 'mezze', 'halal'],
    region: 'Middle East', specialties: ['wedding', 'corporate', 'gala'],
    notes: 'Beirut. Modern Levantine, large mezze spreads, fully halal.', createdAt: new Date().toISOString(),
  },

  // ── Asia Pacific ────────────────────────────────────────────────────────
  {
    id: 'v23', name: 'Sakura Floral Atelier', category: 'florals',
    contact: 'Hana Tanaka', email: 'hana@sakuraatelier.jp', phone: '+81 3 5555 8080',
    priceRange: '¥150,000–¥600,000', rating: 5, tags: ['ikebana', 'minimalist', 'seasonal'],
    region: 'Asia Pacific', specialties: ['wedding', 'corporate', 'gala'],
    notes: 'Tokyo. Modern ikebana-influenced installations.', createdAt: new Date().toISOString(),
  },
  {
    id: 'v24', name: 'Marina Bay Convention Group', category: 'venue',
    contact: 'Wei Lin', email: 'corp@marinabayconvention.sg', phone: '+65 6555-9090',
    priceRange: 'SGD 18,000–60,000', rating: 5, tags: ['conference', 'av-equipped', 'corporate'],
    region: 'Asia Pacific', specialties: ['conference', 'corporate', 'gala'],
    notes: 'Singapore. Full AV, breakout rooms, in-house production team.', createdAt: new Date().toISOString(),
  },
  {
    id: 'v25', name: 'Manila Sound Co.', category: 'music',
    contact: 'Joaquin Reyes', email: 'joaquin@manilasound.ph', phone: '+63 2 5555-1010',
    priceRange: '₱60,000–₱250,000', rating: 4, tags: ['live-band', 'pop', 'wedding'],
    region: 'Asia Pacific', specialties: ['wedding', 'birthday', 'corporate'],
    notes: 'Manila. 5–8 piece live band. Bilingual repertoire (English + Tagalog).', createdAt: new Date().toISOString(),
  },
  {
    id: 'v26', name: 'Bangkok Bloom & Co.', category: 'florals',
    contact: 'Niran Suksawat', email: 'niran@bangkokbloom.co.th', phone: '+66 2 555-2020',
    priceRange: '฿30,000–฿180,000', rating: 4, tags: ['tropical', 'orchid', 'destination'],
    region: 'Asia Pacific', specialties: ['wedding', 'anniversary', 'birthday'],
    notes: 'Bangkok + Phuket. Tropical orchid specialist for destination weddings.', createdAt: new Date().toISOString(),
  },

  // ── Australia & NZ ──────────────────────────────────────────────────────
  {
    id: 'v27', name: 'Coastline Weddings & Co.', category: 'venue',
    contact: 'Charlotte Walker', email: 'hello@coastline-weddings.com.au', phone: '+61 2 5555-3030',
    priceRange: 'AUD 12,000–35,000', rating: 5, tags: ['beachfront', 'rooftop', 'modern'],
    region: 'Australia & NZ', specialties: ['wedding', 'anniversary', 'birthday'],
    notes: 'Sydney. Beachfront + rooftop options, panoramic harbour views.', createdAt: new Date().toISOString(),
  },
  {
    id: 'v28', name: 'Wellington Reels Films', category: 'videography',
    contact: 'Te Aroha Ngata', email: 'kia.ora@wellingtonreels.co.nz', phone: '+64 4 555-4040',
    priceRange: 'NZD 4,000–9,500', rating: 5, tags: ['documentary', 'nature', 'cinematic'],
    region: 'Australia & NZ', specialties: ['wedding', 'graduation'],
    notes: 'Wellington. Beautiful nature backdrops, documentary-style.', createdAt: new Date().toISOString(),
  },
  {
    id: 'v29', name: 'Outback Coach Hire', category: 'transportation',
    contact: 'Riley Watson', email: 'riley@outbackcoach.com.au', phone: '+61 8 5555-5050',
    priceRange: 'AUD 1,500–6,000', rating: 4, tags: ['shuttle', 'luxury-coach', 'guest-transport'],
    region: 'Australia & NZ', specialties: ['wedding', 'corporate', 'conference'],
    notes: 'Melbourne + Adelaide. Luxury coaches up to 56 seats.', createdAt: new Date().toISOString(),
  },

  // ── Cross-region / generic decor ────────────────────────────────────────
  {
    id: 'v30', name: 'Atelier Threadbare Decor', category: 'decor',
    contact: 'Mira Okafor', email: 'mira@threadbaredecor.com', phone: '+1 555-6060',
    priceRange: '$2,000–$12,000', rating: 5, tags: ['linens', 'tablescapes', 'rentals'],
    region: 'North America', specialties: ['wedding', 'gala', 'anniversary'],
    notes: 'Brooklyn. Heirloom-quality linen and tabletop rentals. Will ship within USA + Canada.', createdAt: new Date().toISOString(),
  },
]

const E1_DATE = '2026-09-14'
const E2_DATE = '2026-11-08'

// Sample seeded conversation that shows what the task drill-down looks like
// once a planner has been actively working through a decision with a client.
function seedVenueConversation(): { messages: TaskMessage[]; phase: StageTask['currentPhase'] } {
  const dayMs = 1000 * 60 * 60 * 24
  const now = Date.now()
  return {
    phase: 'client-review',
    messages: [
      {
        id: uid(),
        author: 'client',
        authorName: 'Aisha',
        channel: 'in-app',
        timestamp: new Date(now - dayMs * 14).toISOString(),
        phase: 'briefing',
        content: "Hi! For the venue we'd really love something with a garden — natural light is super important. Indoor backup matters because of monsoon. Trying to keep it under $5K. Definitely no banquet-hall vibe please 🙏",
        insight: {
          preferences: ['garden venue', 'natural light', 'indoor backup'],
          concerns: ['budget under $5K', 'monsoon risk', 'avoid banquet-hall feel'],
          decisions: [],
          sentiment: 'positive',
        },
      },
      {
        id: uid(),
        author: 'planner',
        channel: 'in-app',
        timestamp: new Date(now - dayMs * 12).toISOString(),
        phase: 'recommendations',
        content: "Got it — pulled together 3 options that match: Rosewood Estate (garden + covered pavilion), Hidden Garden Co. (most budget-friendly), and Atrium 47 (modern indoor with skylights). Sharing details in the deck below.",
      },
      {
        id: uid(),
        author: 'client',
        authorName: 'Aisha',
        channel: 'email',
        timestamp: new Date(now - dayMs * 5).toISOString(),
        phase: 'client-review',
        content: "We absolutely love Rosewood! Hidden Garden was sweet but felt a bit small for 180 guests. Can we get a quote with the pavilion add-on? Also worried Rosewood might push us over budget — could we trim somewhere?",
        insight: {
          preferences: ['Rosewood Estate', 'pavilion add-on'],
          concerns: ['Hidden Garden too small for 180 guests', 'Rosewood may exceed budget'],
          decisions: ['rejecting Hidden Garden Co.'],
          sentiment: 'positive',
        },
      },
    ],
  }
}

function seedWedding(date: string): EventCeremony[] {
  const ceremonies = getDefaultCeremonies('wedding', date)
  const wedding = ceremonies.find(c => c.name === 'Wedding')
  if (wedding) {
    const venue = wedding.stages.find(s => s.name === 'Venue & Logistics')
    if (venue) {
      const venueTask = venue.tasks[0]
      const seeded = seedVenueConversation()
      venueTask.messages = seeded.messages
      venueTask.currentPhase = seeded.phase
      venueTask.options = [
        {
          id: uid(),
          title: 'Rosewood Estate',
          description: 'Napa-Valley garden estate with covered pavilion. Capacity 220.',
          estimatedCost: '$4,800',
          pros: ['Garden + indoor backup', 'Strong natural light', 'Onsite catering'],
          cons: ['Slightly above target budget'],
          status: 'shortlisted',
          createdAt: new Date().toISOString(),
        },
        {
          id: uid(),
          title: 'Hidden Garden Co.',
          description: 'Boutique garden venue. Capacity 140.',
          estimatedCost: '$3,200',
          pros: ['Within budget', 'Beautiful garden'],
          cons: ['Too small for 180 guests', 'No indoor backup'],
          status: 'rejected',
          createdAt: new Date().toISOString(),
        },
        {
          id: uid(),
          title: 'Atrium 47',
          description: 'Modern indoor venue with floor-to-ceiling skylights.',
          estimatedCost: '$4,400',
          pros: ['Weatherproof', 'Beautiful natural light'],
          cons: ['Less garden feel', 'Modern aesthetic may clash with theme'],
          status: 'proposed',
          createdAt: new Date().toISOString(),
        },
      ]
    }
    const photo = wedding.stages.find(s => s.name === 'Photography & Video')
    if (photo) {
      photo.tasks[0].completed = true
      photo.tasks[1].completed = true
    }
    const food = wedding.stages.find(s => s.name === 'Catering & Food')
    if (food) food.tasks[0].completed = true
  }
  const mehendi = ceremonies.find(c => c.name === 'Mehendi')
  if (mehendi) {
    const beauty = mehendi.stages.find(s => s.name === 'Beauty & Grooming')
    if (beauty) beauty.tasks[0].completed = true
  }
  return ceremonies
}

function seedGala(date: string): EventCeremony[] {
  const ceremonies = getDefaultCeremonies('gala', date)
  const main = ceremonies[0]
  if (main) {
    main.stages[0].tasks[0].completed = true
    main.stages[2].tasks[0].completed = true
  }
  return ceremonies
}

const SAMPLE_EVENTS: Event[] = [
  {
    id: 'e1',
    name: 'Aisha & Rohan Wedding',
    clientName: 'Aisha Patel',
    clientEmail: 'aisha@example.com',
    clientPhone: '+14155550101',
    type: 'wedding',
    status: 'planning',
    date: E1_DATE,
    venue: 'The Rosewood Estate',
    location: 'Napa Valley, CA',
    guestCount: 180,
    budget: 65000,
    theme: 'Romantic Garden Luxe',
    preferences: {
      style: ['romantic', 'lush', 'garden'],
      colorPalette: ['blush', 'ivory', 'sage', 'gold'],
      dietary: ['vegetarian options', 'nut-free'],
      musicGenre: ['jazz', 'classical', 'soft pop'],
      dislikes: ['overly modern', 'neon colors'],
      notes: 'Client loves pampas grass and candlelit ambiance.',
    },
    milestones: [
      { id: 'e1-m1', label: 'Venue confirmed',     dueDate: '2026-01-15', completed: true,  notes: '' },
      { id: 'e1-m2', label: 'Caterer booked',      dueDate: '2026-02-01', completed: true,  notes: '' },
      { id: 'e1-m3', label: 'Florals contracted',  dueDate: '2026-03-01', completed: false, notes: '' },
      { id: 'e1-m4', label: 'Invitations sent',    dueDate: '2026-05-01', completed: false, notes: '' },
      { id: 'e1-m5', label: 'Final headcount',     dueDate: '2026-08-01', completed: false, notes: '' },
      { id: 'e1-m6', label: 'Rehearsal dinner',    dueDate: '2026-09-13', completed: false, notes: '' },
    ],
    ceremonies: seedWedding(E1_DATE),
    vendorIds: ['v1', 'v2', 'v3'],
    concepts: [
      {
        id: 'c1', eventId: 'e1',
        title: 'Garden Twilight',
        tagline: 'Where wildflowers meet candlelight',
        theme: 'Romantic Garden Luxe',
        colorPalette: ['Blush Rose', 'Ivory', 'Sage Green', 'Antique Gold'],
        mood: 'Intimate, warm, timeless elegance',
        venueDescription: 'Ceremony under a flower-draped arch on the estate lawn, reception in a softly lit pavilion draped with fairy lights and flowing ivory linen.',
        decorItems: [
          { name: 'Pampas & Rose Centerpieces', description: 'Tall gold-frame vases with pampas grass, garden roses, and trailing greenery', estimatedCost: '$120 each' },
          { name: 'Fairy Light Canopy', description: 'Full ceiling installation of warm-white fairy lights across the reception tent', estimatedCost: '$2,200' },
          { name: 'Floral Arch', description: 'Ceremony arch featuring blush peonies, garden roses, eucalyptus, and ivory lisianthus', estimatedCost: '$1,800' },
          { name: 'Candlelit Tablescape', description: 'Gold pillar candles of varying heights with low flower clusters and linen runners', estimatedCost: '$85 per table' },
        ],
        cateringNotes: 'Farm-to-table menu: heirloom tomato bruschetta, mushroom risotto, herb-roasted salmon. Signature cocktail: rosé elderflower spritz.',
        entertainmentNotes: 'Jazz trio during cocktail hour, live acoustic set for first dance, DJ for reception.',
        estimatedBudget: '$58,000–$64,000',
        status: 'pending',
        clientComment: '',
        plannerNotes: 'Check Luminary for fairy light canopy availability in September.',
        coverGradient: 'from-rose-400 via-pink-300 to-orange-200',
        images: [
          'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1100&q=80',
          'https://images.unsplash.com/photo-1490750967868-88df5691cc58?auto=format&fit=crop&w=1100&q=80',
          'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1100&q=80',
          'https://images.unsplash.com/photo-1530653333484-8d161fdf9c0d?auto=format&fit=crop&w=1100&q=80',
          'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1100&q=80',
          'https://images.unsplash.com/photo-1470229538611-c1b5b813e690?auto=format&fit=crop&w=1400&q=80',
        ],
        generatedAt: new Date().toISOString(),
        sharedWithClient: true,
      },
      {
        id: 'c2', eventId: 'e1',
        title: 'Versailles in Bloom',
        tagline: 'French opulence meets garden romance',
        theme: 'Romantic Garden Luxe',
        colorPalette: ['Champagne', 'Deep Blush', 'Forest Green', 'Warm Gold'],
        mood: 'Grand, lush, sophisticated',
        venueDescription: 'Ceremony in the estate\'s courtyard with manicured hedges, reception in the main hall with floor-to-ceiling floral installations.',
        decorItems: [
          { name: 'Floral Ceiling Installation', description: 'Suspended floral cloud of garden roses and greenery above the dance floor', estimatedCost: '$3,800' },
          { name: 'Gold Candelabras', description: 'French-style five-arm candelabras as centerpieces with cascading blooms', estimatedCost: '$200 each' },
          { name: 'Hedge Wall Backdrop', description: 'Greenery panel wall with gold "A & R" monogram for photo moments', estimatedCost: '$950' },
          { name: 'Velvet Linen Accents', description: 'Deep blush velvet table runners paired with champagne chargers and gold flatware', estimatedCost: '$45 per table' },
        ],
        cateringNotes: 'French-inspired menu: cheese and charcuterie station, coq au vin, vegetarian provençal tart. Wine-forward beverage program.',
        entertainmentNotes: 'Classical string quartet for ceremony, big band set during dinner, DJ for dancing.',
        estimatedBudget: '$62,000–$68,000',
        status: 'pending',
        clientComment: '',
        plannerNotes: 'May exceed budget slightly. Confirm with client before committing.',
        coverGradient: 'from-amber-400 via-yellow-300 to-orange-200',
        images: [
          'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1100&q=80',
          'https://images.unsplash.com/photo-1487530811176-3780de880c2d?auto=format&fit=crop&w=1100&q=80',
          'https://images.unsplash.com/photo-1530023367847-a683933f4172?auto=format&fit=crop&w=1100&q=80',
          'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=1100&q=80',
          'https://images.unsplash.com/photo-1544161702-af3e19a9c04a?auto=format&fit=crop&w=1100&q=80',
          'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1400&q=80',
        ],
        generatedAt: new Date().toISOString(),
        sharedWithClient: true,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    plannerEmail: 'demo@thalia.app',
  },
  {
    id: 'e2',
    name: 'Nexus Tech Annual Gala',
    clientName: 'Diana Ortega',
    clientEmail: 'diana@nexustech.com',
    clientPhone: '+14155550202',
    type: 'gala',
    status: 'confirmed',
    date: E2_DATE,
    venue: 'The Grand Atrium',
    location: 'San Francisco, CA',
    guestCount: 320,
    budget: 120000,
    theme: 'Future Luxe',
    preferences: {
      style: ['modern', 'sleek', 'futuristic'],
      colorPalette: ['midnight blue', 'silver', 'white', 'electric teal'],
      dietary: ['kosher', 'vegan options'],
      musicGenre: ['electronic', 'house', 'live jazz'],
      dislikes: ['rustic', 'floral overload'],
      notes: 'Brand colors: deep navy and silver. No red.',
    },
    milestones: [
      { id: 'e2-m1', label: 'Venue signed',              dueDate: '2026-01-10', completed: true,  notes: '' },
      { id: 'e2-m2', label: 'AV partner confirmed',      dueDate: '2026-02-15', completed: true,  notes: '' },
      { id: 'e2-m3', label: 'Speaker lineup finalized',  dueDate: '2026-06-01', completed: true,  notes: '' },
      { id: 'e2-m4', label: 'Invitations distributed',   dueDate: '2026-08-01', completed: false, notes: '' },
      { id: 'e2-m5', label: 'RSVP deadline',             dueDate: '2026-10-01', completed: false, notes: '' },
    ],
    ceremonies: seedGala(E2_DATE),
    vendorIds: ['v2', 'v4'],
    concepts: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    plannerEmail: 'demo@thalia.app',
  },
]

const DEFAULT_PLANNER_PROFILE: PlannerProfile = {
  name: '',
  businessName: '',
  title: 'Event Planner',
  whatsappNumber: '',
  email: '',
  avatarColor: 'from-brand-400 to-brand-600',
  emailjsServiceId: '',
  emailjsTemplateId: '',
  emailjsPublicKey: '',
}

const DEFAULT_CLIENT_PROFILE: ClientProfile = {
  name: '',
  whatsappNumber: '',
  email: '',
}

// ─── Helpers for nested updates ────────────────────────────────────────────────
function mapCeremony(events: Event[], eventId: string, fn: (c: EventCeremony) => EventCeremony): Event[] {
  return events.map(e =>
    e.id === eventId
      ? { ...e, ceremonies: e.ceremonies.map(fn), updatedAt: new Date().toISOString() }
      : e
  )
}

/** Map over a single task identified by the full ceremony→sub→task path. */
function mapTask(
  events: Event[],
  eventId: string,
  ceremonyId: string,
  subId: string,
  taskId: string,
  fn: (t: StageTask) => StageTask
): Event[] {
  return mapCeremony(events, eventId, c =>
    c.id === ceremonyId
      ? {
          ...c,
          stages: c.stages.map(sub =>
            sub.id === subId
              ? { ...sub, tasks: sub.tasks.map(t => (t.id === taskId ? fn(t) : t)) }
              : sub
          ),
        }
      : c
  )
}

// ─── Store ─────────────────────────────────────────────────────────────────────
export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      role: 'planner',
      session: null,
      registeredPlanners: loadAccounts(),
      activeEventId: 'e1',
      events: SAMPLE_EVENTS,
      vendors: SAMPLE_VENDORS,
      isGenerating: false,
      apiKey: '',
      plannerProfile: DEFAULT_PLANNER_PROFILE,
      clientProfile: DEFAULT_CLIENT_PROFILE,

      setRole: (role: Role) => set({ role }),

      // ─── Auth ────────────────────────────────────────────────────────────
      login: (session: AuthSession) => {
        set({ session, role: session.role })
        // Sync profile names when logging in
        if (session.role === 'planner' && !session.isPlannerPreview) {
          set((s) => ({
            plannerProfile: {
              ...s.plannerProfile,
              name: session.displayName,
              email: session.email,
            },
          }))
        } else if (session.role === 'client') {
          set((s) => ({
            clientProfile: {
              ...s.clientProfile,
              name: session.displayName,
              email: session.email,
            },
          }))
        }
      },

      logout: () => {
        set({ session: null, role: 'planner' })
      },

      registerPlanner: async (data) => {
        const existing = get().registeredPlanners.find(
          (p) => p.email.toLowerCase() === data.email.toLowerCase()
        )
        if (existing) return 'email_taken'
        const passwordSalt = generateSalt()
        const passwordHash = await hashPassword(data.password, passwordSalt)
        const planner: RegisteredPlanner = {
          name: data.name,
          businessName: data.businessName,
          email: data.email,
          passwordHash,
          passwordSalt,
          createdAt: new Date().toISOString(),
        }
        const updated = [...get().registeredPlanners, planner]
        set({ registeredPlanners: updated })
        saveAccounts(updated) // persist to version-independent key
        return 'ok'
      },

      verifyPlannerPassword: async (email, password) => {
        const planners = get().registeredPlanners
        const match = planners.find((p) => p.email.toLowerCase() === email.toLowerCase())
        if (!match) return false

        // Legacy account migration: pre-hash records stored a plaintext `password`
        // field. Detect via missing salt/hash and migrate transparently on first
        // successful login.
        const legacy = match as unknown as { password?: string }
        if (!match.passwordSalt || !match.passwordHash) {
          if (legacy.password && legacy.password === password) {
            const passwordSalt = generateSalt()
            const passwordHash = await hashPassword(password, passwordSalt)
            const migrated: RegisteredPlanner = {
              name: match.name,
              businessName: match.businessName,
              email: match.email,
              passwordHash,
              passwordSalt,
              createdAt: match.createdAt,
            }
            const updated = planners.map((p) =>
              p.email.toLowerCase() === match.email.toLowerCase() ? migrated : p
            )
            set({ registeredPlanners: updated })
            saveAccounts(updated)
            return true
          }
          return false
        }

        const candidate = await hashPassword(password, match.passwordSalt)
        return safeEqual(candidate, match.passwordHash)
      },

      enterPreviewMode: (eventId: string, clientName: string, clientEmail: string) => {
        const current = get().session
        if (!current || current.role !== 'planner') return
        set({
          role: 'client',
          session: {
            ...current,
            isPlannerPreview: true,
            previewEventId: eventId,
          },
          clientProfile: { name: clientName, email: clientEmail, whatsappNumber: '' },
        })
      },

      exitPreviewMode: () => {
        const current = get().session
        if (!current?.isPlannerPreview) return
        set({
          role: 'planner',
          session: {
            ...current,
            role: 'planner',
            isPlannerPreview: false,
            previewEventId: undefined,
            clientEventId: undefined,
          },
          clientProfile: { name: '', email: '', whatsappNumber: '' },
        })
      },

      setApiKey: (apiKey: string) => set({ apiKey }),
      setPlannerProfile: (updates) =>
        set((s) => ({ plannerProfile: { ...s.plannerProfile, ...updates } })),
      setClientProfile: (updates) =>
        set((s) => ({ clientProfile: { ...s.clientProfile, ...updates } })),
      setActiveEvent: (id) => set({ activeEventId: id }),
      setIsGenerating: (v) => set({ isGenerating: v }),

      addEvent: (event) => {
        // Stamp the current planner's email so events are scoped per account
        // and assign a per-event access code for client portal sign-in.
        const plannerEmail = get().session?.email ?? ''
        const accessCode = event.accessCode && /^\d{6}$/.test(event.accessCode)
          ? event.accessCode
          : generateAccessCode()
        set((s) => ({ events: [...s.events, { ...event, plannerEmail, accessCode }] }))
      },
      updateEvent: (id, updates) =>
        set((s) => ({
          events: s.events.map((e) =>
            e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e
          ),
        })),
      deleteEvent: (id) =>
        set((s) => ({
          events: s.events.filter((e) => e.id !== id),
          activeEventId: s.activeEventId === id ? null : s.activeEventId,
        })),

      /**
       * Duplicate an event with a fresh id, "(copy)" suffix on the name, a
       * new access code, and reset client decisions. Returns the new id.
       */
      duplicateEvent: (id) => {
        const original = get().events.find((e) => e.id === id)
        if (!original) return null
        const now = new Date().toISOString()
        const copy: Event = {
          ...original,
          id: uid(),
          name: `${original.name} (copy)`,
          accessCode: generateAccessCode(),
          plannerEmail: get().session?.email ?? original.plannerEmail,
          // Reset concept decisions — copying a brief shouldn't carry approvals
          concepts: original.concepts.map((c) => ({
            ...c,
            id: uid(),
            status: 'pending',
            clientComment: '',
            sharedWithClient: false,
          })),
          // Reset milestone completion flags
          milestones: original.milestones.map((m) => ({ ...m, id: uid(), completed: false })),
          // Reset task completion + clear messages on copy
          ceremonies: (original.ceremonies ?? []).map((cer) => ({
            ...cer,
            id: uid(),
            stages: cer.stages.map((sub) => ({
              ...sub,
              id: uid(),
              tasks: sub.tasks.map((t) => ({
                ...t, id: uid(), completed: false, messages: [], options: [], currentPhase: 'briefing',
              })),
            })),
          })),
          createdAt: now,
          updatedAt: now,
        }
        set((s) => ({ events: [...s.events, copy] }))
        return copy.id
      },

      addVendor: (vendor) => set((s) => ({ vendors: [...s.vendors, vendor] })),
      updateVendor: (id, updates) =>
        set((s) => ({ vendors: s.vendors.map((v) => (v.id === id ? { ...v, ...updates } : v)) })),
      deleteVendor: (id) => set((s) => ({ vendors: s.vendors.filter((v) => v.id !== id) })),
      toggleVendorFavorite: (id) =>
        set((s) => ({
          vendors: s.vendors.map((v) => (v.id === id ? { ...v, favorite: !v.favorite } : v)),
        })),

      /**
       * Bulk-import vendors (e.g. from a CSV upload). Skips entries whose name
       * already exists (case-insensitive) so re-importing is safe. Returns
       * the count of newly added vendors.
       */
      importVendors: (newOnes) => {
        const existing = new Set(get().vendors.map((v) => v.name.toLowerCase()))
        const toAdd = newOnes.filter((v) => v.name && !existing.has(v.name.toLowerCase()))
        if (toAdd.length === 0) return 0
        set((s) => ({ vendors: [...s.vendors, ...toAdd] }))
        return toAdd.length
      },

      addConcept: (eventId, concept) =>
        set((s) => ({
          events: s.events.map((e) =>
            e.id === eventId ? { ...e, concepts: [...e.concepts, concept] } : e
          ),
        })),
      updateConceptStatus: (eventId, conceptId, status, comment) =>
        set((s) => ({
          events: s.events.map((e) =>
            e.id === eventId
              ? {
                  ...e,
                  concepts: e.concepts.map((c) =>
                    c.id === conceptId
                      ? { ...c, status: status as ConceptStatus, clientComment: comment ?? c.clientComment }
                      : c
                  ),
                }
              : e
          ),
        })),
      deleteConcept: (eventId, conceptId) =>
        set((s) => ({
          events: s.events.map((e) =>
            e.id === eventId
              ? { ...e, concepts: e.concepts.filter((c) => c.id !== conceptId) }
              : e
          ),
        })),

      toggleMilestone: (eventId, milestoneId) =>
        set((s) => ({
          events: s.events.map((e) =>
            e.id === eventId
              ? {
                  ...e,
                  milestones: e.milestones.map((m) =>
                    m.id === milestoneId ? { ...m, completed: !m.completed } : m
                  ),
                }
              : e
          ),
        })),

      shareConceptWithClient: (eventId, conceptId, shared) =>
        set((s) => ({
          events: s.events.map((e) =>
            e.id === eventId
              ? { ...e, concepts: e.concepts.map((c) => c.id === conceptId ? { ...c, sharedWithClient: shared } : c) }
              : e
          ),
        })),

      addMilestone: (eventId, milestone) =>
        set((s) => ({
          events: s.events.map((e) =>
            e.id === eventId ? { ...e, milestones: [...e.milestones, milestone] } : e
          ),
        })),

      updateMilestone: (eventId, milestoneId, updates) =>
        set((s) => ({
          events: s.events.map((e) =>
            e.id === eventId
              ? { ...e, milestones: e.milestones.map((m) => m.id === milestoneId ? { ...m, ...updates } : m) }
              : e
          ),
        })),

      deleteMilestone: (eventId, milestoneId) =>
        set((s) => ({
          events: s.events.map((e) =>
            e.id === eventId ? { ...e, milestones: e.milestones.filter((m) => m.id !== milestoneId) } : e
          ),
        })),

      // ─── Hierarchical checklist actions ─────────────────────────────────────
      setCeremonies: (eventId, ceremonies) =>
        set((s) => ({
          events: s.events.map((e) =>
            e.id === eventId ? { ...e, ceremonies, updatedAt: new Date().toISOString() } : e
          ),
        })),

      addCeremony: (eventId, ceremony) =>
        set((s) => ({
          events: s.events.map((e) =>
            e.id === eventId ? { ...e, ceremonies: [...e.ceremonies, ceremony], updatedAt: new Date().toISOString() } : e
          ),
        })),

      updateCeremony: (eventId, ceremonyId, updates) =>
        set((s) => ({
          events: mapCeremony(s.events, eventId, c =>
            c.id === ceremonyId ? { ...c, ...updates } : c
          ),
        })),

      deleteCeremony: (eventId, ceremonyId) =>
        set((s) => ({
          events: s.events.map((e) =>
            e.id === eventId ? { ...e, ceremonies: e.ceremonies.filter(c => c.id !== ceremonyId), updatedAt: new Date().toISOString() } : e
          ),
        })),

      addStage: (eventId, ceremonyId, sub) =>
        set((s) => ({
          events: mapCeremony(s.events, eventId, c =>
            c.id === ceremonyId ? { ...c, stages: [...c.stages, sub] } : c
          ),
        })),

      deleteStage: (eventId, ceremonyId, subId) =>
        set((s) => ({
          events: mapCeremony(s.events, eventId, c =>
            c.id === ceremonyId ? { ...c, stages: c.stages.filter(sub => sub.id !== subId) } : c
          ),
        })),

      addStageTask: (eventId, ceremonyId, subId, task) =>
        set((s) => ({
          events: mapCeremony(s.events, eventId, c =>
            c.id === ceremonyId ? {
              ...c,
              stages: c.stages.map(sub =>
                sub.id === subId ? { ...sub, tasks: [...sub.tasks, task] } : sub
              ),
            } : c
          ),
        })),

      toggleStageTask: (eventId, ceremonyId, subId, taskId) =>
        set((s) => ({
          events: mapCeremony(s.events, eventId, c =>
            c.id === ceremonyId ? {
              ...c,
              stages: c.stages.map(sub =>
                sub.id === subId ? {
                  ...sub,
                  tasks: sub.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t),
                } : sub
              ),
            } : c
          ),
        })),

      updateStageTask: (eventId, ceremonyId, subId, taskId, updates) =>
        set((s) => ({
          events: mapCeremony(s.events, eventId, c =>
            c.id === ceremonyId ? {
              ...c,
              stages: c.stages.map(sub =>
                sub.id === subId ? {
                  ...sub,
                  tasks: sub.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t),
                } : sub
              ),
            } : c
          ),
        })),

      deleteStageTask: (eventId, ceremonyId, subId, taskId) =>
        set((s) => ({
          events: mapCeremony(s.events, eventId, c =>
            c.id === ceremonyId ? {
              ...c,
              stages: c.stages.map(sub =>
                sub.id === subId ? { ...sub, tasks: sub.tasks.filter(t => t.id !== taskId) } : sub
              ),
            } : c
          ),
        })),

      // ─── Task drill-down actions ───────────────────────────────────────────
      setTaskPhase: (eventId, ceremonyId, subId, taskId, phase) =>
        set((s) => ({
          events: mapTask(s.events, eventId, ceremonyId, subId, taskId, t => ({ ...t, currentPhase: phase })),
        })),

      addTaskMessage: (eventId, ceremonyId, subId, taskId, message) =>
        set((s) => ({
          events: mapTask(s.events, eventId, ceremonyId, subId, taskId, t => ({
            ...t, messages: [...t.messages, message],
          })),
        })),

      updateTaskMessage: (eventId, ceremonyId, subId, taskId, messageId, updates) =>
        set((s) => ({
          events: mapTask(s.events, eventId, ceremonyId, subId, taskId, t => ({
            ...t,
            messages: t.messages.map(m => m.id === messageId ? { ...m, ...updates } : m),
          })),
        })),

      deleteTaskMessage: (eventId, ceremonyId, subId, taskId, messageId) =>
        set((s) => ({
          events: mapTask(s.events, eventId, ceremonyId, subId, taskId, t => ({
            ...t, messages: t.messages.filter(m => m.id !== messageId),
          })),
        })),

      addTaskOption: (eventId, ceremonyId, subId, taskId, option) =>
        set((s) => ({
          events: mapTask(s.events, eventId, ceremonyId, subId, taskId, t => ({
            ...t, options: [...t.options, option],
          })),
        })),

      updateTaskOption: (eventId, ceremonyId, subId, taskId, optionId, updates) =>
        set((s) => ({
          events: mapTask(s.events, eventId, ceremonyId, subId, taskId, t => ({
            ...t,
            options: t.options.map(o => o.id === optionId ? { ...o, ...updates } : o),
          })),
        })),

      deleteTaskOption: (eventId, ceremonyId, subId, taskId, optionId) =>
        set((s) => ({
          events: mapTask(s.events, eventId, ceremonyId, subId, taskId, t => ({
            ...t, options: t.options.filter(o => o.id !== optionId),
          })),
        })),
    }),
    {
      name: 'thalia-storage-v6',
      version: 6,
      onRehydrateStorage: () => (state) => {
        if (!state) return
        // Migrate task fields + deduplicate events (keep latest updatedAt per id)
        if (state.events) state.events = dedupeById(state.events.map(migrateEvent))
        // Deduplicate vendors (keep latest createdAt per id)
        if (state.vendors) state.vendors = dedupeById(state.vendors)
        // Always load accounts from the dedicated, version-independent key
        state.registeredPlanners = loadAccounts()
      },
      partialize: (state) => ({
        events: state.events,
        vendors: state.vendors,
        apiKey: state.apiKey,
        activeEventId: state.activeEventId,
        plannerProfile: state.plannerProfile,
        clientProfile: state.clientProfile,
        session: state.session,
        role: state.role,
        // registeredPlanners is NOT here — it lives in thalia-accounts (version-independent)
      }),
    }
  )
)

// Export task offsets so the wizard can render "decided 120 days before" hints
export { SUB_OFFSETS, offsetFor }
