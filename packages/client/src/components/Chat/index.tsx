import { useAppContext } from "kaioken"
import { PROTOCOL_VERSION, SSEMessageWithVersion } from "shared"
import { MessageList } from "./MessageList"
import { MessageForm } from "./MessageForm"
import { messageListElement, messages, users } from "./state"
import { UsersList } from "./UsersList"
import { API_URL } from "../../constants"
import { useSingleton } from "../../hooks/useSingleton"

export function Chat() {
  const ctx = useAppContext()
  const scrollToBottom = () => {
    ctx.scheduler?.nextIdle(() => {
      const el = messageListElement.peek()
      el?.scrollTo(0, el.scrollHeight)
    })
  }

  useSingleton((onCleanup) => {
    const eventSource = new EventSource(API_URL + "/sse", {
      withCredentials: true,
    })

    eventSource.onmessage = (msg) => {
      const data: SSEMessageWithVersion = JSON.parse(msg.data)
      if (data.v !== PROTOCOL_VERSION) {
        alert("New version released. Reloading...")
        return window.location.reload()
      }
      switch (data.type) {
        case "message":
          messages.value = [...messages.peek(), data.message]
          scrollToBottom()
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
          scrollToBottom()
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
    }
    eventSource.onopen = () => console.log("SSE opened")
    eventSource.onerror = (e) => console.log("SSE error", e)

    onCleanup(() => eventSource.close())
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
        <UsersList />
      </div>
      <MessageList />
      <MessageForm onMessageAdded={scrollToBottom} />
    </>
  )
}
