import { HomeScreen, ChatScreen } from "./screens"
import { ConnectionState, connectionState } from "./state/connection"

export function App() {
  return connectionState.value === ConnectionState.Connected ? (
    <ChatScreen />
  ) : (
    <HomeScreen />
  )
}
