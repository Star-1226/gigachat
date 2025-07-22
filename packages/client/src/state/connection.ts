import { signal } from "kaioken"
import { API_URL } from "../constants"
import { authenticate } from "../api/handlers"
import { PROTOCOL_VERSION, SSEMessageWithVersion } from "shared"

export enum ConnectionState {
  Idle,
  Connecting,
  Connected,
}

export const connectionState = signal(ConnectionState.Idle)
export const connectionError = signal<string | null>(null)
export const username = signal<string>("")
export const eventSource = signal<EventSource | null>(null)

const incomingMsgQueue = [] as SSEMessageWithVersion[]
const msgHandler = {
  current: null as ((event: SSEMessageWithVersion) => void) | null,
}

export function onEventSourceMessage(
  callback: (event: SSEMessageWithVersion) => void
) {
  msgHandler.current = callback
  if (incomingMsgQueue.length > 0) {
    incomingMsgQueue.forEach((e) => callback(e))
    incomingMsgQueue.length = 0
  }
  return () => (msgHandler.current = null)
}

export async function connect(transition: (callback: () => void) => void) {
  const minDur = 750
  const start = Date.now()

  transition(() => {
    connectionError.value = null
    connectionState.value = ConnectionState.Connecting
  })

  try {
    console.log("Authenticating...")
    const { name } = await authenticate()
    username.value = name
    console.log("Authenticated.")
  } catch (error) {
    console.error("Failed to authenticate.")
    return transition(() => {
      connectionError.value = (error as Error).message
      connectionState.value = ConnectionState.Idle
    })
  }

  console.log("Connecting to SSE...")
  const evtSrc = (eventSource.value = new EventSource(API_URL + "/sse", {
    withCredentials: true,
  }))

  evtSrc.onmessage = (e) => {
    const data = JSON.parse(e.data) as SSEMessageWithVersion
    if (data.v !== PROTOCOL_VERSION) {
      alert("New version released. Reloading...")
      return window.location.reload()
    }
    if (!msgHandler.current) {
      return incomingMsgQueue.push(data)
    }
    msgHandler.current(data)
  }

  evtSrc.onopen = () => {
    const remaining = minDur - (Date.now() - start)
    new Promise((res) => setTimeout(res, remaining)).then(() => {
      console.log("SSE connected.")
      transition(() => (connectionState.value = ConnectionState.Connected))
    })
  }
  evtSrc.onerror = () => {
    transition(() => {
      connectionError.value = "Disconnected. Reconnecting..."
      connectionState.value = ConnectionState.Connecting
    })
  }
}
