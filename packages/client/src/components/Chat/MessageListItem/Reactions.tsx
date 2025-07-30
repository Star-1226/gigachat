import {
  useContext,
  useViewTransition,
  useRef,
  useMemo,
  Derive,
  Portal,
} from "kaioken"
import { className as cls } from "kaioken/utils"
import type { ReactionEmoji } from "shared"
import { username, emojiPickerMessageId } from "$/state"
import { ClientChatMessage } from "$/types"

import createReaction from "$/actions/reaction.create"
import deleteReaction from "$/actions/reaction.delete"

import { MessageListItemContext } from "./context"
import { SmilePlusIcon } from "$/icons/SmilePlusIcon"
import { EmojiPicker } from "./EmojiPicker"

export function Reactions() {
  const message = useContext(MessageListItemContext)
  if (!message) return console.error("Reactions: No message"), null

  const transition = useViewTransition()
  const btnRef = useRef<HTMLButtonElement>(null)
  const messageReactions = useMemo(() => {
    const { reactions } = message

    return {
      counts: reactions.reduce<Partial<Record<ReactionEmoji, number>>>(
        (acc, { kind }) => ({
          ...acc,
          [kind]: (acc[kind] || 0) + 1,
        }),
        {}
      ),
      self: reactions.filter((reaction) => reaction.from === username.peek()),
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
            if (emojiPickerMessageId.peek() === message.id) {
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
                onEmojiSelect={(kind) => {
                  emojiPickerMessageId.value = null
                  toggleReaction(message, kind)
                }}
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
        {(
          Object.entries(messageReactions.counts) as [ReactionEmoji, number][]
        ).map(([kind, count]) => {
          const selfReaction = messageReactions.self.find(
            (r) => r.kind === kind
          )

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
                onclick={() => toggleReaction(message, kind)}
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

function toggleReaction(message: ClientChatMessage, kind: ReactionEmoji) {
  const existingReaction = message.reactions.find(
    (reaction) => reaction.kind === kind && reaction.from === username.peek()
  )
  if (!existingReaction) {
    return createReaction(message, kind)
  }
  return deleteReaction(message, kind, existingReaction)
}
