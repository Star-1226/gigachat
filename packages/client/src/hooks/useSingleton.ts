import { useEffect, useRef } from "kaioken"

export function useSingleton<T>(
  factory: (onCleanup: (cleanupFn: () => void) => void) => T
): T {
  const cleanup = useRef<() => void>(() => {})
  const value = useRef<T | null>(null)
  const didRun = useRef(false)
  if (!didRun.current) {
    didRun.current = true
    value.current = factory((cb) => (cleanup.current = cb))
  }
  useEffect(() => cleanup.current, [])
  return value.current!
}
