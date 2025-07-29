import { ReactionEmoji } from "shared"
import { DELETE } from "$/api"
import { messages, username } from "$/state"
import { ClientChatMessage, ClientReaction } from "$/types"
import { defineOptimisticAction } from "./action"

const deleteReaction = defineOptimisticAction(
  (
    message: ClientChatMessage,
    kind: ReactionEmoji,
    reaction: ClientReaction
  ) => {
    messages.value = messages.peek().map((item) => {
      if (item.id === message.id) {
        return {
          ...item,
          reactions: item.reactions.filter(
            (r) => !(r.kind === kind && r.from === username.peek())
          ),
        }
      }
      return item
    })
    const revert = () => {
      messages.value = messages.peek().map((item) => {
        if (item.id === message.id) {
          return { ...item, reactions: [...item.reactions, reaction] }
        }
        return item
      })
    }

    return {
      revert,
      execute: () => {
        return DELETE("/reaction", {
          kind,
          messageId: message.id,
        })
      },
    }
  }
)

export default deleteReaction
