import { useRef } from "kaioken"
import { SSEMessage } from "shared"
import { useSSE } from "../../hooks/useSSE"
import { MessageList } from "./MessageList"
import { MessageForm } from "./MessageForm"
import { messages } from "./state"
import { API_URL } from "../../constants"

export function Chat({ name }: { name: string }) {
  const listRef = useRef<HTMLUListElement>(null)

  useSSE({
    path: API_URL + "/sse",
    onOpen: () => console.log("SSE opened"),
    onError: (err) => console.log("SSE error", err),
    onMessage: (msg) => {
      const data = JSON.parse(msg) as SSEMessage
      switch (data.type) {
        case "message":
          messages.value = [...messages.peek(), data.message]
          listRef.current?.scrollTo(0, listRef.current.scrollHeight)
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
          listRef.current?.scrollTo(0, listRef.current.scrollHeight)
          break
        default:
          console.warn("Unknown SSE message type", data)
      }
    },
  })

  return (
    <>
      <div className="p-4 flex w-full justify-between">
        <h1 className="flex gap-2 text-2xl font-bold">
          GigaChat
          <img src="/favicon.svg" alt="GigaChat" className="w-6" />
        </h1>
        <i
          className="p-2 bg-[#2b4f9e] rounded-lg text-sm font-bold"
          title={`Connected as ${name}`}
        >
          {name}
        </i>
      </div>
      <MessageList userName={name} />
      <MessageForm />
    </>
  )
}
