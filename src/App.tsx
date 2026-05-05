import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { X, Eye } from 'lucide-react'
import { useStore } from './store'
import { Header } from './components/layout/Header'
import { Sidebar } from './components/layout/Sidebar'

// Auth pages
import { LandingPage } from './pages/auth/LandingPage'
import { PlannerAuthPage } from './pages/auth/PlannerAuthPage'
import { ClientAuthPage } from './pages/auth/ClientAuthPage'

// Planner pages
import { PlannerDashboard } from './pages/planner/PlannerDashboard'
import { EventsPage } from './pages/planner/EventsPage'
import { VendorsPage } from './pages/planner/VendorsPage'
import { ClientsPage } from './pages/planner/ClientsPage'
import { AIGeneratorPage } from './pages/planner/AIGeneratorPage'

// Client pages
import { ClientDashboard } from './pages/client/ClientDashboard'
import { ConceptsPage } from './pages/client/ConceptsPage'
import { ApprovalsPage } from './pages/client/ApprovalsPage'
import { ProgressPage } from './pages/client/ProgressPage'

// Settings
import { SettingsPage } from './pages/settings/SettingsPage'

// Legal
import { PrivacyPage } from './pages/legal/PrivacyPage'
import { TermsPage } from './pages/legal/TermsPage'

// ── Preview mode banner ───────────────────────────────────────────────────────
function PreviewBanner() {
  const { session, exitPreviewMode, events } = useStore()
  const navigate = useNavigate()

  const eventName = session?.previewEventId
    ? (events.find((e) => e.id === session.previewEventId)?.name ?? 'event')
    : 'event'

  if (!session?.isPlannerPreview) return null

  return (
    <div className="shrink-0 bg-plum-600 text-white px-4 py-2 flex items-center justify-between gap-4 text-xs font-semibold">
      <div className="flex items-center gap-2">
        <Eye size={13} className="text-plum-300" />
        <span>Previewing client view</span>
        <span className="text-plum-300">·</span>
        <span className="text-plum-200 font-medium truncate max-w-[160px]">{eventName}</span>
      </div>
      <button
        onClick={() => { exitPreviewMode(); navigate('/planner', { replace: true }) }}
        className="flex items-center gap-1 text-plum-200 hover:text-white transition-colors shrink-0"
      >
        <X size={12} />
        Exit preview
      </button>
    </div>
  )
}

// ── App shell (sidebar + header + content) ───────────────────────────────────
function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSidebarOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <div className="flex h-dvh bg-ivory overflow-hidden">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar — always visible on desktop, slide-in drawer on mobile */}
      <div className={`
        fixed inset-y-0 left-0 z-30 md:relative md:block
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 w-full overflow-hidden">
        <PreviewBanner />
        <Header onMenuClick={() => setSidebarOpen(v => !v)} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

// ── Protected routes ──────────────────────────────────────────────────────────
function ProtectedPlanner({ children }: { children: React.ReactNode }) {
  const { session } = useStore()
  if (!session) return <Navigate to="/" replace />
  if (session.isPlannerPreview || session.role === 'client') return <Navigate to="/client" replace />
  return <>{children}</>
}

function ProtectedClient({ children }: { children: React.ReactNode }) {
  const { session } = useStore()
  if (!session) return <Navigate to="/" replace />
  if (session.role === 'planner' && !session.isPlannerPreview) return <Navigate to="/planner" replace />
  return <>{children}</>
}

// ── Root redirect ─────────────────────────────────────────────────────────────
function RootRedirect() {
  const { session } = useStore()
  if (!session) return <Navigate to="/welcome" replace />
  if (session.role === 'planner' && !session.isPlannerPreview) return <Navigate to="/planner" replace />
  return <Navigate to="/client" replace />
}

// ── Main app ──────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth / public routes (no shell) */}
        <Route path="/welcome"        element={<LandingPage />} />
        <Route path="/auth/planner"   element={<PlannerAuthPage />} />
        <Route path="/auth/client"    element={<ClientAuthPage />} />
        <Route path="/privacy"        element={<PrivacyPage />} />
        <Route path="/terms"          element={<TermsPage />} />

        {/* Protected app routes (with shell) */}
        <Route
          path="/planner"
          element={
            <ProtectedPlanner>
              <AppShell><PlannerDashboard /></AppShell>
            </ProtectedPlanner>
          }
        />
        <Route
          path="/planner/events"
          element={
            <ProtectedPlanner>
              <AppShell><EventsPage /></AppShell>
            </ProtectedPlanner>
          }
        />
        <Route
          path="/planner/vendors"
          element={
            <ProtectedPlanner>
              <AppShell><VendorsPage /></AppShell>
            </ProtectedPlanner>
          }
        />
        <Route
          path="/planner/clients"
          element={
            <ProtectedPlanner>
              <AppShell><ClientsPage /></AppShell>
            </ProtectedPlanner>
          }
        />
        <Route
          path="/planner/ai-generator"
          element={
            <ProtectedPlanner>
              <AppShell><AIGeneratorPage /></AppShell>
            </ProtectedPlanner>
          }
        />
        <Route
          path="/planner/settings"
          element={
            <ProtectedPlanner>
              <AppShell><SettingsPage /></AppShell>
            </ProtectedPlanner>
          }
        />

        <Route
          path="/client"
          element={
            <ProtectedClient>
              <AppShell><ClientDashboard /></AppShell>
            </ProtectedClient>
          }
        />
        <Route
          path="/client/concepts"
          element={
            <ProtectedClient>
              <AppShell><ConceptsPage /></AppShell>
            </ProtectedClient>
          }
        />
        <Route
          path="/client/approvals"
          element={
            <ProtectedClient>
              <AppShell><ApprovalsPage /></AppShell>
            </ProtectedClient>
          }
        />
        <Route
          path="/client/progress"
          element={
            <ProtectedClient>
              <AppShell><ProgressPage /></AppShell>
            </ProtectedClient>
          }
        />
        <Route
          path="/client/settings"
          element={
            <ProtectedClient>
              <AppShell><SettingsPage /></AppShell>
            </ProtectedClient>
          }
        />

        {/* Root + catch-all */}
        <Route path="/"  element={<RootRedirect />} />
        <Route path="*"  element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
