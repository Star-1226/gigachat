import { signal } from "kaioken"
import { ClientChatMessage } from "./types"

export const messages = signal<ClientChatMessage[]>([])

export const emojiListMessageId = signal<string | null>(null)
