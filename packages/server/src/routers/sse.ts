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
      // apparently stream.onAbort() doesn't work, so we have to do this workaround 🤔😔
      // https://github.com/honojs/hono/issues/1770
      stream.onAbort(() => {})
      c.req.raw.signal.addEventListener("abort", () => {
        ChatService.removeUser(stream)
      })

      const { promise: streamFinished, resolve: finishStream } =
        Promise.withResolvers<void>()

      ChatService.createUser({
        name,
        stream,
        onRemoved: () => finishStream(),
      })

      await streamFinished
    },
    async (_err, stream) => ChatService.removeUser(stream)
  )
})

export default router
