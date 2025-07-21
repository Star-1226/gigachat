import { Derive, Portal, useMemo, useRef, useViewTransition } from "kaioken"
import { className as cls } from "kaioken/utils"
import { ReactionEmoji } from "shared"
import {
  sendMessageReactionDelete,
  sendMessageReaction,
} from "../../api/handlers"
import { SmilePlusIcon } from "../../icons/SmilePlusIcon"
import { username } from "../../state"
import { emojiPickerMessageId, messages } from "./state"
import { ClientChatMessage, ClientReaction } from "./types"
import { EmojiPicker } from "./EmojiPicker"

type MessageReactionsProps = {
  message: ClientChatMessage
}
export function MessageReactions({ message }: MessageReactionsProps) {
  const transition = useViewTransition()
  const btnRef = useRef<HTMLButtonElement>(null)
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
    <div className="flex gap-2">
      <button
        data-name="emoji-picker-toggle"
        ref={btnRef}
        className={cls(
          "rounded-full p-1 text-neutral-300",
          "hover:bg-blue-300/25 focus:bg-blue-300/25",
          "hover:text-neutral-200 focus:text-neutral-200"
        )}
        disabled={message.optimistic}
        onclick={() => {
          transition(() => {
            if (emojiPickerMessageId.value === message.id) {
              emojiPickerMessageId.value = null
              return
            }
            emojiPickerMessageId.value = message.id
          })
        }}
      >
        <SmilePlusIcon />
      </button>
      <Derive from={emojiPickerMessageId}>
        {(id) =>
          id === message.id && (
            <Portal container={() => document.getElementById("portal-root")!}>
              <EmojiPicker
                messageId={message.id}
                anchorRef={btnRef}
                onEmojiSelect={(kind) => handleReactionClick(message, kind)}
                dismiss={(e) => {
                  /**
                   * the clickoutside handler already ignores btnRef.
                   * if we're clicking on another emoji picker, there's
                   * no need to set emojiPickerMessageId to null.
                   */
                  if (
                    e.target instanceof HTMLButtonElement &&
                    e.target.dataset.name === "emoji-picker-toggle"
                  ) {
                    return
                  }
                  transition(() => (emojiPickerMessageId.value = null))
                }}
              />
            </Portal>
          )
        }
      </Derive>
      <ul className="flex flex-wrap gap-2">
        {Object.entries(reactionsMap).map(([kind, count]) => {
          const selfReaction = selfReactions.find((r) => r.kind === kind)

          return (
            <li key={kind}>
              <button
                className={cls(
                  "flex items-center gap-1 rounded-lg border px-1",
                  selfReaction
                    ? `border-blue-500 text-blue-400 bg-blue-300/12.5 hover:bg-blue-300/20 ${
                        selfReaction.optimistic ? "" : ""
                      }`
                    : "border-white/5 bg-white/2.5 hover:bg-white/7.5"
                )}
                onclick={() =>
                  handleReactionClick(message, kind as ReactionEmoji)
                }
              >
                <span className="text-lg">{kind}</span>
                <span className="text-xs font-medium">{count}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

async function handleReactionClick(
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
