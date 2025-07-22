import { Hono } from "hono"
import {
  validateChatMessageDTO,
  validateReactionDTO,
  type ReactionDTO,
} from "shared"
import { parseAuthCookie, authParserMiddleware } from "../auth.js"
import { isProd } from "../env.js"
import ChatService from "../services/ChatService.js"
import { createMiddleware } from "hono/factory"

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

  return c.json({ name })
})

router.post("/chat", authParserMiddleware, async (c) => {
  const user = c.get("user")
  const body = await c.req.json()
  const [err, dto] = validateChatMessageDTO(body)
  if (err !== null) {
    c.status(400)
    return c.json({ status: err })
  }

  const message = ChatService.addMessage(user.name, dto)
  return c.json({ message })
})

const reactionParserMiddleware = createMiddleware<{
  Variables: { dto: ReactionDTO }
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
  .use("/reaction", reactionParserMiddleware, authParserMiddleware)
  .post(async (c) => {
    const user = c.get("user"),
      dto = c.get("dto")
    const [reactionErr, reaction] = ChatService.reactToMessage(
      user,
      dto.messageId,
      dto.kind
    )
    if (reactionErr !== null) {
      c.status(400)
      return c.json({ status: reactionErr })
    }
    return c.json({ reaction })
  })
  .delete(async (c) => {
    const user = c.get("user"),
      dto = c.get("dto")

    ChatService.removeMessageReaction(user, dto.messageId, dto.kind)

    return c.json({ status: "OK" })
  })

export default router
