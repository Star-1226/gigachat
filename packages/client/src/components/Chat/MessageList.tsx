import { For, StyleObject } from "kaioken"
import { SERVER_USER_NAME } from "shared"
import {
  emojiPickerMessageId,
  messageListElement,
  messages,
  username,
} from "$/state"
import MessageListItem from "./MessageListItem"

export function MessageList() {
  return (
    <ul
      ref={messageListElement}
      className="grow px-4 flex flex-col gap-2 w-full overflow-y-auto"
    >
      <For
        each={messages}
        fallback={
          <MessageListItem.Root message={null} className="bg-[#1a1a1a]">
            <i>No messages</i>
          </MessageListItem.Root>
        }
      >
        {(message) => {
          if (message.from === SERVER_USER_NAME) {
            return (
              <MessageListItem.Root
                message={message}
                key={message.id}
                className="bg-[#1a1a1a]"
              >
                <MessageListItem.Content />
              </MessageListItem.Root>
            )
          }

          const style: StyleObject = {
            zIndex: emojiPickerMessageId.value === message.id ? 10 : 0,
            opacity: message.optimistic ? "0.5" : "1",
          }

          const isSelfMessage = message.from === username.peek()

          return (
            <MessageListItem.Root
              message={message}
              key={message.localId ? `temp:${message.localId}` : message.id}
              className={isSelfMessage ? "bg-[#212430]" : "bg-neutral-800"}
              style={style}
            >
              <MessageListItem.Header />
              <MessageListItem.Content />
              <MessageListItem.Reactions />
            </MessageListItem.Root>
          )
        }}
      </For>
    </ul>
  )
}
