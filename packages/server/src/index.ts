import { serve } from "@hono/node-server"
import { streamSSE } from "hono/streaming"
import { serveStatic } from "@hono/node-server/serve-static"
import { Hono, type HonoRequest } from "hono"
import { ChatService } from "./chat.js"
import { randomName } from "./random.js"
import { validateChatMessageDTO } from "shared"

const chat = new ChatService()
const app = new Hono()

let globalUserId = 0

app.get("/sse", async (c) => {
  console.log("get /SSE")
  return streamSSE(
    c,
    async (stream) => {
      chat.addSubscriber(stream)
      stream.onAbort(() => chat.removeSubscriber(stream))
      let removedResolver: () => void
      const removedPromise = new Promise<void>((resolve) => {
        removedResolver = resolve
      })
      chat.onSubscriberRemoved(stream, () => removedResolver?.())
      await removedPromise
    },
    async (_err, stream) => chat.removeSubscriber(stream)
  )
})

function parseNameCookie(req: HonoRequest<any, any>) {
  const cookie = req.header("Cookie")
  const parts = cookie?.split(";").map((s) => s.trim())
  return parts?.find((s) => s.startsWith("username="))?.split("=")[1]
}

app.get("/api/connect", async (c) => {
  const name =
    parseNameCookie(c.req) ||
    `${randomName()}#${String(++globalUserId).padStart(3, "0")}`

  c.res.headers.set(
    "Set-Cookie",
    `username=${name}; Path=/; SameSite=None; Secure; HttpOnly; Max-Age=31536000;`
  )
  return c.json({ name })
})

app.post("/api/chat", async (c) => {
  console.log("POST /api/chat")
  const name = parseNameCookie(c.req)
  if (!name) {
    c.status(400)
    return c.json({ status: "Not authenticated" })
  }

  const body = await c.req.json()
  const isValidDTO = validateChatMessageDTO(body)
  if (!isValidDTO) {
    console.log("Invalid message", body)
    c.status(400)
    return c.json({ status: "Invalid message" })
  }

  chat.addMessage({
    id: crypto.randomUUID(),
    role: "user",
    from: name,
    content: body.content,
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
    port: 8787,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`)
    console.log(`Serving static files from ../../client`)
  }
)
