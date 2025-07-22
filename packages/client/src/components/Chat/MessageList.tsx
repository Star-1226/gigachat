import { ElementProps, For, StyleObject, unwrap, useComputed } from "kaioken"
import { className as cls } from "kaioken/utils"
import { SERVER_USER_NAME } from "shared"
import {
  emojiPickerMessageId,
  messageListElement,
  messages,
  users,
  username,
} from "$/state"
import { ClientChatMessage } from "$/types"
import { MessageReactions } from "./MessageReactions"
import { addUserRefToTextArea } from "./utils"

export function MessageList() {
  return (
    <ul
      ref={messageListElement}
      className="grow px-4 flex flex-col gap-2 w-full overflow-y-auto"
    >
      <For
        each={messages}
        fallback={
          <MessageListItem className="bg-[#1a1a1a]">
            <i>No messages</i>
          </MessageListItem>
        }
      >
        {(message) => {
          const content = formatContent(message)
          const style: StyleObject = {
            zIndex: emojiPickerMessageId.value === message.id ? 10 : 0,
            opacity: message.optimistic ? "0.5" : "1",
          }

          if (message.from === SERVER_USER_NAME) {
            return (
              <MessageListItem
                key={message.id}
                className="bg-[#1a1a1a]"
                style={style}
              >
                <p className="wrap-break-word font-extralight text-neutral-200">
                  {content}
                </p>
              </MessageListItem>
            )
          }

          const isSelfMessage = message.from === username.peek()

          return (
            <MessageListItem
              key={message.localId ? `temp:${message.localId}` : message.id}
              className={isSelfMessage ? "bg-[#212430]" : "bg-neutral-800"}
              style={style}
            >
              <div className="w-full flex justify-between text-neutral-400">
                {isSelfMessage ? (
                  <small>You</small>
                ) : (
                  <button
                    className="text-xs hover:text-blue-500"
                    title={message.from}
                    onclick={() => addUserRefToTextArea(message.from)}
                  >
                    {message.from}
                  </button>
                )}
                <small>
                  {message.optimistic
                    ? "Sending..."
                    : new Date(message.timestamp).toLocaleString()}
                </small>
              </div>
              <p className="wrap-break-word font-extralight text-neutral-200">
                {content}
              </p>
              <div className="flex w-full items-center">
                <MessageReactions message={message} />
              </div>
            </MessageListItem>
          )
        }}
      </For>
    </ul>
  )
}

function formatContent(message: ClientChatMessage) {
  const raw = message.content as string
  const parts: JSX.Children[] = []

  const selfRefStr = `@${username.peek()}`
  const mentionRegex = /@[\w]+#\d{4}/g
  const linkRegex = /https:\/\/\S+/g

  const matches: {
    start: number
    end: number
    type: "mention" | "link"
    value: string
  }[] = []

  for (const match of raw.matchAll(mentionRegex)) {
    matches.push({
      start: match.index!,
      end: match.index! + match[0].length,
      type: "mention",
      value: match[0],
    })
  }

  for (const match of raw.matchAll(linkRegex)) {
    matches.push({
      start: match.index!,
      end: match.index! + match[0].length,
      type: "link",
      value: match[0],
    })
  }

  matches.sort((a, b) => a.start - b.start)

  let lastIndex = 0

  for (const match of matches) {
    if (match.start > lastIndex) {
      parts.push(raw.slice(lastIndex, match.start))
    }

    if (match.type === "mention") {
      const isSelf = match.value === selfRefStr
      if (isSelf) {
        parts.push(
          <span className={"text-rose-400 font-medium"}>{match.value}</span>
        )
      } else {
        parts.push(<UserReferenceButton username={match.value.substring(1)} />)
      }
    } else if (match.type === "link") {
      parts.push(
        <a
          className="text-blue-500 font-medium underline"
          href={match.value}
          target="_blank"
        >
          {match.value}
        </a>
      )
    }

    lastIndex = match.end
  }

  if (lastIndex < raw.length) {
    parts.push(raw.slice(lastIndex))
  }

  return parts
}

function MessageListItem({ className, ...props }: ElementProps<"li">) {
  return (
    <li
      className={cls(
        "p-2 rounded transition-all duration-300 flex flex-col gap-2 items-start",
        unwrap(className)
      )}
      {...props}
    />
  )
}

type UserReferenceButtonProps = {
  username: string
}
function UserReferenceButton({ username }: UserReferenceButtonProps) {
  const isOffline = useComputed(() => !users.value.includes(username))
  const className = useComputed(() => {
    const color = isOffline.value ? "text-neutral-500" : "text-violet-400"
    return `${color} font-medium transition-colors`
  })
  const title = useComputed(() => {
    return isOffline.value ? `${username} is offline` : `Message ${username}`
  })
  return (
    <button
      disabled={isOffline}
      title={title}
      className={className}
      onclick={() => addUserRefToTextArea(username)}
    >
      @{username}
    </button>
  )
}
