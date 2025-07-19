import { useState, useViewTransition } from "kaioken"
import { connect } from "./api/handlers"
import { Button } from "./components/Button"
import { Chat } from "./components/Chat"

export function App() {
  const transition = useViewTransition()
  const [username, setUsername] = useState("")
  if (username) {
    return <Chat name={username} />
  }
  return (
    <div className="flex flex-col gap-8 md:gap-16">
      <div className="flex flex-col gap-1 md:gap-4">
        <h1 className="flex gap-4 justify-center text-5xl md:text-8xl">
          GigaChat{" "}
          <img src="/favicon.svg" alt="GigaChat" className="w-12 md:w-24" />
        </h1>
        <i className="text-lg md:text-4xl text-neutral-300 text-center font-light">
          Ephemeral Chat for the Web
        </i>
      </div>

      <Button
        onclick={() =>
          connect().then(
            ({ name }) => transition(() => setUsername(name)),
            () => alert("Failed to connect")
          )
        }
      >
        Connect
      </Button>
    </div>
  )
}
