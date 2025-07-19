import { serve } from "@hono/node-server"
import { streamSSE } from "hono/streaming"
import { serveStatic } from "@hono/node-server/serve-static"
import { Hono, type HonoRequest } from "hono"
import { ChatService } from "./chat.js"
import { validateChatMessageDTO, MAX_RECENT_MESSAGES } from "shared"

const chat = new ChatService()
const app = new Hono()

function parseNameCookie(req: HonoRequest<any, any>) {
  const cookie = req.header("Cookie")
  const parts = cookie?.split(";").map((s) => s.trim())
  return parts?.find((s) => s.startsWith("username="))?.split("=")[1]
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
  const name = parseNameCookie(c.req) || chat.createUserName()

  c.res.headers.set(
    "Set-Cookie",
    `username=${name}; Path=/; SameSite=None; Secure; HttpOnly; Max-Age=31536000;`
  )
  return c.json({ name })
})

app.post("/api/chat", async (c) => {
  const name = parseNameCookie(c.req)
  if (!name) {
    c.status(400)
    return c.json({ status: "Not authenticated" })
  }

  const userData = chat.getUser(name)
  if (!userData) {
    c.status(400)
    return c.json({ status: "Not authenticated" })
  }

  if (userData.recentMessageCount >= MAX_RECENT_MESSAGES) {
    c.status(429)
    return c.json({ status: "Too many messages" })
  }

  const body = await c.req.json()
  const [err, content] = validateChatMessageDTO(body)
  if (err !== null) {
    c.status(400)
    return c.json({ status: err })
  }

  chat.addMessage({
    id: crypto.randomUUID(),
    role: "user",
    from: name,
    content,
    timestamp: Date.now(),
  })
  return c.text("OK", 200)
})

// API routes first - these should not be caught by static middleware
app.get("/api/hello", (c) => {
  return c.json({ message: "Hello from Hono API!" })
})

// Serve static files with proper configuration
// The server runs from /app/packages/server, so client files are at ../../client
app.use(
  "/*",
  serveStatic({
    root: "../../client",
    index: "index.html",
  })
)

serve(
  {
    fetch: app.fetch,
    hostname: "0.0.0.0",
    port: 8787,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`)
    console.log(`Serving static files from ../../client`)
  }
)
