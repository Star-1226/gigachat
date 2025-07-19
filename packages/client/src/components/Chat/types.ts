import { ChatMessage } from "shared"

export type ClientChatMessage = ChatMessage & {
  removed?: boolean
}
