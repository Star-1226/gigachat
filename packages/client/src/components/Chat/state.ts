import { computed, signal, watch } from "kaioken"
import { ClientChatMessage } from "./types"
import { username } from "../../state"

export const messages = signal<ClientChatMessage[]>([])

const messageCountChangedCallbacks = new Set<() => void>()
export const onMessageCountChanged = (callback: () => void) => {
  messageCountChangedCallbacks.add(callback)
  return () => messageCountChangedCallbacks.delete(callback)
}

let prevCount = 0
watch([messages], (msgs) => {
  if (msgs.length === prevCount) return
  prevCount = msgs.length
  for (const callback of messageCountChangedCallbacks) {
    callback()
  }
})

export const emojiPickerMessageId = signal<string | null>(null)

export const users = signal<string[]>([])
export const otherUsers = computed(() =>
  users.value.filter((user) => user !== username.peek())
)

export const messageListElement = signal<HTMLUListElement | null>(null)
