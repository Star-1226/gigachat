import { POST } from "$/api"
import { username, messages } from "$/state"
import { ClientChatMessage } from "$/types"
import { defineOptimisticAction } from "./action"

const createMessage = defineOptimisticAction((content: string) => {
  const localId = crypto.randomUUID()
  const optimisticMessage: ClientChatMessage = {
    id: "",
    content,
    timestamp: Date.now(),
    from: username.peek(),
    reactions: [],
    localId,
  }
  messages.value = [...messages.peek(), optimisticMessage]
  const revert = () => {
    messages.value = messages.peek().filter((m) => m.localId !== localId)
  }

  return {
    revert,
    execute: async () => {
      const { message } = await POST("/chat", { content })

      messages.value = messages.peek().map<ClientChatMessage>((item) => {
        if (item.localId === localId) {
          return { ...message, localId }
        }
        return item
      })
    },
  }
})
export default createMessage
