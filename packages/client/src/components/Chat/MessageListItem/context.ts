import { createContext } from "kaioken"
import { ClientChatMessage } from "$/types"

export const MessageListItemContext = createContext<ClientChatMessage | null>(
  null
)
