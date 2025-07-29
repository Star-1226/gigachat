import { useContext, useMemo, useComputed } from "kaioken"
import { username, users } from "$/state"
import { ClientChatMessage } from "$/types"
import { addUserRefToTextArea } from "../utils"
import { MessageListItemContext } from "./context"

export function Content() {
  const message = useContext(MessageListItemContext)
  if (!message) return console.error("Content: No message"), null
  const formatted = useMemo(() => formatContent(message), [message])

  return (
    <p className="wrap-break-word font-extralight text-neutral-200">
      {formatted}
    </p>
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
        parts.push(
          <MessageUserReferenceButton username={match.value.substring(1)} />
        )
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

type MessageUserReferenceButtonProps = {
  username: string
}
function MessageUserReferenceButton({
  username,
}: MessageUserReferenceButtonProps) {
  const isOffline = useComputed(() => !users.value.includes(username))
  const className = useComputed(() => {
    const color = isOffline.value ? "text-neutral-400" : "text-violet-400"
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
