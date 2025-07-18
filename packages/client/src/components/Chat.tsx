import { For, Transition, useComputed, useRef, useSignal } from "kaioken"
import { ChatMessage, SSEMessage } from "shared"
import { useSSE } from "../hooks/useSSE"
import { sendMessage } from "../api/handlers"
import { Button } from "./Button"
import { SendIcon } from "../icons/SendIcon"

type ClientChatMessage = ChatMessage & {
  removed?: boolean
}

export function Chat({ name }: { name: string }) {
  const listRef = useRef<HTMLUListElement>(null)
  const messages = useSignal<ClientChatMessage[]>([])
  const inputText = useSignal("")
  const isInputTextInvalid = useComputed(() => !inputText.value.length)

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

  const removeMessage = (id: string) => {
    messages.value = messages.value.filter((message) => message.id !== id)
  }

  return (
    <>
      <div className="p-4">
        <i className="p-2 bg-blue-600 rounded-lg text-sm">
          Connected as <b>{name}</b>
        </i>
      </div>
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
              onTransitionEnd={(s) =>
                s === "exited" && removeMessage(message.id)
              }
              element={(state) => {
                const opacity = state === "entered" ? "1" : "0"
                const scale = state === "entered" ? "1" : "0"
                return (
                  <li
                    style={{ opacity, scale }}
                    className={[
                      "p-2 rounded bg-neutral-800 transition-all duration-300",
                      "flex flex-col gap-2 items-start",
                    ].join(" ")}
                  >
                    <div className="w-full flex justify-between text-neutral-400">
                      <small>{message.from}</small>
                      <small>
                        {new Date(message.timestamp).toLocaleString()}
                      </small>
                    </div>
                    <p>{message.content}</p>
                  </li>
                )
              }}
            />
          )}
        </For>
      </ul>
      <form
        className="flex items-center justify-center w-full p-4"
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
        <div className="flex gap-2 w-full bg-neutral-700 p-2 rounded-lg">
          <input
            bind:value={inputText}
            className="grow rounded-lg p-2 bg-neutral-800 text-sm"
          />
          <Button disabled={isInputTextInvalid} type="submit">
            <SendIcon />
          </Button>
        </div>
      </form>
    </>
  )
}
