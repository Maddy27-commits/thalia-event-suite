import { useState, useRef } from 'react'
import { Plus, Star, Phone, Mail, Trash2, Edit2, Search, Store, Globe, Upload } from 'lucide-react'
import { useStore } from '../../store'
import { Card, CardBody } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Input, Textarea, Select } from '../../components/ui/Input'
import { generateId } from '../../lib/utils'
import type { Vendor, VendorCategory, VendorRegion, VendorSpecialty } from '../../types'

const CATEGORIES: { value: VendorCategory; label: string }[] = [
  { value: 'venue', label: 'Venue' },
  { value: 'catering', label: 'Catering' },
  { value: 'photography', label: 'Photography' },
  { value: 'videography', label: 'Videography' },
  { value: 'florals', label: 'Florals' },
  { value: 'music', label: 'Music' },
  { value: 'decor', label: 'Decor' },
  { value: 'transportation', label: 'Transportation' },
  { value: 'lighting', label: 'Lighting' },
  { value: 'other', label: 'Other' },
]

const REGIONS: { value: VendorRegion; label: string }[] = [
  { value: 'North America',      label: 'North America'     },
  { value: 'UK & Ireland',       label: 'UK & Ireland'      },
  { value: 'Europe',             label: 'Europe'            },
  { value: 'India & South Asia', label: 'India & South Asia'},
  { value: 'Middle East',        label: 'Middle East'       },
  { value: 'Asia Pacific',       label: 'Asia Pacific'      },
  { value: 'Australia & NZ',     label: 'Australia & NZ'    },
  { value: 'Other',              label: 'Other'             },
]

const SPECIALTIES: { value: VendorSpecialty; label: string }[] = [
  { value: 'wedding',     label: 'Wedding'     },
  { value: 'corporate',   label: 'Corporate'   },
  { value: 'birthday',    label: 'Birthday'    },
  { value: 'anniversary', label: 'Anniversary' },
  { value: 'gala',        label: 'Gala'        },
  { value: 'conference',  label: 'Conference'  },
  { value: 'graduation',  label: 'Graduation'  },
  { value: 'general',     label: 'General'     },
]

const categoryColors: Record<VendorCategory, string> = {
  venue: 'text-blue-600 bg-blue-50',
  catering: 'text-orange-600 bg-orange-50',
  photography: 'text-pink-600 bg-pink-50',
  videography: 'text-brand-600 bg-brand-50',
  florals: 'text-rose-600 bg-rose-50',
  music: 'text-indigo-600 bg-indigo-50',
  decor: 'text-teal-600 bg-teal-50',
  transportation: 'text-stone-600 bg-stone-50',
  lighting: 'text-amber-600 bg-amber-50',
  other: 'text-stone-600 bg-stone-100',
}

const emptyForm = {
  name: '', category: 'florals' as VendorCategory, contact: '', email: '',
  phone: '', priceRange: '', rating: '5', notes: '', tags: '',
  region: 'North America' as VendorRegion, specialty: 'wedding' as VendorSpecialty,
  imageUrl: '',
}

/**
 * Lightweight CSV parser tuned for vendor import. Accepts a header row
 * (case-insensitive) and emits rows as Vendor objects. Quoted cells with
 * commas inside are honoured. Cells we don't recognise are silently
 * dropped — better to ignore than to crash on a planner's exported
 * spreadsheet.
 */
