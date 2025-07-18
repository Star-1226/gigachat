import { Derive, useSignal } from "kaioken"
import { connect } from "./api/handlers"
import { Button } from "./components/Button"
import { Chat } from "./components/Chat"

export function App() {
  const username = useSignal("")
  return (
    <Derive from={username}>
      {(name) =>
        !name ? (
          <Button
            onclick={async () => {
              const { name } = await connect()
              username.value = name
            }}
          >
            Connect to continue...
          </Button>
        ) : (
          <Chat name={name} />
        )
      }
    </Derive>
  )
}
