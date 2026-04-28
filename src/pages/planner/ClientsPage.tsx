import { useState } from 'react'
import { Heart, Utensils, Music, Palette, ThumbsDown, StickyNote, ChevronDown, ChevronUp } from 'lucide-react'
import { useStore } from '../../store'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Textarea } from '../../components/ui/Input'
import { TagInput } from '../../components/ui/TagInput'
import { Badge } from '../../components/ui/Badge'
import type { ClientPreferences } from '../../types'

const STYLE_OPTIONS = ['romantic', 'modern', 'rustic', 'minimalist', 'bohemian', 'glam', 'garden', 'industrial', 'vintage', 'tropical', 'luxe', 'whimsical']
const COLOR_OPTIONS = ['blush', 'ivory', 'sage', 'gold', 'navy', 'burgundy', 'terracotta', 'dusty rose', 'emerald', 'champagne', 'white', 'black', 'silver', 'lavender']
const DIETARY_OPTIONS = ['vegetarian', 'vegan', 'gluten-free', 'nut-free', 'kosher', 'halal', 'dairy-free', 'pescatarian']
const MUSIC_OPTIONS = ['jazz', 'classical', 'pop', 'R&B', 'electronic', 'acoustic', 'latin', 'hip-hop', 'country', 'indie']

function ToggleChipGroup({
  options, selected, onChange, colorClass,
}: { options: string[]; selected: string[]; onChange: (v: string[]) => void; colorClass: string }) {
  const toggle = (opt: string) =>
    onChange(selected.includes(opt) ? selected.filter((s) => s !== opt) : [...selected, opt])

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => toggle(opt)}
          className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
            selected.includes(opt) ? colorClass : 'border-stone-200 text-stone-500 hover:border-stone-300'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

export function ClientsPage() {
  const { events, activeEventId, updateEvent } = useStore()
  const [expandedId, setExpandedId] = useState<string | null>(activeEventId)

  const handlePrefChange = (eventId: string, key: keyof ClientPreferences, value: string | string[]) => {
    const event = events.find((e) => e.id === eventId)
    if (!event) return
    updateEvent(eventId, {
      preferences: { ...event.preferences, [key]: value },
    })
  }

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Client Preferences</h1>
        <p className="text-stone-500 text-sm mt-0.5">
          Store detailed preferences to power smarter AI concept generation.
        </p>
      </div>

      <div className="space-y-4">
        {events.map((event) => {
          const isOpen = expandedId === event.id
          const prefs = event.preferences
          const filledCount = [prefs.style, prefs.colorPalette, prefs.dietary, prefs.musicGenre]
            .filter((arr) => arr.length > 0).length + (prefs.notes ? 1 : 0)

          return (
            <Card key={event.id}>
              <CardHeader>
                <button
                  className="flex items-center justify-between w-full"
                  onClick={() => setExpandedId(isOpen ? null : event.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600 font-bold text-sm">
                      {event.clientName[0]}
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-stone-900 text-sm">{event.clientName}</p>
                      <p className="text-xs text-stone-400">{event.name}</p>
                    </div>
                    <Badge variant={filledCount >= 4 ? 'success' : filledCount >= 2 ? 'warning' : 'default'}>
                      {filledCount}/5 categories filled
                    </Badge>
                  </div>
                  {isOpen ? <ChevronUp size={16} className="text-stone-400" /> : <ChevronDown size={16} className="text-stone-400" />}
                </button>
              </CardHeader>

              {isOpen && (
                <CardBody className="space-y-6 pt-4">
                  {/* Style */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Heart size={14} className="text-rose-400" />
                      <p className="text-sm font-medium text-stone-700">Style Preferences</p>
                    </div>
                    <ToggleChipGroup
                      options={STYLE_OPTIONS}
                      selected={prefs.style}
                      onChange={(v) => handlePrefChange(event.id, 'style', v)}
                      colorClass="bg-rose-50 border-rose-300 text-rose-600"
                    />
                  </div>

                  {/* Colors */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Palette size={14} className="text-brand-400" />
                      <p className="text-sm font-medium text-stone-700">Color Palette</p>
                    </div>
                    <ToggleChipGroup
                      options={COLOR_OPTIONS}
                      selected={prefs.colorPalette}
                      onChange={(v) => handlePrefChange(event.id, 'colorPalette', v)}
                      colorClass="bg-brand-50 border-brand-300 text-brand-600"
                    />
                    <div className="mt-2 flex gap-1.5">
                      {prefs.colorPalette.map((color) => (
                        <div key={color} className="flex items-center gap-1 text-xs bg-stone-50 px-2 py-1 rounded-full border border-stone-100 text-stone-600">
                          <div className="w-2.5 h-2.5 rounded-full bg-brand-300" />
                          {color}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Dietary */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Utensils size={14} className="text-emerald-400" />
                      <p className="text-sm font-medium text-stone-700">Dietary Requirements</p>
                    </div>
                    <ToggleChipGroup
                      options={DIETARY_OPTIONS}
                      selected={prefs.dietary}
                      onChange={(v) => handlePrefChange(event.id, 'dietary', v)}
                      colorClass="bg-emerald-50 border-emerald-300 text-emerald-600"
                    />
                  </div>

                  {/* Music */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Music size={14} className="text-sky-400" />
                      <p className="text-sm font-medium text-stone-700">Music & Entertainment</p>
                    </div>
                    <ToggleChipGroup
                      options={MUSIC_OPTIONS}
                      selected={prefs.musicGenre}
                      onChange={(v) => handlePrefChange(event.id, 'musicGenre', v)}
                      colorClass="bg-sky-50 border-sky-300 text-sky-600"
                    />
                  </div>

                  {/* Dislikes */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <ThumbsDown size={14} className="text-stone-400" />
                      <p className="text-sm font-medium text-stone-700">Things to Avoid</p>
                    </div>
                    <TagInput
                      value={prefs.dislikes}
                      onChange={(v) => handlePrefChange(event.id, 'dislikes', v)}
                      placeholder="neon colors, loud music, formal seating…"
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <StickyNote size={14} className="text-amber-400" />
                      <p className="text-sm font-medium text-stone-700">Planner Notes</p>
                    </div>
                    <Textarea
                      rows={3}
                      placeholder="Additional context for AI generation — client quirks, stories, special requests..."
                      value={prefs.notes}
                      onChange={(e) => handlePrefChange(event.id, 'notes', e.target.value)}
                    />
                  </div>
                </CardBody>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
