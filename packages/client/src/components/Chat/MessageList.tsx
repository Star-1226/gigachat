import { Signal, useRef, For, Transition } from "kaioken"
import { className as cls } from "kaioken/utils"
import { ClientChatMessage } from "./types"

type MessageListProps = {
  messages: Signal<ClientChatMessage[]>
  userName: string
}
export function MessageList({ messages, userName }: MessageListProps) {
  const listRef = useRef<HTMLUListElement>(null)
  const removeMessage = (id: string) => {
    messages.value = messages.value.filter((message) => message.id !== id)
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
            key={message.id}
            duration={{ in: 0, out: 300 }}
            in={!message.removed}
            initialState="exited"
            onTransitionEnd={(s) => s === "exited" && removeMessage(message.id)}
            element={(state) => {
              const opacity = state === "entered" ? "1" : "0"
              const scale = state === "entered" ? "1" : "0"
              const isSelfMessage = message.from === userName

              return (
                <li
                  style={{ opacity, scale }}
                  className={cls(
                    "p-2 rounded transition-all duration-300",
                    "flex flex-col gap-2 items-start",
                    isSelfMessage ? "bg-[#212430]" : "bg-neutral-800"
                  )}
                >
                  <div className="w-full flex justify-between text-neutral-400">
                    <small>{isSelfMessage ? "You" : message.from}</small>
                    <small>
                      {new Date(message.timestamp).toLocaleString()}
                    </small>
                  </div>
                  <p className="wrap-break-word">{message.content}</p>
                </li>
              )
            }}
          />
        )}
      </For>
    </ul>
  )
}
