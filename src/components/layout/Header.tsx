import { Bell, ChevronDown, Menu, LogOut } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useStore } from '../../store'

interface HeaderProps {
  onMenuClick?: () => void
}

// Maps routes to human-readable page titles (mobile breadcrumb)
const PAGE_TITLES: Record<string, string> = {
  '/planner':               'Dashboard',
  '/planner/events':        'Events',
  '/planner/vendors':       'Vendors',
  '/planner/clients':       'Clients',
  '/planner/ai-generator':  'AI Generator',
  '/planner/settings':      'Settings',
  '/client':                'My Event',
  '/client/concepts':       'Design Concepts',
  '/client/approvals':      'Approvals',
  '/client/progress':       'Progress',
  '/client/settings':       'Settings',
}

export function Header({ onMenuClick }: HeaderProps) {
  const { role, session, logout } = useStore()
  const location  = useLocation()
  const navigate  = useNavigate()
  const isPlanner = role === 'planner'

  const pageTitle = PAGE_TITLES[location.pathname] ?? 'Thalia'

  // Display name from session
  const displayName = session?.displayName ?? ''
  const initials    = displayName
    .trim().split(/\s+/).filter(Boolean).slice(0, 2)
    .map(s => s[0]?.toUpperCase()).join('')
    || (isPlanner ? 'P' : 'C')

  const avatarGradient = isPlanner
    ? 'from-brand-400 to-brand-600'
    : 'from-sage-400 to-sage-600'

  const handleLogout = () => {
    logout()
    navigate('/welcome', { replace: true })
  }

  return (
    <header className="h-14 bg-white/80 backdrop-blur-md border-b border-stone-200/60 flex items-center justify-between px-4 sm:px-6 shrink-0 sticky top-0 z-10">

      {/* Left: hamburger (mobile) + role indicator (desktop) */}
      <div className="flex items-center gap-3">
        {/* Hamburger — only visible on mobile */}
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 -ml-1 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          aria-label="Open menu"
        >
          <Menu size={18} />
        </button>

        {/* Desktop: role indicator */}
        <div className="hidden md:flex items-center gap-2.5">
          <div className={`w-2 h-2 rounded-full ${isPlanner ? 'bg-brand-500' : 'bg-sage-500'}`} />
          <span className="text-sm font-medium text-stone-500">
            {isPlanner ? 'Planner Suite' : 'Client Portal'}
          </span>
        </div>

        {/* Mobile: current page title */}
        <span className="md:hidden text-sm font-semibold text-stone-800">{pageTitle}</span>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Notification bell */}
        <button
          className="relative p-2 rounded-xl text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
          aria-label="Notifications"
        >
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full ring-1 ring-white" />
        </button>

        {/* Avatar + name */}
        <div className="flex items-center gap-1.5 sm:gap-2 pl-1 pr-1 py-1">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-sm bg-gradient-to-br ${avatarGradient}`}>
            {initials}
          </div>
          {displayName && (
            <span className="hidden sm:block text-sm font-medium text-stone-700 max-w-[120px] truncate">
              {displayName}
            </span>
          )}
          <ChevronDown size={12} className="text-stone-300 hidden sm:block" />
        </div>

        {/* Log out */}
        <button
          onClick={handleLogout}
          className="p-2 rounded-xl text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
          aria-label="Log out"
          title="Log out"
        >
          <LogOut size={15} />
        </button>
      </div>
    </header>
  )
}
