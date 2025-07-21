import { useClickOutside } from "@kaioken-core/hooks"
import { useRef, Derive, For, useSignal } from "kaioken"

import { CircleIcon } from "../../icons/CircleIcon"
import { username } from "../../state"
import { Button } from "../Button"
import { otherUsers } from "./state"

export function UsersList() {
  const showUsersList = useSignal(false)
  const usersListRef = useRef<HTMLDivElement>(null)
  const userButtonRef = useRef<HTMLButtonElement>(null)
  useClickOutside(usersListRef, () => (showUsersList.value = false), {
    ignore: [userButtonRef],
  })

  return (
    <div className="relative">
      <Button
        ref={userButtonRef}
        onclick={() => (showUsersList.value = !showUsersList.peek())}
        title={`Connected as ${username}`}
        className="flex gap-1"
      >
        <CircleIcon fill="currentColor" className="text-green-500 w-3" />
        {username}
      </Button>
      <Derive from={showUsersList}>
        {(show) =>
          !show ? null : (
            <div
              ref={usersListRef}
              className="absolute right-0 bottom-0-0 z-10 w-full"
            >
              <ul className="bg-neutral-800 p-1 shadow shadow-neutral-900 rounded text-neutral-300 text-sm">
                <For
                  each={otherUsers}
                  fallback={<li className="text-xs p-2">No users online</li>}
                >
                  {(user) =>
                    user === username.peek() ? null : (
                      <li className="text-xs p-2">{user}</li>
                    )
                  }
                </For>
              </ul>
            </div>
          )
        }
      </Derive>
    </div>
  )
}
