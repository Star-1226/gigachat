import { Hono } from "hono"
import { serve } from "@hono/node-server"
import { streamSSE } from "hono/streaming"
import { serveStatic } from "@hono/node-server/serve-static"
import { validateChatMessageDTO, validateReactionDTO } from "shared"
import { ChatService } from "./chat.js"
import { getRequestUserData, parseNameCookie } from "./utils.js"

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

app.get("/sse", async (c) => {
  const name = parseNameCookie(c.req)
  if (!name) {
    c.status(400)
    return c.json({ status: "Not authenticated" })
  }
  return streamSSE(
    c,
    async (stream) => {
      stream.onAbort(() => {
        console.log("stream onAbort")
      })
      // apparently stream.onAbort doesn't work 🤔😔
      // https://github.com/honojs/hono/issues/1770
      c.req.raw.signal.addEventListener("abort", () => {
        chat.removeUser(stream)
      })
      let onRemovedCallback: () => void
      const onRemovedPromise = new Promise<void>((resolve) => {
        onRemovedCallback = resolve
      })
      chat.createUser(stream, name, {
        onRemoved: () => onRemovedCallback(),
      })
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
  const [userErr, userData] = getRequestUserData(c, chat)
  if (userErr !== null) {
    c.status(userErr.code)
    return c.json({ status: userErr.status })
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
  const [userErr, userData] = getRequestUserData(c, chat)
  if (userErr !== null) {
    c.status(userErr.code)
    return c.json({ status: userErr.status })
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
  const [userErr, userData] = getRequestUserData(c, chat)
  if (userErr !== null) {
    c.status(userErr.code)
    return c.json({ status: userErr.status })
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
