import { computed, signal } from "kaioken"
import { ClientChatMessage } from "./types"
import { username } from "../../state"

export const messages = signal<ClientChatMessage[]>([])

export const emojiListMessageId = signal<string | null>(null)

export const users = signal<string[]>([])
export const otherUsers = computed(() =>
  users.value.filter((user) => user !== username.peek())
)
