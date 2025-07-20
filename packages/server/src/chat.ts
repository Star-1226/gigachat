import type { SSEStreamingApi } from "hono/streaming"
import {
  MESSAGE_EXPIRATION_MS,
  type ChatMessage,
  type ChatMessageDTO,
  type Reaction,
  type ReactionEmoji,
  type SSEMessage,
} from "shared"
import { randomFarewell, randomGreeting, randomName } from "./random.js"

type Connection = SSEStreamingApi
export type UserData = {
  name: string
  onRemoved: () => void
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
  }

  createUserName() {
    return `${randomName()}#${String(++this.#globalUserId).padStart(4, "0")}`
  }

  getUser(name: string) {
    return this.#namesToUserData.get(name)
  }

  createUser(connection: Connection, name: string, onRemoved: () => void) {
    const userData: UserData = {
      name,
      onRemoved,
    }
    this.#connectionsToUserData.set(connection, userData)
    this.#namesToUserData.set(name, userData)

    connection.onAbort(() => this.removeUser(connection))

    const messagesPayload = JSON.stringify({
      type: "messages",
      messages: this.#messages,
    } satisfies SSEMessage)

    connection.writeSSE({
      data: messagesPayload,
      event: "message",
    })

    const usersPayload = JSON.stringify({
      type: "users",
      users: Array.from(this.#namesToUserData.keys()),
    } satisfies SSEMessage)

    connection.writeSSE({
      data: usersPayload,
      event: "message",
    })

    this.broadcastWithExclude(name, {
      type: "+user",
      id: name,
    })

    this.addMessage("GigaChat", { content: randomGreeting(name) }, "server")
  }

  removeUser(connection: Connection) {
    const data = this.#connectionsToUserData.get(connection)
    if (!data) return
    const { name, onRemoved } = data
    this.#connectionsToUserData.delete(connection)
    this.#namesToUserData.delete(name)
    this.broadcast({ type: "-user", id: name })
    this.addMessage("GigaChat", { content: randomFarewell(name) }, "server")
    onRemoved()
  }

  addMessage(
    name: string,
    dto: ChatMessageDTO,
    role: ChatMessage["role"] = "user"
  ) {
    const message: ChatMessage = {
      id: crypto.randomUUID(),
      role,
      from: name,
      content: dto.content,
      timestamp: Date.now(),
      reactions: [],
    }
    this.#messages.push(message)

    setTimeout(() => this.removeMessage(message.id), MESSAGE_EXPIRATION_MS)

    this.broadcastWithExclude(name, {
      type: "message",
      message,
    })

    return message
  }

  reactToMessage(
    userData: UserData,
    messageId: ChatMessage["id"],
    reactionKind: ReactionEmoji
  ): [string, null] | [null, Reaction] {
    const message = this.#messages.find((message) => message.id === messageId)
    if (!message) return ["Not found", null]

    const reaction: Reaction = { kind: reactionKind, from: userData.name }

    if (
      message.reactions.some(
        (reaction) =>
          reaction.from === userData.name && reaction.kind === reactionKind
      )
    ) {
      return [null, reaction]
    }

    message.reactions.push(reaction)
    this.broadcastWithExclude(userData.name, {
      type: "+reaction",
      id: messageId,
      reaction,
    })

    return [null, reaction]
  }

  removeMessageReaction(
    userData: UserData,
    messageId: ChatMessage["id"],
    reactionKind: ReactionEmoji
  ) {
    const message = this.#messages.find((message) => message.id === messageId)
    if (!message) return

    let reaction: Reaction | undefined
    message.reactions = message.reactions.filter((item) => {
      if (item.from === userData.name && item.kind === reactionKind) {
        reaction = item
        return false
      }
      return true
    })
    if (!reaction) return

    this.broadcastWithExclude(userData.name, {
      type: "-reaction",
      id: messageId,
      reaction,
    })
  }

  private removeMessage(id: string) {
    this.#messages = this.#messages.filter((message) => message.id !== id)
    this.broadcast({ type: "remove", id })
  }

  private broadcast(payload: SSEMessage) {
    this.#connectionsToUserData.forEach((_, connection) => {
      connection.writeSSE({
        data: JSON.stringify(payload),
        event: "message",
      })
    })
  }

  private broadcastWithExclude(exclude: string, payload: SSEMessage) {
    this.#connectionsToUserData.forEach((data, connection) => {
      if (data.name === exclude) return
      connection.writeSSE({
        data: JSON.stringify(payload),
        event: "message",
      })
    })
  }
}
