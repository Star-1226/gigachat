import { username } from "$/state"
import { addUserRefToTextArea } from "../utils"
import { useMessageListItem } from "./context"

export function Header() {
  const message = useMessageListItem()
  const isSelfMessage = message.from === username.peek()

  return (
    <div className="w-full flex justify-between text-neutral-400">
      {isSelfMessage ? (
        <small>You</small>
      ) : (
        <button
          className="text-xs hover:text-blue-500"
          title={message.from}
          onclick={() => addUserRefToTextArea(message.from)}
        >
          {message.from}
        </button>
      )}
      <small>
        {message.optimistic
          ? "Sending..."
          : new Date(message.timestamp).toLocaleString()}
      </small>
    </div>
  )
}
