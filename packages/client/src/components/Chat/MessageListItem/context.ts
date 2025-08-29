import { createContext, useContext } from "kiru"
import { ClientChatMessage } from "$/types"

export const MessageListItemContext = createContext<ClientChatMessage | null>(
  null
)

export const useMessageListItem = () => {
  const message = useContext(MessageListItemContext)
  if (!message) throw new Error("useMessageListItem: No message")
  return message
}
