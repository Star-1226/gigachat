import { useContext } from "kaioken"
import { username } from "$/state"
import { addUserRefToTextArea } from "../utils"
import { MessageListItemContext } from "./context"

export function Header() {
  const message = useContext(MessageListItemContext)
  if (!message) return console.error("Header: No message"), null

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
