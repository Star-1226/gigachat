import { ElementProps, unwrap } from "kaioken"
import { className as cls } from "kaioken/utils"

import { ClientChatMessage } from "$/types"
import { MessageListItemContext } from "./context"

type RootProps = ElementProps<"li"> & {
  message: ClientChatMessage | null
}

export function Root({ className, message, ...props }: RootProps) {
  return (
    <MessageListItemContext.Provider value={message}>
      <li
        className={cls(
          "p-2 rounded transition-all duration-300 flex flex-col gap-2 items-start",
          unwrap(className)
        )}
        {...props}
      />
    </MessageListItemContext.Provider>
  )
}
