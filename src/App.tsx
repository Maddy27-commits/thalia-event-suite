import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
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
  return (
    <div className="flex h-screen bg-ivory overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <Header />
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
          <Route path="/planner" element={<PlannerDashboard />} />
          <Route path="/planner/events" element={<EventsPage />} />
          <Route path="/planner/vendors" element={<VendorsPage />} />
          <Route path="/planner/clients" element={<ClientsPage />} />
          <Route path="/planner/ai-generator" element={<AIGeneratorPage />} />

          {/* Client routes */}
          <Route path="/client" element={<ClientDashboard />} />
          <Route path="/client/concepts" element={<ConceptsPage />} />
          <Route path="/client/approvals" element={<ApprovalsPage />} />
          <Route path="/client/progress" element={<ProgressPage />} />
          <Route path="/client/settings" element={<SettingsPage />} />

          {/* Planner settings */}
          <Route path="/planner/settings" element={<SettingsPage />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  )
}
