import type { REACTION_EMOJIS } from "./constants.js"

export type ChatMessage = {
  id: string
  content: string
  timestamp: number
  from: string
  reactions: Reaction[]
}

export type ChatMessageDTO = {
  content: ChatMessage["content"]
}

export type ReactionEmoji = (typeof REACTION_EMOJIS)[number]

export type Reaction = {
  kind: ReactionEmoji
  from: string
}

export type ReactionDTO = {
  messageId: ChatMessage["id"]
  kind: Reaction["kind"]
}

export type SSEMessage =
  | {
      type: "remove"
      id: ChatMessage["id"]
    }
  | {
      type: "message"
      message: ChatMessage
    }
  | {
      type: "messages"
      messages: ChatMessage[]
    }
  | {
      type: "+reaction"
      id: ChatMessage["id"]
      reaction: Reaction
    }
  | {
      type: "-reaction"
      id: ChatMessage["id"]
      reaction: Reaction
    }
  | {
      type: "users"
      users: string[]
    }
  | {
      type: "+user"
      id: string
    }
  | {
      type: "-user"
      id: string
    }

export type SSEMessageWithVersion = SSEMessage & {
  v: number
}

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
      in: ChatMessageDTO
      out: { message: ChatMessage }
    }
    GET: never
    DELETE: never
  }
  "/reaction": {
    POST: {
      in: ReactionDTO
      out: { reaction: Reaction }
    }
    GET: never
    DELETE: {
      in: ReactionDTO
      out: { status: "OK" }
    }
  }
}
