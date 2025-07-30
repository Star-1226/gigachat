import { Hono } from "hono"
import { createMiddleware } from "hono/factory"
import {
  validateChatMessageDTO,
  validateReactionDTO,
  type GigaAPI,
} from "shared"
import ChatService from "../services/ChatService.js"
import { parseAuthCookie, authParserMiddleware } from "../auth.js"
import { isProd } from "../env.js"

const router = new Hono().basePath("/api")

router.get("/health", (c) => c.json({ status: "OK" }))

router.get("/auth", async (c) => {
  const name = parseAuthCookie(c.req) || ChatService.createUserName()

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

  return c.json({ name } satisfies GigaAPI["/auth"]["GET"]["out"])
})

router.post("/chat", authParserMiddleware, async (c) => {
  const user = c.get("user")
  const body = await c.req.json()
  const [err, dto] = validateChatMessageDTO(body)
  if (err !== null) {
    c.status(400)
    return c.json({ status: err })
  }

  const message = ChatService.createMessage(user.name, dto)
  return c.json({ message } satisfies GigaAPI["/chat"]["POST"]["out"])
})

const reactionParserMiddleware = createMiddleware<{
  Variables: { dto: GigaAPI["/reaction"]["POST" | "DELETE"]["in"] }
}>(async (c, next) => {
  const body = await c.req.json()
  const [err, dto] = validateReactionDTO(body)
  if (err !== null) {
    c.status(400)
    return c.json({ status: err })
  }
  c.set("dto", dto)
  await next()
})

router
  .use("/reaction", authParserMiddleware, reactionParserMiddleware)
  .post(async (c) => {
    const user = c.get("user"),
      dto = c.get("dto")
    const [reactionErr, reaction] = ChatService.createReaction(user, dto)
    if (reactionErr !== null) {
      c.status(400)
      return c.json({ status: reactionErr })
    }
    return c.json({ reaction } satisfies GigaAPI["/reaction"]["POST"]["out"])
  })
  .delete(async (c) => {
    const user = c.get("user"),
      dto = c.get("dto")

    ChatService.deleteReaction(user, dto)

    return c.json({
      status: "OK",
    } satisfies GigaAPI["/reaction"]["DELETE"]["out"])
  })

export default router
