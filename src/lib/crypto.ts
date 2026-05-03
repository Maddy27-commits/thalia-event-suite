/**
 * Password hashing using Web Crypto API (PBKDF2-SHA-256).
 *
 * No dependencies — uses the browser's built-in SubtleCrypto.
 * Salt is generated per-user; iteration count is high enough to make
 * brute-forcing impractical even with the hash leaked.
 */

const ITERATIONS = 100_000
const KEY_LENGTH = 256 // bits
const SALT_BYTES = 16

function bufToHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function generateSalt(): string {
  const arr = new Uint8Array(SALT_BYTES)
  crypto.getRandomValues(arr)
  return [...arr].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function hashPassword(password: string, saltHex: string): Promise<string> {
  const enc = new TextEncoder()
  const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map((b) => parseInt(b, 16)))

  const baseKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits'],
  )

  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
    baseKey,
    KEY_LENGTH,
  )

  return bufToHex(bits)
}

/** Constant-time string comparison to prevent timing attacks. */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}
