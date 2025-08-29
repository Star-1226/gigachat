import { useViewTransition } from "kiru"
import {
  connectionState,
  ConnectionState,
  connect,
  connectionError,
} from "$/state"

import { Button } from "$/components/Button"

export function HomeScreen() {
  const transition = useViewTransition()
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
        disabled={connectionState.value !== ConnectionState.Idle}
        style="view-transition-name: user-button;"
        onclick={() => connect(transition)}
      >
        {connectionState.value === ConnectionState.Idle
          ? "Connect"
          : "Connecting..."}
      </Button>
      {connectionError.value && (
        <p className="text-red-300 text-center rounded-lg font-medium">
          Error: {connectionError.value}
        </p>
      )}
    </div>
  )
}
