import type { HonoRequest } from "hono"
import type { StatusCode } from "hono/utils/http-status"
import type { Context } from "hono"
import type { ChatService, UserData } from "./chat.js"

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

export function parseNameCookie(req: HonoRequest) {
  const cookie = req.header("Cookie")
  if (!cookie) return

  for (const part of cookie.split(";")) {
    const trimmed = part.trim()
    if (trimmed.startsWith("username=")) {
      return trimmed.slice("username=".length)
    }
  }
}

export function getRequestUserData(
  c: Context,
  chat: ChatService
): [{ code: StatusCode; status: string }, null] | [null, UserData] {
  const name = parseNameCookie(c.req)
  if (!name) {
    return [{ code: 400, status: "Not authenticated" }, null]
  }

  const userData = chat.getUser(name)
  if (!userData) {
    c.res.headers.set(
      "Set-Cookie",
      `username=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
    )
    return [{ code: 400, status: "Not authenticated" }, null]
  }

  if (isRateLimited(name)) {
    return [{ code: 429, status: "Too many requests" }, null]
  }

  return [null, userData]
}

function isRateLimited(username: string): boolean {
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
