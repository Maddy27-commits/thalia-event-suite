// ─── Roles ───────────────────────────────────────────────────────────────────
export type Role = 'planner' | 'client' | 'vendor'

// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface AuthSession {
  role: Role
  displayName: string
  email: string
  /** For clients: the event ID they are locked to */
  clientEventId?: string
  /** For vendors: their vendor record id (matched by email at sign-in). */
  vendorId?: string
  /** Planner previewing the client portal for a specific event */
  isPlannerPreview: boolean
  /** ID of the event being previewed (planner preview mode) */
  previewEventId?: string
}

export interface RegisteredPlanner {
  name: string
  businessName: string
  email: string
  /** PBKDF2-SHA-256 hex digest. Legacy accounts may still hold plaintext until next login. */
  passwordHash: string
  /** Hex salt paired with passwordHash. Empty string for un-migrated legacy accounts. */
  passwordSalt: string
  createdAt: string
}

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

/** Geographic region a vendor primarily serves. */
export type VendorRegion =
  | 'North America'
  | 'Europe'
  | 'UK & Ireland'
  | 'India & South Asia'
  | 'Middle East'
  | 'Asia Pacific'
  | 'Australia & NZ'
  | 'Other'

/** Type of event a vendor specialises in (used as a soft filter). */
export type VendorSpecialty =
  | 'wedding'
  | 'corporate'
  | 'birthday'
  | 'anniversary'
  | 'gala'
  | 'conference'
  | 'graduation'
  | 'general'

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
  /** Optional — vendor's primary region of service. */
  region?: VendorRegion
  /** Optional — event types this vendor specialises in. */
  specialties?: VendorSpecialty[]
  /** Star a vendor to pin it to the top of the directory. */
  favorite?: boolean
  /** Optional — URL to a hero image (planner pastes a link; no upload yet). */
  imageUrl?: string
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
  /** Email of the planner who owns this event — used to scope data per planner account. */
  plannerEmail?: string
  /** 6-digit code the client must enter alongside their email to access the portal.
   *  Generated when the event is created; planner shares it with the client out-of-band. */
  accessCode?: string
  /** Per-event chat threads with assigned vendors. Only vendors in vendorIds
   *  are eligible to participate; the planner adds messages on their behalf. */
  vendorMessages?: VendorChatMessage[]
}

/**
 * One message in the event-level vendor coordination chat. Threaded by vendorId
 * — each vendor effectively gets their own conversation scoped to the event,
 * separate from per-task discussions in the TaskDrawer.
 */
export interface VendorChatMessage {
  id: string
  /** Which vendor this conversation belongs to. Must be in event.vendorIds. */
  vendorId: string
  /** Who sent the message. Vendors don't have accounts yet — the planner
   *  enters vendor messages manually on their behalf. */
  author: 'planner' | 'vendor'
  content: string
  timestamp: string
}

// ─── Hierarchical checklist (3 levels) ───────────────────────────────────────
// Event → Ceremony[] → Stage[] → StageTask[]

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

/** A single actionable task within a stage. */
export interface StageTask {
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

/** A stage within a ceremony — Decor, Food, Outfits, etc. */
export interface EventStage {
  id: string
  name: string
  emoji: string
  /** Suggested lead-time for this whole stage (used as default for new tasks). */
  defaultOffsetDays: number
  tasks: StageTask[]
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
  stages: EventStage[]
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
/** Planner's email notification preferences. None of these wire to real
 *  delivery yet — the UI lets the planner state their intent. */
/**
 * In-portal notification surfaced through the header bell. Multi-recipient by
 * design — `recipientEmail` is the lookup key. A planner sending a concept
 * reminder writes a notification addressed to the client's email; the same
 * notification appears in the client's bell next time they sign in.
 */
export interface Notification {
  id: string
  recipientEmail: string
  eventId: string
  kind: 'concept-reminder' | 'milestone-due' | 'planner-message' | 'vendor-message' | 'general'
  title: string
  body: string
  /** Optional in-app deep link, e.g. "/client/concepts". */
  link?: string
  read: boolean
  createdAt: string
}

export interface NotificationPrefs {
  /** When a client approves / declines / requests changes on a concept. */
  conceptDecisions: boolean
  /** When a client posts a new in-app chat message on any task. */
  newClientMessages: boolean
  /** Weekly digest of upcoming milestones. */
  weeklyDigest: boolean
  /** When a milestone goes overdue. */
  overdueMilestones: boolean
}

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
  /** Soft segmentation — used to bias event templates / AI prompts. */
  businessFocus?: string
  notificationPrefs?: NotificationPrefs
}

export interface ClientProfile {
  name: string
  whatsappNumber: string
  email: string
}

// ─── App State ────────────────────────────────────────────────────────────────
export interface AppState {
  role: Role
  session: AuthSession | null
  registeredPlanners: RegisteredPlanner[]
  activeEventId: string | null
  events: Event[]
  vendors: Vendor[]
  isGenerating: boolean
  apiKey: string
  plannerProfile: PlannerProfile
  clientProfile: ClientProfile
  notifications: Notification[]

