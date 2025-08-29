import { signal, watch } from "kiru"
import { ClientChatMessage } from "$/types"
import { notifications } from "./notifications"

export const messages = signal<ClientChatMessage[]>([])
export const emojiPickerMessageId = signal<string | null>(null)
export const unreadMessages = signal<string[]>([])

const originalTitle = document.title
watch([unreadMessages], (msgs) => {
  if (msgs.length === 0) {
    document.title = originalTitle
    return
  }
  document.title = `(${msgs.length}) - ${originalTitle}`
  console.log("new title", `(${msgs.length}) - ${originalTitle}`)
})

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    unreadMessages.value = []
    notifications.forEach((n) => n.close())
    notifications.clear()
  }
})
