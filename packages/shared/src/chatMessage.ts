import { GigaAPI } from "./api"
import { MAX_MESSAGE_CHARS } from "./constants"
import { Reaction } from "./reactions"

export type ChatMessage = {
  id: string
  content: string
  timestamp: number
  from: string
  reactions: Reaction[]
}

function isValidMessageDTOShape(
  message: unknown
): message is GigaAPI["/chat"]["POST"]["in"] {
  return (
    typeof message === "object" &&
    message !== null &&
    "content" in message &&
    typeof message.content === "string"
  )
}

export function validateChatMessageDTO(
  message: unknown
): [null, GigaAPI["/chat"]["POST"]["in"]] | [string, null] {
  if (!isValidMessageDTOShape(message)) return ["Invalid message shape", null]

  if (message.content.length > MAX_MESSAGE_CHARS)
    return [`Message too long (max ${MAX_MESSAGE_CHARS} chars)`, null]

  return [null, message]
}
