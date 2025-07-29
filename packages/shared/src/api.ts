import { ChatMessage, Reaction, ReactionEmoji } from "."

export type GigaAPI = {
  "/auth": {
    POST: never
    GET: {
      out: { name: string }
    }
    DELETE: never
  }
  "/health": {
    POST: never
    GET: {
      out: { status: "OK" }
    }
    DELETE: never
  }
  "/chat": {
    POST: {
      in: { content: string }
      out: { message: ChatMessage }
    }
    GET: never
    DELETE: never
  }
  "/reaction": {
    POST: {
      in: { messageId: string; kind: ReactionEmoji }
      out: { reaction: Reaction }
    }
    GET: never
    DELETE: {
      in: { messageId: string; kind: ReactionEmoji }
      out: { status: "OK" }
    }
  }
}
