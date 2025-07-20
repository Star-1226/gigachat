import { serve } from "@hono/node-server"
import { streamSSE } from "hono/streaming"
import { serveStatic } from "@hono/node-server/serve-static"
import { Hono, type HonoRequest, type MiddlewareHandler } from "hono"
import { ChatService, type UserData } from "./chat.js"
import {
  validateChatMessageDTO,
  MAX_RECENT_MESSAGES,
  validateReactionDTO,
} from "shared"

const isProd = process.env.NODE_ENV === "production"

const chat = new ChatService()
const app = new Hono()

if (!isProd) {
  await import("hono/cors").then(({ cors }) => {
    app.use(
      "*",
      cors({
        origin: "http://localhost:5173",
        allowMethods: ["GET", "POST", "DELETE", "OPTIONS"],
        credentials: true,
      })
    )
  })
}

function parseNameCookie(req: HonoRequest<any, any>) {
  const cookie = req.header("Cookie")
  const parts = cookie?.split(";").map((s) => s.trim())
  return parts?.find((s) => s.startsWith("username="))?.split("=")[1]
}

const getRequestUserData = (
  req: HonoRequest
): [string, null] | [null, UserData] => {
  const name = parseNameCookie(req)
  if (!name) {
    return ["Not authenticated", null]
  }

  const userData = chat.getUser(name)
  if (!userData) {
    return ["Not authenticated", null]
  }

  return [null, userData]
}

app.get("/sse", async (c) => {
  const name = parseNameCookie(c.req)
  if (!name) {
    c.status(400)
    return c.json({ status: "Not authenticated" })
  }
  return streamSSE(
    c,
    async (stream) => {
      let onRemovedCallback: () => void
      const onRemovedPromise = new Promise<void>((resolve) => {
        onRemovedCallback = resolve
      })
      chat.createUser(stream, name, () => onRemovedCallback())
      await onRemovedPromise
    },
    async (_err, stream) => chat.removeUser(stream)
  )
})

app.get("/api/connect", async (c) => {
  console.log("connect")
  const name = parseNameCookie(c.req) || chat.createUserName()

  if (isProd) {
    c.res.headers.set(
      "Set-Cookie",
      `username=${name}; Path=/; SameSite=None; Secure; HttpOnly; Max-Age=31536000;`
    )
  } else {
    c.res.headers.set(
      "Set-Cookie",
      `username=${name}; Domain=localhost; Path=/; SameSite=Lax; HttpOnly; Max-Age=31536000;`
    )
  }

  return c.json({ name })
})

app.post("/api/chat", async (c) => {
  const [userErr, userData] = getRequestUserData(c.req)
  if (userErr !== null) {
    c.status(400)
    return c.json({ status: userErr })
  }

  if (userData.recentMessageCount >= MAX_RECENT_MESSAGES) {
    c.status(429)
    return c.json({ status: "Too many messages" })
  }

  const body = await c.req.json()
  const [err, dto] = validateChatMessageDTO(body)
  if (err !== null) {
    c.status(400)
    return c.json({ status: err })
  }

  const message = chat.addMessage(userData.name, dto)
  return c.json({ message })
})

app.post("/api/reaction", async (c) => {
  const [userErr, userData] = getRequestUserData(c.req)
  if (userErr !== null) {
    c.status(400)
    return c.json({ status: userErr })
  }

  const body = await c.req.json()
  const [err, dto] = validateReactionDTO(body)
  if (err !== null) {
    c.status(400)
    return c.json({ status: err })
  }

  const [reactionErr, reaction] = chat.reactToMessage(
    userData,
    dto.messageId,
    dto.kind
  )
  if (reactionErr !== null) {
    c.status(400)
    return c.json({ status: reactionErr })
  }
  return c.json({ reaction })
})

app.delete("/api/reaction", async (c) => {
  const [userErr, userData] = getRequestUserData(c.req)
  if (userErr !== null) {
    c.status(400)
    return c.json({ status: userErr })
  }

  const body = await c.req.json()
  const [err, dto] = validateReactionDTO(body)
  if (err !== null) {
    c.status(400)
    return c.json({ status: err })
  }

  chat.removeMessageReaction(userData, dto.messageId, dto.kind)

  return c.json({ status: "OK" })
})

// API routes first - these should not be caught by static middleware
app.get("/api/health", (c) => c.json({ status: "OK" }))

// Serve static files with proper configuration
// The server runs from /app/packages/server, so client files are at ../../client
if (isProd) {
  app.use(
    "/*",
    serveStatic({
      root: "../../client",
      index: "index.html",
    })
  )
}
serve(
  {
    fetch: app.fetch,
    hostname: "0.0.0.0",
    port: 8787,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`)
    if (isProd) {
      console.log(`Serving static files from ../../client`)
    }
  }
)
