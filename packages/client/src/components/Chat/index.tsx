import { useRef, useSignal } from "kaioken"
import { SSEMessage } from "shared"
import { useSSE } from "../../hooks/useSSE"
import { MessageList } from "./MessageList"
import { ClientChatMessage } from "./types"
import { MessageForm } from "./MessageForm"

export function Chat({ name }: { name: string }) {
  const listRef = useRef<HTMLUListElement>(null)
  const messages = useSignal<ClientChatMessage[]>([])

  useSSE({
    path: "/sse",
    onOpen: () => console.log("SSE opened"),
    onError: (err) => console.log("SSE error", err),
    onMessage: (message) => {
      const parsedMessage = JSON.parse(message) as SSEMessage
      switch (parsedMessage.type) {
        case "message":
          messages.value = [...messages.value, parsedMessage.message]
          listRef.current?.scrollTo(0, listRef.current.scrollHeight)
          break
        case "remove":
          messages.value = messages.value.map((message) => {
            if (message.id === parsedMessage.id) {
              return { ...message, removed: true }
            }
            return message
          })
          break
        case "messages":
          messages.value = parsedMessage.messages
          listRef.current?.scrollTo(0, listRef.current.scrollHeight)
          break
        default:
          console.warn("Unknown SSE message type", parsedMessage)
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
      <MessageList messages={messages} userName={name} />
      <MessageForm />
    </>
  )
}
