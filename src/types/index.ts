// ─── Roles ───────────────────────────────────────────────────────────────────
export type Role = 'planner' | 'client'

// ─── Vendor ──────────────────────────────────────────────────────────────────
export type VendorCategory =
  | 'venue'
  | 'catering'
  | 'photography'
  | 'videography'
  | 'florals'
  | 'music'
  | 'decor'
  | 'transportation'
  | 'lighting'
  | 'other'

export interface Vendor {
  id: string
  name: string
  category: VendorCategory
  contact: string
  email: string
  phone: string
  priceRange: string
  rating: number
  notes: string
  tags: string[]
  createdAt: string
}

// ─── Client Preferences ──────────────────────────────────────────────────────
export interface ClientPreferences {
  style: string[]
  colorPalette: string[]
  dietary: string[]
  musicGenre: string[]
  dislikes: string[]
  notes: string
}

// ─── Event ───────────────────────────────────────────────────────────────────
export type EventType =
  | 'wedding'
  | 'corporate'
  | 'birthday'
  | 'anniversary'
  | 'graduation'
  | 'gala'
  | 'conference'
  | 'other'

export type EventStatus = 'draft' | 'planning' | 'confirmed' | 'completed' | 'cancelled'

export interface EventMilestone {
  id: string
  label: string
  dueDate: string
  completed: boolean
  notes: string
}

export interface Event {
  id: string
  name: string
  clientName: string
  clientEmail: string
  clientPhone: string
  type: EventType
  status: EventStatus
  date: string
  venue: string
  location: string
  guestCount: number
  budget: number
  theme: string
  preferences: ClientPreferences
  milestones: EventMilestone[]
  /** Top-level phases of the event (e.g. wedding ceremonies, conference days). */
  ceremonies: EventCeremony[]
  vendorIds: string[]
  concepts: EventConcept[]
  createdAt: string
  updatedAt: string
}

// ─── Hierarchical checklist (3 levels) ───────────────────────────────────────
// Event → Ceremony[] → SubCategory[] → SubCategoryTask[]

// ─── Task drill-down: phases, conversation, recommendations ──────────────────
/**
 * Real planning is a back-and-forth, not a checkbox. Every task moves through
 * these phases — exactly the way an event manager actually works.
 */
export type TaskPhase = 'briefing' | 'recommendations' | 'client-review' | 'revisions' | 'final'

export const TASK_PHASES: { id: TaskPhase; label: string; description: string }[] = [
  { id: 'briefing',         label: 'Briefing',          description: 'Capture client preferences & constraints' },
  { id: 'recommendations',  label: 'Recommendations',   description: 'Shortlist vendors / options to present'   },
  { id: 'client-review',    label: 'Client Review',     description: 'Client sees options and reacts'            },
  { id: 'revisions',        label: 'Revisions',         description: 'Refine based on client feedback'           },
  { id: 'final',            label: 'Final',             description: 'Locked-in decision & confirmation'         },
]

export type MessageChannel = 'whatsapp' | 'email' | 'sms' | 'in-app' | 'note'
export type MessageAuthor  = 'planner' | 'client' | 'ai' | 'vendor'

/** Structured insights AI extracts from a natural-language message. */
export interface TaskInsight {
  preferences: string[]
  concerns: string[]
  decisions: string[]
  sentiment: 'positive' | 'neutral' | 'negative'
}

/**
 * A single message in a task's discussion thread. Can come from any channel:
 * WhatsApp, email, SMS, in-app chat, or a private planner note.
 */
export interface TaskMessage {
  id: string
  author: MessageAuthor
  authorName?: string
  channel: MessageChannel
  content: string
  /** ISO timestamp */
  timestamp: string
  /** Which task phase this message belongs to */
  phase: TaskPhase
  /** AI-extracted structured insights, if processed */
  insight?: TaskInsight
}

export type OptionStatus = 'proposed' | 'shortlisted' | 'rejected' | 'selected'

/** A specific recommendation/option being considered for a task (vendor, dish, mood-board, etc.). */
export interface TaskOption {
  id: string
  title: string
  description: string
  estimatedCost: string
  pros: string[]
  cons: string[]
  status: OptionStatus
  /** Optional link to a Vendor record. */
  vendorId?: string
  createdAt: string
}

/** A single actionable task within a sub-category. */
export interface SubCategoryTask {
  id: string
  label: string
  completed: boolean
  notes: string
  /** Days BEFORE the parent ceremony date when this task should be done. */
  offsetDays: number
  /** Pre-filled ISO YYYY-MM-DD due date — editable by the planner. */
  dueDate: string
  /** Current decision phase the task is in. */
  currentPhase: TaskPhase
  /** Threaded conversation across channels. */
  messages: TaskMessage[]
  /** Recommendation cards / vendor options being considered. */
  options: TaskOption[]
}

/** A sub-category within a ceremony — Decor, Food, Outfits, etc. */
export interface EventSubCategory {
  id: string
  name: string
  emoji: string
  /** Suggested lead-time for this whole sub-category (used as default for new tasks). */
  defaultOffsetDays: number
  tasks: SubCategoryTask[]
}

/**
 * A top-level phase of the event. For weddings these are ceremonies
 * (Mehendi, Sangeet, Wedding, Reception). For corporate / conferences these
 * may be sessions or days. For a single-event format (birthday) there's just one.
 */
