import { ChatMessage, Reaction } from "shared"

export type ClientChatMessage = Omit<ChatMessage, "reactions"> & {
  removed?: boolean
  optimistic?: boolean
  localId?: string
  reactions: ClientReaction[]
}

export type ClientReaction = Reaction & {
  optimistic?: boolean
  localId?: string
}
