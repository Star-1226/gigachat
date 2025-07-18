import { useSingleton } from "./useSingleton"

export function useSSE(config: {
  path: string
  onMessage?: (message: string) => void
  onOpen?: () => void
  onError?: (evt: Event) => void
}) {
  const { path, onMessage, onOpen, onError } = config
  return useSingleton(() => {
    console.log("useSSE - configuring event source")
    const eventSource = new EventSource(path)
    eventSource.onmessage = (event) => onMessage?.(event.data)
    eventSource.onopen = () => onOpen?.()
    eventSource.onerror = (e) => onError?.(e)
    return eventSource
  })
}