function parseVendorCSV(text: string): Vendor[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
  if (lines.length < 2) return []

  const splitRow = (line: string): string[] => {
    const out: string[] = []
    let cur = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; continue }
      if (ch === '"') { inQuotes = !inQuotes; continue }
      if (ch === ',' && !inQuotes) { out.push(cur.trim()); cur = ''; continue }
      cur += ch
    }
    out.push(cur.trim())
    return out
  }

  const headers = splitRow(lines[0]).map((h) => h.toLowerCase().replace(/\s+/g, ''))
  const idxOf = (name: string) => headers.indexOf(name.toLowerCase().replace(/\s+/g, ''))

  const i = {
    name:        idxOf('name'),
    category:    idxOf('category'),
    contact:     idxOf('contact'),
    email:       idxOf('email'),
    phone:       idxOf('phone'),
    priceRange:  idxOf('pricerange'),
    rating:      idxOf('rating'),
    notes:       idxOf('notes'),
    tags:        idxOf('tags'),
    region:      idxOf('region'),
    specialty:   idxOf('specialty') >= 0 ? idxOf('specialty') : idxOf('speciality'),
  }

  const validCats: VendorCategory[] = ['venue', 'catering', 'photography', 'videography', 'florals', 'music', 'decor', 'transportation', 'lighting', 'other']

  return lines.slice(1).map((line) => {
    const cols = splitRow(line)
    const cat = (cols[i.category] ?? '').toLowerCase().trim() as VendorCategory
    const v: Vendor = {
      id: generateId(),
      name: cols[i.name] ?? '',
      category: validCats.includes(cat) ? cat : 'other',
      contact: cols[i.contact] ?? '',
      email: cols[i.email] ?? '',
      phone: cols[i.phone] ?? '',
      priceRange: cols[i.priceRange] ?? '',
      rating: Math.max(1, Math.min(5, parseInt(cols[i.rating] ?? '5') || 5)),
      notes: cols[i.notes] ?? '',
      tags: (cols[i.tags] ?? '').split(/[,;|]/).map((t) => t.trim()).filter(Boolean),
      region: (cols[i.region] ?? '').trim() as VendorRegion || undefined,
      specialties: cols[i.specialty] ? [cols[i.specialty].trim() as VendorSpecialty] : undefined,
      createdAt: new Date().toISOString(),
    }
    return v
  }).filter((v) => v.name.length > 0)
}

