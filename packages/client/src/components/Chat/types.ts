import { ChatMessage } from "shared"

export type ClientChatMessage = ChatMessage & {
  removed?: boolean
  optimistic?: boolean
  localId?: string
}
