import type { SSEStreamingApi } from "hono/streaming"
import {
  MESSAGE_EXPIRATION_MS,
  type ChatMessage,
  type ChatMessageDTO,
} from "shared"
import { randomName } from "./random.js"

type Connection = SSEStreamingApi
type UserData = {
  name: string
  onRemoved: () => void
  recentMessageCount: number
}

export class ChatService {
  #messages: ChatMessage[]
  #connectionsToUserData: Map<Connection, UserData>
  #namesToUserData: Map<string, UserData>
  #globalUserId: number

  constructor() {
    this.#messages = []
    this.#connectionsToUserData = new Map()
    this.#namesToUserData = new Map()
    this.#globalUserId = 0
    // to limit to 10 messages per minute,
    // we need to drop the count by 1 every 6 seconds
    setInterval(() => {
      this.#connectionsToUserData.forEach((data) => {
        if (data.recentMessageCount === 0) return
        data.recentMessageCount--
      })
    }, 6000)
  }

  createUserName() {
    return `${randomName()}#${String(++this.#globalUserId).padStart(4, "0")}`
  }

  getUser(name: string) {
    return this.#namesToUserData.get(name)
  }

  createUser(connection: Connection, name: string, onRemoved: () => void) {
    const data: UserData = {
      name,
      onRemoved,
      recentMessageCount: 0,
    }
    this.#connectionsToUserData.set(connection, data)
    this.#namesToUserData.set(name, data)

    connection.onAbort(() => this.removeUser(connection))
    connection.writeSSE({
      data: JSON.stringify({
        type: "messages",
        messages: this.#messages,
      }),
      event: "message",
    })
  }

  removeUser(connection: Connection) {
    const data = this.#connectionsToUserData.get(connection)
    if (!data) return
    const { name, onRemoved } = data
    this.#connectionsToUserData.delete(connection)
    this.#namesToUserData.delete(name)
    onRemoved()
  }

  addMessage(name: string, dto: ChatMessageDTO) {
    const data = this.#namesToUserData.get(name)
    if (!data) return
    data.recentMessageCount++

    const message: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      from: name,
      content: dto.content,
      timestamp: Date.now(),
    }
    this.#messages.push(message)

    setTimeout(() => this.removeMessage(message.id), MESSAGE_EXPIRATION_MS)

    this.#connectionsToUserData.forEach((data, connection) => {
      if (data.name === name) return
      connection.writeSSE({
        data: JSON.stringify({
          type: "message",
          message,
        }),
        event: "message",
      })
    })

    return message
  }

  private removeMessage(id: string) {
    this.#messages = this.#messages.filter((message) => message.id !== id)
    this.#connectionsToUserData.forEach((_, connection) => {
      connection.writeSSE({
        data: JSON.stringify({
          type: "remove",
          id,
        }),
        event: "message",
      })
    })
  }
}
