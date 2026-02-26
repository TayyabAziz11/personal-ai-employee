/**
 * Simple in-memory rate limiter for auth endpoints.
 * Resets on server restart — sufficient for dev and low-traffic Vercel deployments.
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

const WINDOW_MS = 15 * 60 * 1000 // 15 minutes
const MAX_ATTEMPTS = 10

/**
 * Returns true if the key is within limits (allowed), false if rate-limited.
 */
export function checkRateLimit(key: string): boolean {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return true
  }

  if (entry.count >= MAX_ATTEMPTS) return false

  entry.count++
  return true
}
