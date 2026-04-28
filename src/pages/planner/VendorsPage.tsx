import { useState } from 'react'
import { Plus, Star, Phone, Mail, Trash2, Edit2, Search, Store } from 'lucide-react'
import { useStore } from '../../store'
import { Card, CardBody } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Input, Textarea, Select } from '../../components/ui/Input'
import { generateId } from '../../lib/utils'
import type { Vendor, VendorCategory } from '../../types'

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
}

export function VendorsPage() {
  const { vendors, addVendor, updateVendor, deleteVendor, events } = useStore()
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState<string>('all')

  const set = (k: keyof typeof emptyForm, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const openCreate = () => { setForm({ ...emptyForm }); setEditingId(null); setOpen(true) }
  const openEdit = (v: Vendor) => {
    setForm({ name: v.name, category: v.category, contact: v.contact, email: v.email,
      phone: v.phone, priceRange: v.priceRange, rating: String(v.rating), notes: v.notes, tags: v.tags.join(', ') })
    setEditingId(v.id)
    setOpen(true)
  }

  const handleSave = () => {
    const data = {
      name: form.name, category: form.category, contact: form.contact, email: form.email,
      phone: form.phone, priceRange: form.priceRange, rating: parseInt(form.rating) || 5,
      notes: form.notes, tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
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
    const matchesSearch = !q || v.name.toLowerCase().includes(q) || v.category.includes(q) || v.contact.toLowerCase().includes(q)
    const matchesCat = filterCat === 'all' || v.category === filterCat
    return matchesSearch && matchesCat
  })

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-stone-900">Vendors</h1>
          <p className="text-stone-400 text-sm mt-0.5">{vendors.length} vendor{vendors.length !== 1 ? 's' : ''} in your network</p>
        </div>
        <Button icon={<Plus size={15} />} onClick={openCreate} size="sm" className="sm:text-sm sm:px-4 sm:py-2">
          <span className="hidden xs:inline">Add Vendor</span>
          <span className="xs:hidden">Add</span>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            placeholder="Search vendors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
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

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((vendor) => {
          const linkedEvents = events.filter(e => e.vendorIds.includes(vendor.id))
          return (
          <Card key={vendor.id} className="group">
            <CardBody>
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-stone-900 truncate">{vendor.name}</p>
                  <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${categoryColors[vendor.category]}`}>
                    {vendor.category}
                  </span>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(vendor)} className="p-1.5 rounded hover:bg-stone-100 text-stone-400">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => { if (confirm('Remove vendor?')) deleteVendor(vendor.id) }} className="p-1.5 rounded hover:bg-red-50 text-stone-300 hover:text-red-400">
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

              {vendor.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
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
            <Input label="Contact Name" value={form.contact} onChange={(e) => set('contact', e.target.value)} />
            <Input label="Email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
            <Input label="Phone" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
            <Input label="Price Range" placeholder="$500–$2,000" value={form.priceRange} onChange={(e) => set('priceRange', e.target.value)} />
            <Input label="Tags (comma-separated)" placeholder="luxury, outdoor, modern" value={form.tags} onChange={(e) => set('tags', e.target.value)} className="col-span-2" />
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