export interface EventCeremony {
  id: string
  name: string
  emoji: string
  /** ISO YYYY-MM-DD — tentative date for this ceremony. */
  date: string
  /** Days OFFSET from the main event.date. 0 = same day; -1 = day before. */
  offsetDaysFromEvent: number
  notes: string
  subCategories: EventSubCategory[]
}

// ─── AI Concepts ─────────────────────────────────────────────────────────────
export type ConceptStatus = 'pending' | 'approved' | 'rejected' | 'revised'

export interface DecorItem {
  name: string
  description: string
  estimatedCost: string
}

export interface EventConcept {
  id: string
  eventId: string
  title: string
  tagline: string
  theme: string
  colorPalette: string[]
  mood: string
  venueDescription: string
  decorItems: DecorItem[]
  cateringNotes: string
  entertainmentNotes: string
  estimatedBudget: string
  status: ConceptStatus
  clientComment: string
  plannerNotes: string
  coverGradient: string
  images: string[]
  generatedAt: string
  sharedWithClient: boolean
}

// ─── AI Generator Input ───────────────────────────────────────────────────────
export interface ConceptGeneratorInput {
  eventType: EventType
  budget: number
  location: string
  theme: string
  guestCount: number
  style: string[]
  colorPreferences: string[]
  dietary: string[]
  additionalNotes: string
}

// ─── User Profiles ────────────────────────────────────────────────────────────
export interface PlannerProfile {
  name: string
  businessName: string
  title: string
  whatsappNumber: string
  email: string
  avatarColor: string
  emailjsServiceId: string
  emailjsTemplateId: string
  emailjsPublicKey: string
}

export interface ClientProfile {
  name: string
  whatsappNumber: string
  email: string
}

// ─── App State ────────────────────────────────────────────────────────────────
export interface AppState {
  role: Role
  activeEventId: string | null
  events: Event[]
  vendors: Vendor[]
  isGenerating: boolean
  apiKey: string
  plannerProfile: PlannerProfile
  clientProfile: ClientProfile

  // Role
  setRole: (role: Role) => void

  // API Key
  setApiKey: (key: string) => void

  // Profiles
  setPlannerProfile: (updates: Partial<PlannerProfile>) => void
  setClientProfile: (updates: Partial<ClientProfile>) => void

  // Events
  setActiveEvent: (id: string | null) => void
  addEvent: (event: Event) => void
  updateEvent: (id: string, updates: Partial<Event>) => void
  deleteEvent: (id: string) => void

  // Vendors
  addVendor: (vendor: Vendor) => void
  updateVendor: (id: string, updates: Partial<Vendor>) => void
  deleteVendor: (id: string) => void

  // Concepts
  addConcept: (eventId: string, concept: EventConcept) => void
  updateConceptStatus: (eventId: string, conceptId: string, status: ConceptStatus, comment?: string) => void
  deleteConcept: (eventId: string, conceptId: string) => void

  // Milestones
  toggleMilestone: (eventId: string, milestoneId: string) => void

  // AI
  setIsGenerating: (v: boolean) => void
  shareConceptWithClient: (eventId: string, conceptId: string, shared: boolean) => void
  addMilestone: (eventId: string, milestone: EventMilestone) => void
  updateMilestone: (eventId: string, milestoneId: string, updates: Partial<EventMilestone>) => void
  deleteMilestone: (eventId: string, milestoneId: string) => void

  // Hierarchical checklist (Event → Ceremony → SubCategory → Task)
  setCeremonies: (eventId: string, ceremonies: EventCeremony[]) => void
  addCeremony: (eventId: string, ceremony: EventCeremony) => void
  updateCeremony: (eventId: string, ceremonyId: string, updates: Partial<EventCeremony>) => void
  deleteCeremony: (eventId: string, ceremonyId: string) => void

  addSubCategory: (eventId: string, ceremonyId: string, sub: EventSubCategory) => void
  deleteSubCategory: (eventId: string, ceremonyId: string, subId: string) => void

  addSubCategoryTask: (eventId: string, ceremonyId: string, subId: string, task: SubCategoryTask) => void
  toggleSubCategoryTask: (eventId: string, ceremonyId: string, subId: string, taskId: string) => void
  updateSubCategoryTask: (eventId: string, ceremonyId: string, subId: string, taskId: string, updates: Partial<SubCategoryTask>) => void
  deleteSubCategoryTask: (eventId: string, ceremonyId: string, subId: string, taskId: string) => void

  // Task drill-down: phase, conversation thread, options/recommendations
  setTaskPhase: (eventId: string, ceremonyId: string, subId: string, taskId: string, phase: TaskPhase) => void
  addTaskMessage: (eventId: string, ceremonyId: string, subId: string, taskId: string, message: TaskMessage) => void
  updateTaskMessage: (eventId: string, ceremonyId: string, subId: string, taskId: string, messageId: string, updates: Partial<TaskMessage>) => void
  deleteTaskMessage: (eventId: string, ceremonyId: string, subId: string, taskId: string, messageId: string) => void
  addTaskOption: (eventId: string, ceremonyId: string, subId: string, taskId: string, option: TaskOption) => void
  updateTaskOption: (eventId: string, ceremonyId: string, subId: string, taskId: string, optionId: string, updates: Partial<TaskOption>) => void
  deleteTaskOption: (eventId: string, ceremonyId: string, subId: string, taskId: string, optionId: string) => void
}