export function VendorsPage() {
  const { vendors, addVendor, updateVendor, deleteVendor, toggleVendorFavorite, importVendors, events } = useStore()
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [importMsg, setImportMsg] = useState('')
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleImportClick = () => fileInputRef.current?.click()
  const handleFileChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const parsed = parseVendorCSV(text)
      if (parsed.length === 0) {
        setImportMsg('No valid rows found. Make sure the CSV has a header row (Name, Category, Contact, Email, Phone, PriceRange, Rating, Region, Specialty, Tags, Notes).')
      } else {
        const added = importVendors(parsed)
        const dupes = parsed.length - added
        setImportMsg(`Imported ${added} new vendor${added !== 1 ? 's' : ''}${dupes > 0 ? ` · skipped ${dupes} duplicate${dupes !== 1 ? 's' : ''}` : ''}.`)
      }
    } catch {
      setImportMsg('Could not read that file. Please pick a UTF-8 CSV.')
    }
    e.target.value = '' // allow re-importing the same file
    setTimeout(() => setImportMsg(''), 5000)
  }
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState<string>('all')
  const [filterRegion, setFilterRegion] = useState<string>('all')
  const [filterSpecialty, setFilterSpecialty] = useState<string>('all')

  const set = (k: keyof typeof emptyForm, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const openCreate = () => { setForm({ ...emptyForm }); setEditingId(null); setOpen(true) }
  const openEdit = (v: Vendor) => {
    setForm({
      name: v.name, category: v.category, contact: v.contact, email: v.email,
      phone: v.phone, priceRange: v.priceRange, rating: String(v.rating), notes: v.notes,
      tags: v.tags.join(', '),
      region: v.region ?? 'North America',
      specialty: v.specialties?.[0] ?? 'wedding',
      imageUrl: v.imageUrl ?? '',
    })
    setEditingId(v.id)
    setOpen(true)
  }

  const handleSave = () => {
    const data = {
      name: form.name, category: form.category, contact: form.contact, email: form.email,
      phone: form.phone, priceRange: form.priceRange, rating: parseInt(form.rating) || 5,
      notes: form.notes,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      region: form.region,
      specialties: [form.specialty],
      imageUrl: form.imageUrl.trim() || undefined,
    }
    if (editingId) {
      updateVendor(editingId, data)
    } else {
      addVendor({ ...data, id: generateId(), createdAt: new Date().toISOString() })
    }
    setOpen(false)
  }

  const filtered = vendors.filter((v) => {
    const q = search.toLowerCase()
    const matchesSearch =
      !q ||
      v.name.toLowerCase().includes(q) ||
      v.category.includes(q) ||
      v.contact.toLowerCase().includes(q) ||
      (v.region ?? '').toLowerCase().includes(q) ||
      v.tags.some((t) => t.toLowerCase().includes(q))
    const matchesCat       = filterCat === 'all' || v.category === filterCat
    const matchesRegion    = filterRegion === 'all' || v.region === filterRegion
    const matchesSpecialty = filterSpecialty === 'all' || (v.specialties ?? []).includes(filterSpecialty as VendorSpecialty)
    return matchesSearch && matchesCat && matchesRegion && matchesSpecialty
  })

  // Pin favorites to the top — preserves filter results, just changes order.
  const sortedFiltered = [...filtered].sort((a, b) => {
    if (!!a.favorite === !!b.favorite) return 0
    return a.favorite ? -1 : 1
  })

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-stone-900">Vendors</h1>
          <p className="text-stone-400 text-sm mt-0.5">{vendors.length} vendor{vendors.length !== 1 ? 's' : ''} in your network</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileChosen}
            className="hidden"
          />
          <Button variant="secondary" size="sm" icon={<Upload size={14} />} onClick={handleImportClick}>
            <span className="hidden sm:inline">Import CSV</span>
            <span className="sm:hidden">Import</span>
          </Button>
          <Button icon={<Plus size={15} />} onClick={openCreate} size="sm" className="sm:text-sm sm:px-4 sm:py-2">
            <span className="hidden xs:inline">Add Vendor</span>
            <span className="xs:hidden">Add</span>
          </Button>
        </div>
      </div>

      {importMsg && (
        <div className="rounded-xl bg-emerald-50 ring-1 ring-emerald-200 px-4 py-2.5 text-sm text-emerald-700">
          {importMsg}
        </div>
      )}

      {/* Search */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            placeholder="Search by name, contact, region, or tag…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <p className="text-xs text-stone-400">{filtered.length} match{filtered.length !== 1 ? 'es' : ''}</p>
      </div>

      {/* Category filter pills */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Category</p>
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setFilterCat('all')}
            className={`text-xs px-3 py-1.5 rounded-full border transition-all ${filterCat === 'all' ? 'bg-brand-600 text-white border-brand-600' : 'border-stone-200 text-stone-500 hover:border-brand-300'}`}
          >
            All
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => setFilterCat(c.value)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all ${filterCat === c.value ? 'bg-brand-600 text-white border-brand-600' : 'border-stone-200 text-stone-500 hover:border-brand-300'}`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Region filter pills */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Region</p>
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setFilterRegion('all')}
            className={`text-xs px-3 py-1.5 rounded-full border transition-all ${filterRegion === 'all' ? 'bg-sage-600 text-white border-sage-600' : 'border-stone-200 text-stone-500 hover:border-sage-300'}`}
          >
            All regions
          </button>
          {REGIONS.map((r) => (
            <button
              key={r.value}
              onClick={() => setFilterRegion(r.value)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all flex items-center gap-1 ${filterRegion === r.value ? 'bg-sage-600 text-white border-sage-600' : 'border-stone-200 text-stone-500 hover:border-sage-300'}`}
            >
              <Globe size={10} /> {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Specialty filter pills */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Event speciality</p>
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setFilterSpecialty('all')}
            className={`text-xs px-3 py-1.5 rounded-full border transition-all ${filterSpecialty === 'all' ? 'bg-plum-600 text-white border-plum-600' : 'border-stone-200 text-stone-500 hover:border-plum-300'}`}
          >
            All event types
          </button>
          {SPECIALTIES.map((s) => (
            <button
              key={s.value}
              onClick={() => setFilterSpecialty(s.value)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all ${filterSpecialty === s.value ? 'bg-plum-600 text-white border-plum-600' : 'border-stone-200 text-stone-500 hover:border-plum-300'}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {sortedFiltered.map((vendor) => {
          const linkedEvents = events.filter(e => e.vendorIds.includes(vendor.id))
          return (
          <Card key={vendor.id} className="group overflow-hidden">
            {vendor.imageUrl && (
              <div className="h-28 w-full overflow-hidden bg-stone-100">
                <img
                  src={vendor.imageUrl}
                  alt={vendor.name}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <CardBody>
              <div className="flex items-start justify-between mb-3 gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-stone-900 truncate">{vendor.name}</p>
                    {vendor.favorite && (
                      <Star size={12} className="fill-amber-400 text-amber-400 shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryColors[vendor.category]}`}>
                      {vendor.category}
                    </span>
                    {vendor.region && (
                      <span className="text-[10px] inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-sage-50 text-sage-700 font-medium">
                        <Globe size={9} /> {vendor.region}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => toggleVendorFavorite(vendor.id)}
                    className={`p-1.5 rounded transition-colors ${vendor.favorite ? 'text-amber-500 hover:bg-amber-50' : 'text-stone-300 hover:bg-stone-100 hover:text-amber-400 opacity-0 group-hover:opacity-100'}`}
                    title={vendor.favorite ? 'Unstar' : 'Star to pin'}
                  >
                    <Star size={14} className={vendor.favorite ? 'fill-amber-400' : ''} />
                  </button>
                  <button onClick={() => openEdit(vendor)} className="p-1.5 rounded hover:bg-stone-100 text-stone-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => { if (confirm('Remove vendor?')) deleteVendor(vendor.id) }} className="p-1.5 rounded hover:bg-red-50 text-stone-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Rating */}
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={12} className={i < vendor.rating ? 'fill-amber-400 text-amber-400' : 'text-stone-200'} />
                ))}
              </div>

              <div className="space-y-1.5 text-xs text-stone-500">
                <p className="font-medium text-stone-700">{vendor.contact}</p>
                <p className="flex items-center gap-1.5"><Mail size={11} />{vendor.email}</p>
                <p className="flex items-center gap-1.5"><Phone size={11} />{vendor.phone}</p>
                <p className="text-brand-600 font-medium">{vendor.priceRange}</p>
              </div>

              {(vendor.specialties && vendor.specialties.length > 0) && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {vendor.specialties.map((sp) => (
                    <span key={sp} className="text-[10px] bg-plum-50 text-plum-700 ring-1 ring-plum-100 px-2 py-0.5 rounded-full font-medium capitalize">
                      {sp}
                    </span>
                  ))}
                </div>
              )}

              {vendor.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {vendor.tags.map((tag) => (
                    <span key={tag} className="text-[10px] bg-stone-50 border border-stone-100 text-stone-500 px-2 py-0.5 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {vendor.notes && (
                <p className="text-xs text-stone-400 mt-2 italic line-clamp-2">{vendor.notes}</p>
              )}

              {/* Linked events — shows where this vendor is currently booked */}
              {linkedEvents.length > 0 && (
                <div className="flex flex-wrap items-center gap-1 mt-3 pt-3 border-t border-stone-100">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mr-1">Booked on</span>
                  {linkedEvents.slice(0, 3).map(e => (
                    <span key={e.id} className="text-[10px] bg-brand-50 text-brand-700 ring-1 ring-brand-100 px-2 py-0.5 rounded-full font-medium truncate max-w-[140px]">
                      {e.name}
                    </span>
                  ))}
                  {linkedEvents.length > 3 && (
                    <span className="text-[10px] text-stone-400 font-medium">+{linkedEvents.length - 3} more</span>
                  )}
                </div>
              )}
            </CardBody>
          </Card>
          )
        })}

        {filtered.length === 0 && (
          <div className="col-span-full text-center py-16 text-stone-400">
            <Store size={40} className="mx-auto mb-3 text-stone-200" />
            <p>No vendors found</p>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal open={open} onClose={() => setOpen(false)} title={editingId ? 'Edit Vendor' : 'Add Vendor'} size="lg">
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Vendor Name" value={form.name} onChange={(e) => set('name', e.target.value)} className="col-span-2" />
            <Select label="Category" value={form.category} onChange={(e) => set('category', e.target.value as VendorCategory)} options={CATEGORIES} />
            <Input label="Rating (1–5)" type="number" min="1" max="5" value={form.rating} onChange={(e) => set('rating', e.target.value)} />
            <Select label="Region" value={form.region} onChange={(e) => set('region', e.target.value as VendorRegion)} options={REGIONS} />
            <Select label="Event speciality" value={form.specialty} onChange={(e) => set('specialty', e.target.value as VendorSpecialty)} options={SPECIALTIES} />
            <Input label="Contact Name" value={form.contact} onChange={(e) => set('contact', e.target.value)} />
            <Input label="Email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
            <Input label="Phone" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
            <Input label="Price Range" placeholder="$500–$2,000" value={form.priceRange} onChange={(e) => set('priceRange', e.target.value)} />
            <Input label="Tags (comma-separated)" placeholder="luxury, outdoor, modern" value={form.tags} onChange={(e) => set('tags', e.target.value)} className="col-span-2" />
            <Input label="Image URL (optional)" placeholder="https://example.com/photo.jpg" value={form.imageUrl} onChange={(e) => set('imageUrl', e.target.value)} className="col-span-2" />
          </div>
          <Textarea label="Notes" rows={3} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name}>{editingId ? 'Update' : 'Add'} Vendor</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

