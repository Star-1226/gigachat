import { API_URL } from "../constants"
import { ClientChatMessage } from "$/types"
import { ChatMessageDTO, Reaction, ReactionDTO } from "shared"

export async function authenticate(): Promise<{ name: string }> {
  const response = await fetch(API_URL + "/api/auth", {
    credentials: "include",
  })
  return response.json()
}

export async function sendMessage(
  dto: ChatMessageDTO
): Promise<{ message: ClientChatMessage }> {
  const response = await fetch(API_URL + "/api/chat", {
    credentials: "include",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dto),
  })
  if (!response.ok) {
    throw new Error(response.statusText)
  }
  return response.json()
}

export async function sendMessageReaction(dto: ReactionDTO): Promise<{
  reaction: Reaction
}> {
  const response = await fetch(API_URL + "/api/reaction", {
    credentials: "include",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dto),
  })
  if (!response.ok) {
    throw new Error(response.statusText)
  }
  return response.json()
}

export async function sendMessageReactionDelete(dto: ReactionDTO) {
  const response = await fetch(API_URL + "/api/reaction", {
    credentials: "include",
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dto),
  })
  if (!response.ok) {
    throw new Error(response.statusText)
  }
}
