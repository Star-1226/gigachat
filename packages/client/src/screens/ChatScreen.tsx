import { useAppContext, useEffect } from "kaioken"
import {
  notify,
  prepareNotifications,
  onSSE,
  messageListElement,
  messages,
  unreadMessages,
  users,
} from "$/state"

import { MessageList } from "$/components/Chat/MessageList"
import { MessageForm } from "$/components/Chat/MessageForm"
import { UsersList } from "$/components/Chat/UsersList"

export function ChatScreen() {
  const ctx = useAppContext()

  const scrollToBottom = () => {
    ctx.scheduler?.nextIdle(() => {
      const el = messageListElement.peek()
      el?.scrollTo(0, el.scrollHeight)
    })
  }

  useEffect(prepareNotifications, [])

  useEffect(() => {
    return onSSE((data) => {
      switch (data.type) {
        case "message":
          messages.value = [...messages.peek(), data.message]
          scrollToBottom()
          if (document.visibilityState === "hidden") {
            unreadMessages.value = [...unreadMessages.peek(), data.message.id]
            notify(data.message.id, `${data.message.from}`, {
              body: data.message.content,
              badge: "/favicon.svg",
              silent: true,
            })
          }
          break
        case "remove":
          messages.value = messages.peek().filter((message) => {
            return message.id !== data.id
          })
          unreadMessages.value = unreadMessages
            .peek()
            .filter((id) => id !== data.id)
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
    })
  }, [])

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
