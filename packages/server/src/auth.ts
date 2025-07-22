import { createMiddleware } from "hono/factory"
import type { StatusCode } from "hono/utils/http-status"
import type { Context, HonoRequest } from "hono"
import ChatService, { type UserData } from "./services/ChatService.js"
import { isRateLimited } from "./rate-limiting.js"

export function parseAuthCookie(req: HonoRequest) {
  const cookie = req.header("Cookie")
  if (!cookie) return

  for (const part of cookie.split(";")) {
    const trimmed = part.trim()
    if (trimmed.startsWith("username=")) {
      return trimmed.slice("username=".length)
    }
  }
}

export const authParserMiddleware = createMiddleware<{
  Variables: { user: UserData }
}>(async (c, next) => {
  const [userErr, userData] = getRequestUserData(c)
  if (userErr !== null) {
    c.status(userErr.code)
    return c.json({ status: userErr.status })
  }

  c.set("user", userData)
  await next()
})

function getRequestUserData(
  c: Context
): [{ code: StatusCode; status: string }, null] | [null, UserData] {
  const name = parseAuthCookie(c.req)
  if (!name) {
    return [{ code: 400, status: "Not authenticated" }, null]
  }

  const userData = ChatService.getUser(name)
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
