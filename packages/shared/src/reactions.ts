import { GigaAPI } from "./api"

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

function isValidReactionDTOShape(
  message: unknown
): message is GigaAPI["/reaction"]["POST"]["in"] {
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
): [null, GigaAPI["/reaction"]["POST"]["in"]] | [string, null] {
  if (!isValidReactionDTOShape(message)) return ["Invalid reaction shape", null]
  if (!REACTION_EMOJIS.includes(message.kind as ReactionEmoji)) {
    return ["Unknown emoji", null]
  }
  return [null, message]
}