  // Role
  setRole: (role: Role) => void

  // Auth
  login: (session: AuthSession) => void
  logout: () => void
  registerPlanner: (data: { name: string; businessName: string; email: string; password: string }) => Promise<'ok' | 'email_taken'>
  verifyPlannerPassword: (email: string, password: string) => Promise<boolean>
  enterPreviewMode: (eventId: string, clientName: string, clientEmail: string) => void
  exitPreviewMode: () => void

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
  duplicateEvent: (id: string) => string | null

  // Event-level vendor chat
  addVendorMessage: (eventId: string, msg: VendorChatMessage) => void
  deleteVendorMessage: (eventId: string, msgId: string) => void

  // Notifications
  addNotification: (n: Notification) => void
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: (recipientEmail: string) => void
  dismissNotification: (id: string) => void

  // Vendors
  addVendor: (vendor: Vendor) => void
  updateVendor: (id: string, updates: Partial<Vendor>) => void
  deleteVendor: (id: string) => void
  toggleVendorFavorite: (id: string) => void
  importVendors: (vendors: Vendor[]) => number

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

  // Hierarchical checklist (Event → Ceremony → Stage → Task)
  setCeremonies: (eventId: string, ceremonies: EventCeremony[]) => void
  addCeremony: (eventId: string, ceremony: EventCeremony) => void
  updateCeremony: (eventId: string, ceremonyId: string, updates: Partial<EventCeremony>) => void
  deleteCeremony: (eventId: string, ceremonyId: string) => void

  addStage: (eventId: string, ceremonyId: string, sub: EventStage) => void
  deleteStage: (eventId: string, ceremonyId: string, subId: string) => void

  addStageTask: (eventId: string, ceremonyId: string, subId: string, task: StageTask) => void
  toggleStageTask: (eventId: string, ceremonyId: string, subId: string, taskId: string) => void
  updateStageTask: (eventId: string, ceremonyId: string, subId: string, taskId: string, updates: Partial<StageTask>) => void
  deleteStageTask: (eventId: string, ceremonyId: string, subId: string, taskId: string) => void

  // Task drill-down: phase, conversation thread, options/recommendations
  setTaskPhase: (eventId: string, ceremonyId: string, subId: string, taskId: string, phase: TaskPhase) => void
  addTaskMessage: (eventId: string, ceremonyId: string, subId: string, taskId: string, message: TaskMessage) => void
  updateTaskMessage: (eventId: string, ceremonyId: string, subId: string, taskId: string, messageId: string, updates: Partial<TaskMessage>) => void
  deleteTaskMessage: (eventId: string, ceremonyId: string, subId: string, taskId: string, messageId: string) => void
  addTaskOption: (eventId: string, ceremonyId: string, subId: string, taskId: string, option: TaskOption) => void
  updateTaskOption: (eventId: string, ceremonyId: string, subId: string, taskId: string, optionId: string, updates: Partial<TaskOption>) => void
  deleteTaskOption: (eventId: string, ceremonyId: string, subId: string, taskId: string, optionId: string) => void
}
