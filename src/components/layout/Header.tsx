import { Bell, Key, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { RoleSwitcher } from './RoleSwitcher'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { useStore } from '../../store'

export function Header() {
  const [apiKeyOpen, setApiKeyOpen] = useState(false)
  const [keyInput, setKeyInput]     = useState('')
  const { apiKey, setApiKey, role, plannerProfile, clientProfile } = useStore()
  const isPlanner = role === 'planner'

  const saveKey = () => { setApiKey(keyInput); setApiKeyOpen(false) }

  // Compute initials & gradient from the active profile
  const profileName = isPlanner ? plannerProfile.name : clientProfile.name
  const initials = profileName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(s => s[0]?.toUpperCase())
    .join('') || (isPlanner ? 'P' : 'C')
  const avatarGradient = isPlanner
    ? (plannerProfile.avatarColor || 'from-brand-400 to-brand-600')
    : 'from-sage-400 to-sage-600'

  return (
    <>
      <header className="h-14 bg-white/80 backdrop-blur-md border-b border-stone-200/60 flex items-center justify-between px-6 shrink-0 sticky top-0 z-10">

        {/* Left: role indicator */}
        <div className="flex items-center gap-2.5">
          <div className={`w-2 h-2 rounded-full animate-pulse ${isPlanner ? 'bg-brand-500' : 'bg-sage-500'}`} />
          <span className="text-sm font-medium text-stone-500">
            {isPlanner ? 'Planner Suite' : 'Client Portal'}
          </span>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          <RoleSwitcher />

          {/* API key pill */}
          <button
            onClick={() => { setKeyInput(apiKey); setApiKeyOpen(true) }}
            title="Configure Claude API Key"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              apiKey
                ? 'text-brand-700 bg-brand-50 hover:bg-brand-100 ring-1 ring-brand-200'
                : 'text-amber-700 bg-amber-50 hover:bg-amber-100 ring-1 ring-amber-200'
            }`}
          >
            <Key size={12} />
            {apiKey ? 'API Ready' : 'Add API Key'}
          </button>

          {/* Bell */}
          <button className="relative p-2 rounded-xl text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors">
            <Bell size={16} />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full ring-1 ring-white" />
          </button>

          {/* Avatar — initials + gradient from profile */}
          <button
            className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-xl hover:bg-stone-50 transition-colors"
            title={profileName || (isPlanner ? 'Set your planner profile' : 'Set your client profile')}
          >
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-sm bg-gradient-to-br ${avatarGradient}`}>
              {initials}
            </div>
            <ChevronDown size={12} className="text-stone-400" />
          </button>
        </div>
      </header>

      {/* API Key modal */}
      <Modal open={apiKeyOpen} onClose={() => setApiKeyOpen(false)} title="Claude API Key" size="md">
        <div className="p-6 space-y-4">
          <p className="text-sm text-stone-500 leading-relaxed">
            Enter your Anthropic API key to enable AI concept generation. Stored locally in your browser — never shared.
          </p>
          <Input
            label="API Key"
            type="password"
            placeholder="sk-ant-…"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && saveKey()}
          />
          {apiKey && (
            <div className="flex items-center gap-2 text-xs text-sage-700 bg-sage-50 px-3 py-2 rounded-xl ring-1 ring-sage-200">
              <span className="w-2 h-2 bg-sage-500 rounded-full" />
              API key is configured and ready
            </div>
          )}
          <div className="flex gap-2 justify-end pt-1">
            <Button variant="secondary" onClick={() => setApiKeyOpen(false)}>Cancel</Button>
            <Button onClick={saveKey} disabled={!keyInput.trim()}>Save Key</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
