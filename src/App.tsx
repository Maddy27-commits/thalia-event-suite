import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useStore } from './store'
import { Header } from './components/layout/Header'
import { Sidebar } from './components/layout/Sidebar'

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
      <div className="flex flex-col flex-1 min-w-0 w-full">
        <Header onMenuClick={() => setSidebarOpen(v => !v)} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

export default function App() {
  const { role } = useStore()

  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          {/* Root redirect based on role */}
          <Route
            path="/"
            element={<Navigate to={role === 'planner' ? '/planner' : '/client'} replace />}
          />

          {/* Planner routes */}
          <Route path="/planner"               element={<PlannerDashboard />} />
          <Route path="/planner/events"        element={<EventsPage />} />
          <Route path="/planner/vendors"       element={<VendorsPage />} />
          <Route path="/planner/clients"       element={<ClientsPage />} />
          <Route path="/planner/ai-generator"  element={<AIGeneratorPage />} />

          {/* Client routes */}
          <Route path="/client"                element={<ClientDashboard />} />
          <Route path="/client/concepts"       element={<ConceptsPage />} />
          <Route path="/client/approvals"      element={<ApprovalsPage />} />
          <Route path="/client/progress"       element={<ProgressPage />} />
          <Route path="/client/settings"       element={<SettingsPage />} />

          {/* Planner settings */}
          <Route path="/planner/settings"      element={<SettingsPage />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  )
}
