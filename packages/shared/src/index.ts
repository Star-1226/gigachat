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

export function validateChatMessageDTO(
  message: unknown
): message is ChatMessageDTO {
  return (
    typeof message === "object" &&
    message !== null &&
    "content" in message &&
    typeof (message as ChatMessageDTO).content === "string"
  )
}
