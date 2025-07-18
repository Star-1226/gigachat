import { For, useRef, useSignal } from "kaioken"
import type { ChatMessage, SSEMessage } from "shared"
import { connect, sendMessage } from "./api/handlers"

function useSingleton<T>(callback: () => T): T {
  const value = useRef<T | null>(null)
  const didRun = useRef(false)
  if (!didRun.current) {
    didRun.current = true
    value.current = callback()
  }
  return value.current!
}

function useSSE(config: {
  path: string
  onMessage?: (message: string) => void
  onOpen?: () => void
  onError?: (evt: Event) => void
}) {
  const { path, onMessage, onOpen, onError } = config
  return useSingleton(() => {
    console.log("useSSE - configuring event source")
    const eventSource = new EventSource(path)
    eventSource.onmessage = (event) => onMessage?.(event.data)
    eventSource.onopen = () => onOpen?.()
    eventSource.onerror = (e) => onError?.(e)
    return eventSource
  })
}

export function App() {
  const messages = useSignal<ChatMessage[]>([])
  const inputText = useSignal("")
  const username = useSignal("")
  useSSE({
    path: "/sse",
    onOpen: () => console.log("SSE opened"),
    onError: (err) => console.log("SSE error", err),
    onMessage: (message) => {
      const parsedMessage = JSON.parse(message) as SSEMessage
      switch (parsedMessage.type) {
        case "message":
          messages.value = [...messages.value, parsedMessage.message]
          break
        case "remove":
          messages.value = messages.value.filter(
            (message) => !parsedMessage.messages.includes(message.id)
          )
          break
        case "messages":
          messages.value = parsedMessage.messages
          break
        default:
          console.warn("Unknown SSE message type", parsedMessage)
      }
    },
  })

  const name = username.value
  if (!name) {
    return (
      <button
        onclick={async () => {
          const { name } = await connect()
          username.value = name
        }}
      >
        Connect to continue...
      </button>
    )
  }

  return (
    <>
      <p>Connected as {name}</p>
      <form
        className="flex gap-4"
        onsubmit={async (e) => {
          e.preventDefault()
          try {
            await sendMessage(inputText.value)
            inputText.value = ""
          } catch (error) {
            alert(error)
          }
        }}
      >
        <input bind:value={inputText} />
        <button type="submit">Send</button>
      </form>
      <ul>
        <For each={messages} fallback={<i>No messages</i>}>
          {(message) => <li>{message.content}</li>}
        </For>
      </ul>
    </>
  )
}
