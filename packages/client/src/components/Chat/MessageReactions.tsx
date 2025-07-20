import { Derive, useMemo } from "kaioken"
import { className as cls } from "kaioken/utils"
import { ReactionEmoji } from "shared"
import {
  sendMessageReactionDelete,
  sendMessageReaction,
} from "../../api/handlers"
import { SmilePlusIcon } from "../../icons/SmilePlusIcon"
import { username } from "../../state"
import { emojiListMessageId, messages } from "./state"
import { ClientChatMessage } from "./types"
import { EmojiList } from "./EmojiList"

type MessageReactionsProps = {
  message: ClientChatMessage
}
export function MessageReactions({ message }: MessageReactionsProps) {
  const { reactionsMap, selfReactions } = useMemo(() => {
    const reactionsMap = message.reactions.reduce((acc, reaction) => {
      acc[reaction.kind] = (acc[reaction.kind] || 0) + 1
      return acc
    }, {} as Record<ReactionEmoji, number>)

    const selfReactions = message.reactions.filter(
      (reaction) => reaction.from === username.peek()
    )

    return {
      reactionsMap,
      selfReactions,
    }
  }, [message])

  return (
    <ul className="flex flex-wrap gap-2">
      {Object.entries(reactionsMap).map(([kind, count]) => (
        <li key={kind}>
          <button
            className={cls(
              "flex items-center gap-1 rounded-lg border",
              selfReactions.some((r) => r.kind === kind)
                ? "border-blue-500 text-blue-400 bg-blue-300/12.5 hover:bg-blue-300/20"
                : "border-white/5 bg-white/2.5 hover:bg-white/7.5"
            )}
            onclick={() => handleReactionClick(message, kind as ReactionEmoji)}
          >
            <span>{kind}</span>
            <span className="text-xs pr-1 font-medium">{count}</span>
          </button>
        </li>
      ))}
      <li className="relative z-10">
        <button onclick={() => (emojiListMessageId.value = message.id)}>
          <SmilePlusIcon />
        </button>
        <Derive from={emojiListMessageId}>
          {(id) =>
            id === message.id && (
              <EmojiList
                onEmojiSelect={(kind) => handleReactionClick(message, kind)}
                dismiss={() => (emojiListMessageId.value = null)}
              />
            )
          }
        </Derive>
      </li>
    </ul>
  )
}

async function handleReactionClick(
  message: ClientChatMessage,
  kind: ReactionEmoji
) {
  emojiListMessageId.value = null

  if (
    message.reactions.some(
      (reaction) => reaction.kind === kind && reaction.from === username.peek()
    )
  ) {
    try {
      await sendMessageReactionDelete({
        kind,
        messageId: message.id,
      })
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
    } catch (error) {
      alert(error)
    }
    return
  }

  try {
    const { reaction } = await sendMessageReaction({
      kind,
      messageId: message.id,
    })
    messages.value = messages.peek().map((item) => {
      if (item.id === message.id) {
        return { ...item, reactions: [...item.reactions, reaction] }
      }
      return item
    })
  } catch (error) {
    alert(error)
  }
}
