import { ChatMessage } from "./chatMessage"
import { Reaction } from "./reactions"

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
