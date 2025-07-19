export * from "./constants.js"
import { MAX_MESSAGE_CHARS } from "./constants.js"

export type ChatMessage = {
  id: string
  role: "user" | "server"
  content: string
  timestamp: number
  from: string
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
): [null, string] | [string, null] {
  if (!isValidMessageDTOShape(message)) return ["Invalid message shape", null]

  if (message.content.length > MAX_MESSAGE_CHARS)
    return [`Message too long (max ${MAX_MESSAGE_CHARS} chars)`, null]

  return [null, message.content]
}
