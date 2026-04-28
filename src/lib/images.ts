// ─── Curated image sourcing ───────────────────────────────────────────────────
// source.unsplash.com was deprecated in 2024 and now returns broken responses,
// so we instead use a curated bank of direct-link Unsplash images, keyed by
// event-type + style intent. The picker chooses 6 images for a concept based
// on the event type + mood + colors so each concept feels visually distinct
// without depending on a live external query.

type Bank = {
  /** wide editorial / venue / ceremony space */
  venue: string[]
  /** floral / colour hero */
  floral: string[]
  /** table & place setting */
  table: string[]
  /** lighting / atmosphere */
  lighting: string[]
  /** detail / styled vignette */
  detail: string[]
  /** wide reception / panoramic */
  wide: string[]
}

// All URLs include explicit dimensions/quality so they always resolve.
const W = 'auto=format&fit=crop&w=1100&q=80'
const P = 'auto=format&fit=crop&w=1400&q=80' // panoramic

const WEDDING: Bank = {
  venue: [
    `https://images.unsplash.com/photo-1519225421980-715cb0215aed?${W}`,
    `https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?${W}`,
    `https://images.unsplash.com/photo-1511795409834-ef04bbd61622?${W}`,
    `https://images.unsplash.com/photo-1469371670807-013ccf25f16a?${W}`,
  ],
  floral: [
    `https://images.unsplash.com/photo-1487530811176-3780de880c2d?${W}`,
    `https://images.unsplash.com/photo-1561128290-006dc4827214?${W}`,
    `https://images.unsplash.com/photo-1490750967868-88df5691cc58?${W}`,
    `https://images.unsplash.com/photo-1508610048659-a06b669e3321?${W}`,
  ],
  table: [
    `https://images.unsplash.com/photo-1519741497674-611481863552?${W}`,
    `https://images.unsplash.com/photo-1530023367847-a683933f4172?${W}`,
    `https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?${W}`,
    `https://images.unsplash.com/photo-1414235077428-338989a2e8c0?${W}`,
  ],
  lighting: [
    `https://images.unsplash.com/photo-1530653333484-8d161fdf9c0d?${W}`,
    `https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?${W}`,
    `https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?${W}`,
    `https://images.unsplash.com/photo-1478146059778-26628bd9b40b?${W}`,
  ],
  detail: [
    `https://images.unsplash.com/photo-1511285560929-80b456fea0bc?${W}`,
    `https://images.unsplash.com/photo-1544161702-af3e19a9c04a?${W}`,
    `https://images.unsplash.com/photo-1513278974582-3e1b4a4fa21e?${W}`,
    `https://images.unsplash.com/photo-1532712938310-34cb3982ef74?${W}`,
  ],
  wide: [
    `https://images.unsplash.com/photo-1470229538611-c1b5b813e690?${P}`,
    `https://images.unsplash.com/photo-1530103862676-de8c9debad1d?${P}`,
    `https://images.unsplash.com/photo-1513152697235-fe74c283646a?${P}`,
    `https://images.unsplash.com/photo-1444492217858-9bc0219eba81?${P}`,
  ],
}

const BIRTHDAY: Bank = {
  venue: [
    `https://images.unsplash.com/photo-1530103862676-de8c9debad1d?${W}`,
    `https://images.unsplash.com/photo-1492684223066-81342ee5ff30?${W}`,
    `https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?${W}`,
  ],
  floral: [
    `https://images.unsplash.com/photo-1558636508-e0db3814bd1d?${W}`,
    `https://images.unsplash.com/photo-1481349518771-20055b2a7b24?${W}`,
    `https://images.unsplash.com/photo-1530103862676-de8c9debad1d?${W}`,
  ],
  table: [
    `https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?${W}`,
    `https://images.unsplash.com/photo-1530023367847-a683933f4172?${W}`,
    `https://images.unsplash.com/photo-1542736667-069246bdbc6d?${W}`,
  ],
  lighting: [
    `https://images.unsplash.com/photo-1496024840928-4c417adf211d?${W}`,
    `https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?${W}`,
  ],
  detail: [
    `https://images.unsplash.com/photo-1464349153735-7db50ed83c84?${W}`,
    `https://images.unsplash.com/photo-1558636508-e0db3814bd1d?${W}`,
    `https://images.unsplash.com/photo-1485962398705-ef6a13c41e8f?${W}`,
  ],
  wide: [
    `https://images.unsplash.com/photo-1492684223066-81342ee5ff30?${P}`,
    `https://images.unsplash.com/photo-1530103862676-de8c9debad1d?${P}`,
  ],
}

