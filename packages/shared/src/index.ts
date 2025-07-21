export * from "./constants.js"
import { MAX_MESSAGE_CHARS } from "./constants.js"

export const REACTION_EMOJIS = [
  "👍",
  "👎",
  "🙏",
  "👏",
  "👌",
  "🫡",
  "🤯",
  "🤣",
  "😭",
  "😤",
  "👀",
  "❤️",
  "🫎",
  "🔥",
  "💸",
  "⚡",
  "🚩",
  "✅",
  "❌",
  "🎉",
] as const

export type ReactionEmoji = (typeof REACTION_EMOJIS)[number]

export type Reaction = {
  kind: ReactionEmoji
  from: string
}

export type ReactionDTO = {
  kind: ReactionEmoji
  messageId: string
}

function isValidReactionDTOShape(message: unknown): message is ReactionDTO {
  return (
    typeof message === "object" &&
    message !== null &&
    "kind" in message &&
    typeof message.kind === "string" &&
    "messageId" in message &&
    typeof message.messageId === "string"
  )
}

export function validateReactionDTO(
  message: unknown
): [null, ReactionDTO] | [string, null] {
  if (!isValidReactionDTOShape(message)) return ["Invalid reaction shape", null]
  if (!REACTION_EMOJIS.includes(message.kind as ReactionEmoji)) {
    return ["Unknown emoji", null]
  }
  return [null, message]
}

export type ChatMessage = {
  id: string
  content: string
  timestamp: number
  from: string
  reactions: Reaction[]
}

export type ChatMessageDTO = {
  content: string
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

function isValidMessageDTOShape(message: unknown): message is ChatMessageDTO {
  return (
    typeof message === "object" &&
    message !== null &&
    "content" in message &&
    typeof message.content === "string"
  )
}

export function validateChatMessageDTO(
  message: unknown
): [null, ChatMessageDTO] | [string, null] {
  if (!isValidMessageDTOShape(message)) return ["Invalid message shape", null]

  if (message.content.length > MAX_MESSAGE_CHARS)
    return [`Message too long (max ${MAX_MESSAGE_CHARS} chars)`, null]

  return [null, message]
}
