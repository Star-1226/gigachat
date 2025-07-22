import { sendMessageReaction, sendMessageReactionDelete } from "$/api/handlers"
import { emojiPickerMessageId, username, messages } from "$/state"
import { ClientChatMessage, ClientReaction } from "$/types"
import { ReactionEmoji } from "shared"

export async function handleReactionClick(
  message: ClientChatMessage,
  kind: ReactionEmoji
) {
  emojiPickerMessageId.value = null
  const existingReaction = message.reactions.find(
    (reaction) => reaction.kind === kind && reaction.from === username.peek()
  )
  if (existingReaction) {
    return removeReaction(message, kind, existingReaction)
  }
  return addReaction(message, kind)
}

async function addReaction(message: ClientChatMessage, kind: ReactionEmoji) {
  const temp: ClientReaction = {
    kind,
    from: username.peek(),
    localId: crypto.randomUUID(),
    optimistic: true,
  }

  messages.value = messages.peek().map((item) => {
    if (item.id === message.id) {
      return { ...item, reactions: [...item.reactions, temp] }
    }
    return item
  })

  try {
    const { reaction } = await sendMessageReaction({
      kind,
      messageId: message.id,
    })

    messages.value = messages.peek().map((item) => {
      if (item.id === message.id) {
        return {
          ...item,
          reactions: item.reactions.map((r) => {
            if (r.localId === temp.localId) {
              return reaction
            }
            return r
          }),
        }
      }
      return item
    })
  } catch (error) {
    console.error("addReaction", error)
    messages.value = messages.peek().map((item) => {
      if (item.id === message.id) {
        return {
          ...item,
          reactions: item.reactions.filter((r) => r.localId !== temp.localId),
        }
      }
      return item
    })
  }
}

async function removeReaction(
  message: ClientChatMessage,
  kind: ReactionEmoji,
  reaction: ClientReaction
) {
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

  try {
    await sendMessageReactionDelete({
      kind,
      messageId: message.id,
    })
  } catch (error) {
    console.error("removeReaction", error)
    messages.value = messages.peek().map((item) => {
      if (item.id === message.id) {
        return { ...item, reactions: [...item.reactions, reaction] }
      }
      return item
    })
  }
}
