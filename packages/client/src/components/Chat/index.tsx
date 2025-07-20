import { Derive, For, signal, useRef } from "kaioken"
import { SSEMessage } from "shared"
import { useSSE } from "../../hooks/useSSE"
import { MessageList } from "./MessageList"
import { MessageForm } from "./MessageForm"
import { messages, otherUsers, users } from "./state"
import { API_URL } from "../../constants"
import { username } from "../../state"
import { Button } from "../Button"
import { CircleIcon } from "../../icons/CircleIcon"
import { useClickOutside } from "@kaioken-core/hooks"

const showUsersList = signal(false)

export function Chat() {
  const messageListRef = useRef<HTMLUListElement>(null)
  const usersListRef = useRef<HTMLDivElement>(null)
  const userButtonRef = useRef<HTMLButtonElement>(null)
  useClickOutside(usersListRef, () => (showUsersList.value = false), {
    ignore: [userButtonRef],
  })

  useSSE({
    path: API_URL + "/sse",
    onOpen: () => console.log("SSE opened"),
    onError: (err) => console.log("SSE error", err),
    onMessage: (msg) => {
      const data = JSON.parse(msg) as SSEMessage
      switch (data.type) {
        case "message":
          messages.value = [...messages.peek(), data.message]
          messageListRef.current?.scrollTo(
            0,
            messageListRef.current.scrollHeight
          )
          break
        case "remove":
          messages.value = messages.peek().map((message) => {
            if (message.id === data.id) {
              return { ...message, removed: true }
            }
            return message
          })
          break
        case "messages":
          messages.value = data.messages
          messageListRef.current?.scrollTo(
            0,
            messageListRef.current.scrollHeight
          )
          break
        case "+reaction":
          messages.value = messages.peek().map((message) => {
            if (message.id === data.id) {
              return {
                ...message,
                reactions: [...message.reactions, data.reaction],
              }
            }
            return message
          })
          break
        case "-reaction":
          messages.value = messages.peek().map((message) => {
            if (message.id === data.id) {
              return {
                ...message,
                reactions: message.reactions.filter(
                  (reaction) =>
                    !(
                      reaction.from === data.reaction.from &&
                      reaction.kind === data.reaction.kind
                    )
                ),
              }
            }
            return message
          })
          break
        case "users":
          users.value = data.users
          break
        case "+user":
          users.value = [...users.peek(), data.id]
          break
        case "-user":
          users.value = users.peek().filter((user) => user !== data.id)
          break
        default:
          console.warn("Unknown SSE message type", data)
      }
    },
  })

  return (
    <>
      <div className="p-4 flex w-full justify-between">
        <h1
          className="flex gap-2 text-2xl font-bold"
          style="view-transition-name: title;"
        >
          GigaChat
          <img src="/favicon.svg" alt="GigaChat" className="w-6" />
        </h1>
        <div className="relative">
          <Button
            ref={userButtonRef}
            onclick={() => (showUsersList.value = !showUsersList.peek())}
            title={`Connected as ${username}`}
            className="flex gap-1"
          >
            <CircleIcon fill="currentColor" className="text-green-500 w-3" />
            {username}
          </Button>
          <Derive from={showUsersList}>
            {(show) =>
              !show ? null : (
                <div
                  ref={usersListRef}
                  className="absolute right-0 bottom-0-0 z-10 w-full"
                >
                  <ul className="bg-neutral-800 p-1 shadow shadow-neutral-900 rounded text-neutral-300 text-sm">
                    <For
                      each={otherUsers}
                      fallback={
                        <li className="text-xs p-2">No users online</li>
                      }
                    >
                      {(user) =>
                        user === username.peek() ? null : (
                          <li className="text-xs p-2">{user}</li>
                        )
                      }
                    </For>
                  </ul>
                </div>
              )
            }
          </Derive>
        </div>
      </div>
      <MessageList />
      <MessageForm />
    </>
  )
}
