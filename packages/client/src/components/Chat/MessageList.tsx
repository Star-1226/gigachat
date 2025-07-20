import { useRef, For, Transition } from "kaioken"
import { className as cls } from "kaioken/utils"
import { emojiListMessageId, messages } from "./state"
import { username } from "../../state"
import { MessageReactions } from "./MessageReactions"

export function MessageList() {
  const listRef = useRef<HTMLUListElement>(null)
  const removeMessage = (id: string, localId?: string) => {
    messages.value = messages
      .peek()
      .filter(
        (message) =>
          (id && message.id !== id) || (localId && message.localId !== localId)
      )
  }
  return (
    <ul
      ref={listRef}
      className="grow px-4 flex flex-col gap-2 w-full overflow-y-auto"
    >
      <For
        each={messages}
        fallback={<i className="p-2 rounded bg-neutral-800">No messages</i>}
      >
        {(message) => (
          <Transition
            key={message.localId ? `temp:${message.localId}` : message.id}
            duration={{ in: 0, out: 300 }}
            in={!message.removed}
            initialState="exited"
            onTransitionEnd={(s) =>
              s === "exited" && removeMessage(message.id, message.localId)
            }
            element={(state) => {
              const opacity =
                state === "entered" ? (message.optimistic ? "0.5" : "1") : "0"
              const scale = state === "entered" ? "1" : "0.75"
              const translateY =
                state === "entered" ? "0" : message.removed ? "-100%" : "100%"
              const isSelfMessage = message.from === username.peek()

              return (
                <li
                  style={{
                    opacity,
                    scale,
                    transform: `translateY(${translateY})`,
                  }}
                  className={cls(
                    "p-2 rounded transition-all duration-300",
                    "flex flex-col gap-2 items-start",
                    isSelfMessage ? "bg-[#212430]" : "bg-neutral-800",
                    emojiListMessageId.value === message.id && "z-10"
                  )}
                >
                  <div className="w-full flex justify-between text-neutral-400">
                    <small>{isSelfMessage ? "You" : message.from}</small>
                    <small>
                      {message.optimistic
                        ? "Sending..."
                        : new Date(message.timestamp).toLocaleString()}
                    </small>
                  </div>
                  <p className="wrap-break-word">{message.content}</p>
                  {!message.optimistic && (
                    <div className="flex justify-end w-full">
                      <MessageReactions message={message} />
                    </div>
                  )}
                </li>
              )
            }}
          />
        )}
      </For>
    </ul>
  )
}