const CORPORATE: Bank = {
  venue: [
    `https://images.unsplash.com/photo-1505373877841-8d25f7d46678?${W}`,
    `https://images.unsplash.com/photo-1540575467063-178a50c2df87?${W}`,
    `https://images.unsplash.com/photo-1511578314322-379afb476865?${W}`,
  ],
  floral: [
    `https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?${W}`,
    `https://images.unsplash.com/photo-1540575467063-178a50c2df87?${W}`,
  ],
  table: [
    `https://images.unsplash.com/photo-1517457373958-b7bdd4587205?${W}`,
    `https://images.unsplash.com/photo-1505373877841-8d25f7d46678?${W}`,
  ],
  lighting: [
    `https://images.unsplash.com/photo-1540575467063-178a50c2df87?${W}`,
    `https://images.unsplash.com/photo-1492684223066-81342ee5ff30?${W}`,
  ],
  detail: [
    `https://images.unsplash.com/photo-1511578314322-379afb476865?${W}`,
    `https://images.unsplash.com/photo-1517457373958-b7bdd4587205?${W}`,
  ],
  wide: [
    `https://images.unsplash.com/photo-1540575467063-178a50c2df87?${P}`,
    `https://images.unsplash.com/photo-1505373877841-8d25f7d46678?${P}`,
  ],
}

const GALA: Bank = {
  venue: [
    `https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?${W}`,
    `https://images.unsplash.com/photo-1540575467063-178a50c2df87?${W}`,
    `https://images.unsplash.com/photo-1519225421980-715cb0215aed?${W}`,
  ],
  floral: [
    `https://images.unsplash.com/photo-1487530811176-3780de880c2d?${W}`,
    `https://images.unsplash.com/photo-1490750967868-88df5691cc58?${W}`,
  ],
  table: [
    `https://images.unsplash.com/photo-1530023367847-a683933f4172?${W}`,
    `https://images.unsplash.com/photo-1519741497674-611481863552?${W}`,
    `https://images.unsplash.com/photo-1414235077428-338989a2e8c0?${W}`,
  ],
  lighting: [
    `https://images.unsplash.com/photo-1492684223066-81342ee5ff30?${W}`,
    `https://images.unsplash.com/photo-1530653333484-8d161fdf9c0d?${W}`,
  ],
  detail: [
    `https://images.unsplash.com/photo-1511285560929-80b456fea0bc?${W}`,
    `https://images.unsplash.com/photo-1532712938310-34cb3982ef74?${W}`,
  ],
  wide: [
    `https://images.unsplash.com/photo-1530103862676-de8c9debad1d?${P}`,
    `https://images.unsplash.com/photo-1513152697235-fe74c283646a?${P}`,
  ],
}

const FALLBACK: Bank = WEDDING

function bankFor(eventType: string): Bank {
  const t = eventType.toLowerCase()
  if (t.includes('wedding') || t.includes('anniversary')) return WEDDING
  if (t.includes('birthday') || t.includes('graduation')) return BIRTHDAY
  if (t.includes('corporate') || t.includes('conference')) return CORPORATE
  if (t.includes('gala')) return GALA
  return FALLBACK
}

/**
 * Stable seeded pick — same inputs always yield the same image, but two
 * concepts in the same event get different photos (different seed offsets).
 */
function pick(arr: string[], seed: number, offset = 0): string {
  if (arr.length === 0) return ''
  return arr[(seed + offset) % arr.length]
}

function seedFrom(s: string): number {
  return Math.abs(s.split('').reduce((a, c) => a + c.charCodeAt(0), 0))
}

/**
 * Generate 6 concept-level images that reflect the event type and mood.
 * Slot mapping (kept identical to previous API):
 *  0 → venue / ceremony space
 *  1 → floral / color hero
 *  2 → table / place setting
 *  3 → lighting / atmosphere
 *  4 → detail / decor close-up
 *  5 → editorial / wide shot (used as panoramic footer)
 */
export function getImagesForConcept(
  mood: string,
  eventType: string,
  style: string[],
  colorPalette: string[] = [],
): string[] {
  const bank = bankFor(eventType)
  const seed = seedFrom(`${mood}|${style.join(',')}|${colorPalette.join(',')}`)

  return [
    pick(bank.venue,    seed, 0),
    pick(bank.floral,   seed, 1),
    pick(bank.table,    seed, 2),
    pick(bank.lighting, seed, 3),
    pick(bank.detail,   seed, 4),
    pick(bank.wide,     seed, 5),
  ]
}

/**
 * Pick a single image for an individual decor item. Uses item name keywords
 * to bias which sub-bank we pull from (e.g. "Floral Arch" → floral; "Lighting" → lighting).
 */
export function getImageForDecorItem(
  itemName: string,
  primaryColor = '',
  vibe = '',
): string {
  const name = itemName.toLowerCase()
  const bank = bankFor(vibe || 'wedding')
  let pool = bank.detail
  if (/(flower|floral|bloom|peony|rose|petal|bouquet|garland|arch)/.test(name)) pool = bank.floral
  else if (/(light|chandelier|candle|fairy|lantern|lamp|glow)/.test(name)) pool = bank.lighting
  else if (/(table|chair|setting|plate|cutlery|linen|runner|charger)/.test(name)) pool = bank.table
  else if (/(stage|backdrop|tent|canopy|venue|aisle|mandap)/.test(name)) pool = bank.venue

  const seed = seedFrom(`${itemName}|${primaryColor}|${vibe}`)
  return pick(pool, seed)
}
