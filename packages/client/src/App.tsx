import { useViewTransition } from "kaioken"
import { connect } from "./api/handlers"
import { Button } from "./components/Button"
import { Chat } from "./components/Chat"
import { username } from "./state"

export function App() {
  const transition = useViewTransition()
  const name = username.value
  if (name) {
    return <Chat />
  }
  return (
    <div className="flex flex-col gap-8 md:gap-16">
      <div className="flex flex-col gap-1 md:gap-4">
        <h1
          className="flex gap-4 justify-center text-5xl md:text-8xl font-bold "
          style="view-transition-name: title;"
        >
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
            ({ name }) => transition(() => (username.value = name)),
            () => alert("Failed to connect")
          )
        }
      >
        Connect
      </Button>
    </div>
  )
}
