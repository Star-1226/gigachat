import { useRef } from "kaioken"

export function useSingleton<T>(callback: () => T): T {
  const value = useRef<T | null>(null)
  const didRun = useRef(false)
  if (!didRun.current) {
    didRun.current = true
    value.current = callback()
  }
  return value.current!
}
