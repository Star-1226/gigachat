import { MAX_MESSAGE_CHARS, REACTION_EMOJIS } from "./constants.js"
import type { ReactionDTO, ReactionEmoji, ChatMessageDTO } from "./types.js"

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
