import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  AppState, Event, Vendor, ConceptStatus, Role,
  PlannerProfile, ClientProfile, EventType,
  EventCeremony, EventSubCategory, SubCategoryTask, TaskMessage,
} from '../types'
import { offsetDate } from '../lib/utils'

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

// ─── Sub-category factory helpers ──────────────────────────────────────────────
function mkTask(label: string, off: number, ceremonyDate: string): SubCategoryTask {
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

function mkSub(name: string, emoji: string, taskLabels: string[], ceremonyDate: string): EventSubCategory {
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
function migrateTask(t: Partial<SubCategoryTask> & Pick<SubCategoryTask, 'id' | 'label'>): SubCategoryTask {
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

function migrateEvent(e: Event): Event {
  return {
    ...e,
    ceremonies: (e.ceremonies ?? []).map(c => ({
      ...c,
      subCategories: c.subCategories.map(sub => ({
        ...sub,
        tasks: sub.tasks.map(migrateTask),
      })),
    })),
  }
}

// Default sub-category sets for different ceremony "kinds"
function weddingCeremonySubs(date: string): EventSubCategory[] {
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

function lightCeremonySubs(date: string): EventSubCategory[] {
  // smaller ceremonies (Roka, Haldi) need fewer sub-categories
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

function birthdaySubs(date: string): EventSubCategory[] {
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

function corporateSubs(date: string): EventSubCategory[] {
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

function galaSubs(date: string): EventSubCategory[] {
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

function genericSubs(date: string): EventSubCategory[] {
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
  const mk = (name: string, emoji: string, offsetDays: number, subs: EventSubCategory[]): EventCeremony => ({
    id: uid(),
    name,
    emoji,
    offsetDaysFromEvent: offsetDays,
    date: offsetDate(eventDate, offsetDays),
    notes: '',
    subCategories: subs,
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

const SAMPLE_VENDORS: Vendor[] = [
  {
    id: 'v1', name: 'Bloom & Petal Florals', category: 'florals',
    contact: 'Sarah Chen', email: 'sarah@bloomandpetal.com', phone: '+1 555-0101',
    priceRange: '$800–$3,000', rating: 5, tags: ['luxury', 'garden', 'romantic'],
    notes: 'Specializes in garden-style arrangements. Books 6 months out.', createdAt: new Date().toISOString(),
  },
  {
    id: 'v2', name: 'Golden Frame Photography', category: 'photography',
    contact: 'Marcus Lee', email: 'marcus@goldenframe.com', phone: '+1 555-0202',
    priceRange: '$2,500–$6,000', rating: 5, tags: ['editorial', 'candid', 'luxury'],
    notes: 'Award-winning. Candid style. Requires 50% deposit on booking.', createdAt: new Date().toISOString(),
  },
  {
    id: 'v3', name: 'Saveur Catering Co.', category: 'catering',
    contact: 'Elena Russo', email: 'elena@saveur.com', phone: '+1 555-0303',
    priceRange: '$85–$150 per head', rating: 4, tags: ['farm-to-table', 'vegan-friendly', 'plated'],
    notes: 'Excellent vegan options. Provides servers and bartenders.', createdAt: new Date().toISOString(),
  },
  {
    id: 'v4', name: 'Luminary Lighting & Decor', category: 'lighting',
    contact: 'James Park', email: 'james@luminecor.com', phone: '+1 555-0404',
    priceRange: '$1,200–$5,000', rating: 4, tags: ['fairy-lights', 'uplighting', 'marquee'],
    notes: 'Great for outdoor and tented events. Setup crew included.', createdAt: new Date().toISOString(),
  },
]

const E1_DATE = '2026-09-14'
const E2_DATE = '2026-11-08'

// Sample seeded conversation that shows what the task drill-down looks like
// once a planner has been actively working through a decision with a client.
function seedVenueConversation(): { messages: TaskMessage[]; phase: SubCategoryTask['currentPhase'] } {
  const dayMs = 1000 * 60 * 60 * 24
  const now = Date.now()
  return {
    phase: 'client-review',
    messages: [
      {
        id: uid(),
        author: 'client',
        authorName: 'Aisha',
        channel: 'whatsapp',
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
    const venue = wedding.subCategories.find(s => s.name === 'Venue & Logistics')
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
    const photo = wedding.subCategories.find(s => s.name === 'Photography & Video')
    if (photo) {
      photo.tasks[0].completed = true
      photo.tasks[1].completed = true
    }
    const food = wedding.subCategories.find(s => s.name === 'Catering & Food')
    if (food) food.tasks[0].completed = true
  }
  const mehendi = ceremonies.find(c => c.name === 'Mehendi')
  if (mehendi) {
    const beauty = mehendi.subCategories.find(s => s.name === 'Beauty & Grooming')
    if (beauty) beauty.tasks[0].completed = true
  }
  return ceremonies
}

function seedGala(date: string): EventCeremony[] {
  const ceremonies = getDefaultCeremonies('gala', date)
  const main = ceremonies[0]
  if (main) {
    main.subCategories[0].tasks[0].completed = true
    main.subCategories[2].tasks[0].completed = true
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
  fn: (t: SubCategoryTask) => SubCategoryTask
): Event[] {
  return mapCeremony(events, eventId, c =>
    c.id === ceremonyId
      ? {
          ...c,
          subCategories: c.subCategories.map(sub =>
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
    (set) => ({
      role: 'planner',
      activeEventId: 'e1',
      events: SAMPLE_EVENTS,
      vendors: SAMPLE_VENDORS,
      isGenerating: false,
      apiKey: '',
      plannerProfile: DEFAULT_PLANNER_PROFILE,
      clientProfile: DEFAULT_CLIENT_PROFILE,

      setRole: (role: Role) => set({ role }),
      setApiKey: (apiKey: string) => set({ apiKey }),
      setPlannerProfile: (updates) =>
        set((s) => ({ plannerProfile: { ...s.plannerProfile, ...updates } })),
      setClientProfile: (updates) =>
        set((s) => ({ clientProfile: { ...s.clientProfile, ...updates } })),
      setActiveEvent: (id) => set({ activeEventId: id }),
      setIsGenerating: (v) => set({ isGenerating: v }),

      addEvent: (event) => set((s) => ({ events: [...s.events, event] })),
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

      addVendor: (vendor) => set((s) => ({ vendors: [...s.vendors, vendor] })),
      updateVendor: (id, updates) =>
        set((s) => ({ vendors: s.vendors.map((v) => (v.id === id ? { ...v, ...updates } : v)) })),
      deleteVendor: (id) => set((s) => ({ vendors: s.vendors.filter((v) => v.id !== id) })),

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

      addSubCategory: (eventId, ceremonyId, sub) =>
        set((s) => ({
          events: mapCeremony(s.events, eventId, c =>
            c.id === ceremonyId ? { ...c, subCategories: [...c.subCategories, sub] } : c
          ),
        })),

      deleteSubCategory: (eventId, ceremonyId, subId) =>
        set((s) => ({
          events: mapCeremony(s.events, eventId, c =>
            c.id === ceremonyId ? { ...c, subCategories: c.subCategories.filter(sub => sub.id !== subId) } : c
          ),
        })),

      addSubCategoryTask: (eventId, ceremonyId, subId, task) =>
        set((s) => ({
          events: mapCeremony(s.events, eventId, c =>
            c.id === ceremonyId ? {
              ...c,
              subCategories: c.subCategories.map(sub =>
                sub.id === subId ? { ...sub, tasks: [...sub.tasks, task] } : sub
              ),
            } : c
          ),
        })),

      toggleSubCategoryTask: (eventId, ceremonyId, subId, taskId) =>
        set((s) => ({
          events: mapCeremony(s.events, eventId, c =>
            c.id === ceremonyId ? {
              ...c,
              subCategories: c.subCategories.map(sub =>
                sub.id === subId ? {
                  ...sub,
                  tasks: sub.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t),
                } : sub
              ),
            } : c
          ),
        })),

      updateSubCategoryTask: (eventId, ceremonyId, subId, taskId, updates) =>
        set((s) => ({
          events: mapCeremony(s.events, eventId, c =>
            c.id === ceremonyId ? {
              ...c,
              subCategories: c.subCategories.map(sub =>
                sub.id === subId ? {
                  ...sub,
                  tasks: sub.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t),
                } : sub
              ),
            } : c
          ),
        })),

      deleteSubCategoryTask: (eventId, ceremonyId, subId, taskId) =>
        set((s) => ({
          events: mapCeremony(s.events, eventId, c =>
            c.id === ceremonyId ? {
              ...c,
              subCategories: c.subCategories.map(sub =>
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
      name: 'thalia-storage-v5',
      version: 5,
      onRehydrateStorage: () => (state) => {
        // Backfill new task-level fields (currentPhase, messages, options)
        // for users upgrading from older schema versions.
        if (state?.events) state.events = state.events.map(migrateEvent)
      },
      partialize: (state) => ({
        events: state.events,
        vendors: state.vendors,
        apiKey: state.apiKey,
        activeEventId: state.activeEventId,
        plannerProfile: state.plannerProfile,
        clientProfile: state.clientProfile,
      }),
    }
  )
)

// Export task offsets so the wizard can render "decided 120 days before" hints
export { SUB_OFFSETS, offsetFor }
