import { API_URL } from "../constants"
import { ClientChatMessage } from "../components/Chat/types"

export async function connect(): Promise<{ name: string }> {
  const response = await fetch(API_URL + "/api/connect", {
    credentials: "include",
  })
  return response.json()
}

export async function sendMessage(
  content: string
): Promise<{ message: ClientChatMessage }> {
  const response = await fetch(API_URL + "/api/chat", {
    credentials: "include",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content }),
  })
  if (!response.ok) {
    throw new Error(response.statusText)
  }
  return response.json()
}
