import { ReactionEmoji } from "shared"
import { POST } from "$/api"
import { messages, username } from "$/state"
import { ClientChatMessage, ClientReaction } from "$/types"
import { defineOptimisticAction } from "./action"

const createReaction = defineOptimisticAction(
  (message: ClientChatMessage, kind: ReactionEmoji) => {
    const id = `temp-${crypto.randomUUID()}`
    const temp: ClientReaction = {
      id,
      kind,
      from: username.peek(),
      optimistic: true,
    }
    messages.value = messages.peek().map((item) => {
      if (item.id === message.id) {
        return { ...item, reactions: [...item.reactions, temp] }
      }
      return item
    })
    const revert = () => {
      messages.value = messages.peek().map((item) => {
        if (item.id === message.id) {
          return {
            ...item,
            reactions: item.reactions.filter((r) => r.id !== id),
          }
        }
        return item
      })
    }

    return {
      revert,
      execute: async () => {
        const { reaction } = await POST("/reaction", {
          kind: kind,
          messageId: message.id,
        })

        messages.value = messages.peek().map((item) => {
          if (item.id === message.id) {
            return {
              ...item,
              reactions: item.reactions.map((r) => {
                return r.id === id ? reaction : r
              }),
            }
          }
          return item
        })
        return reaction
      },
    }
  }
)

export default createReaction
