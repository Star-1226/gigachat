import { POST } from "$/api"
import { username, messages } from "$/state"
import { ClientChatMessage } from "$/types"
import { defineOptimisticAction } from "./action"

const createMessage = defineOptimisticAction((content: string) => {
  const id = `temp-${crypto.randomUUID()}`
  const optimisticMessage: ClientChatMessage = {
    id,
    content,
    timestamp: Date.now(),
    from: username.peek(),
    reactions: [],
    optimistic: true,
  }
  messages.value = [...messages.peek(), optimisticMessage]
  const revert = () => {
    messages.value = messages.peek().filter((m) => m.id !== id)
  }

  return {
    revert,
    execute: async () => {
      const { message } = await POST("/chat", { content })

      messages.value = messages.peek().map((item) => {
        return item.id === id ? message : item
      })
    },
  }
})
export default createMessage
