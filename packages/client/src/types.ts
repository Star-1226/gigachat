import { ChatMessage, Reaction } from "shared"

export type ClientChatMessage = Omit<ChatMessage, "reactions"> & {
  optimistic?: boolean
  reactions: ClientReaction[]
}

export type ClientReaction = Reaction & {
  id?: string
  optimistic?: boolean
}
