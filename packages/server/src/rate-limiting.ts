type RateLimitState = { timestamps: number[]; lastRequestAt: number }
const rateLimits = new Map<string, RateLimitState>()

const MAX_REQUESTS = 100
const WINDOW_MS = 60_000 // 1 minute
const RL_SCAN_MS = 30_000 // 30 seconds
const RL_EXPIRATION_MS = 300_000 // 5 minutes

setInterval(() => {
  rateLimits.forEach((value, key) => {
    if (Date.now() > value.lastRequestAt + RL_EXPIRATION_MS) {
      rateLimits.delete(key)
    }
  })
}, RL_SCAN_MS)

export function isRateLimited(username: string): boolean {
  const now = Date.now()
  const windowStart = now - WINDOW_MS

  const rl = rateLimits.get(username)
  if (!rl) {
    rateLimits.set(username, {
      timestamps: [now],
      lastRequestAt: now,
    })
    return false
  }

  rl.lastRequestAt = now

  const recent = rl.timestamps.filter((ts) => ts > windowStart)
  if (recent.length >= MAX_REQUESTS) return true

  recent.push(now)
  rl.timestamps = recent
  return false
}
