import { Hono } from "hono"
import { streamSSE } from "hono/streaming"
import ChatService from "../services/ChatService.js"
import { parseAuthCookie } from "../auth.js"

const router = new Hono().basePath("/sse")

router.get("/", async (c) => {
  const name = parseAuthCookie(c.req)
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
        ChatService.removeUser(stream)
      })
      let onRemovedCallback: () => void
      const onRemovedPromise = new Promise<void>((resolve) => {
        onRemovedCallback = resolve
      })
      ChatService.createUser(stream, name, {
        onRemoved: () => onRemovedCallback(),
      })
      await onRemovedPromise
    },
    async (_err, stream) => ChatService.removeUser(stream)
  )
})

export default router
