import { ReactionEmoji } from "shared"
import { POST } from "$/api"
import { messages, username } from "$/state"
import { ClientChatMessage, ClientReaction } from "$/types"
import { defineOptimisticAction } from "./action"

const createReaction = defineOptimisticAction(
  (message: ClientChatMessage, kind: ReactionEmoji) => {
    const localId = crypto.randomUUID()
    const temp: ClientReaction = {
      kind,
      from: username.peek(),
      localId,
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
            reactions: item.reactions.filter((r) => r.localId !== localId),
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
                if (r.localId === localId) {
                  return reaction
                }
                return r
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
