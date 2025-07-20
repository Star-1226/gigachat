import { useRef, For, Transition, useMemo } from "kaioken"
import { className as cls } from "kaioken/utils"
import { emojiListMessageId, messages } from "./state"
import { username } from "../../state"
import { MessageReactions } from "./MessageReactions"
import { ClientChatMessage } from "./types"

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
              const content = useMemo(() => formatContent(message), [])

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
                  <p className="wrap-break-word">{content}</p>
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

function formatContent(message: ClientChatMessage) {
  let raw = message.content as string
  const parts: JSX.Children[] = []

  const selfRefStr = `@${username.peek()}`
  const linkRegex = /https:\/\/\S+/g

  let lastIndex = 0

  // Combine all highlights into one pass: mentions and links
  const matches: {
    start: number
    end: number
    type: "mention" | "link"
  }[] = []

  if (message.from !== username.peek()) {
    let idx = raw.indexOf(selfRefStr)
    while (idx !== -1) {
      matches.push({
        start: idx,
        end: idx + selfRefStr.length,
        type: "mention",
      })
      idx = raw.indexOf(selfRefStr, idx + 1)
    }
  }

  for (const match of raw.matchAll(linkRegex)) {
    matches.push({
      start: match.index!,
      end: match.index! + match[0].length,
      type: "link",
    })
  }

  // Sort by position so we can slice safely
  matches.sort((a, b) => a.start - b.start)

  for (const match of matches) {
    if (match.start > lastIndex) {
      parts.push(raw.slice(lastIndex, match.start))
    }

    const value = raw.slice(match.start, match.end)
    if (match.type === "mention") {
      parts.push(<span className="text-rose-400">{value}</span>)
    } else if (match.type === "link") {
      parts.push(
        <a className="text-blue-500" href={value} target="_blank">
          {value}
        </a>
      )
    }

    lastIndex = match.end
  }

  // Remaining text after last match
  if (lastIndex < raw.length) {
    parts.push(raw.slice(lastIndex))
  }

  return parts
}
