import type { SSEStreamingApi } from "hono/streaming"
import {
  MESSAGE_EXPIRATION_MS,
  type ChatMessage,
  type ChatMessageDTO,
  type Reaction,
  type ReactionEmoji,
  type SSEMessage,
} from "shared"
import { randomName } from "./random.js"

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

    const payload = JSON.stringify({
      type: "messages",
      messages: this.#messages,
    } satisfies SSEMessage)

    connection.writeSSE({
      data: payload,
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

    const message: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      from: name,
      content: dto.content,
      timestamp: Date.now(),
      reactions: [],
    }
    this.#messages.push(message)

    setTimeout(() => this.removeMessage(message.id), MESSAGE_EXPIRATION_MS)

    const payload = JSON.stringify({
      type: "message",
      message,
    } satisfies SSEMessage)

    this.#connectionsToUserData.forEach((data, connection) => {
      if (data.name === name) return
      connection.writeSSE({
        data: payload,
        event: "message",
      })
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

    const payload = JSON.stringify({
      type: "+reaction",
      id: messageId,
      reaction,
    } satisfies SSEMessage)

    this.#connectionsToUserData.forEach((data, connection) => {
      if (data.name === userData.name) return
      connection.writeSSE({
        data: payload,
        event: "message",
      })
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

    const payload = JSON.stringify({
      type: "-reaction",
      id: messageId,
      reaction,
    } satisfies SSEMessage)

    this.#connectionsToUserData.forEach((data, connection) => {
      if (data.name === userData.name) return
      connection.writeSSE({
        data: payload,
        event: "message",
      })
    })
  }

  private removeMessage(id: string) {
    this.#messages = this.#messages.filter((message) => message.id !== id)

    const payload = JSON.stringify({
      type: "remove",
      id,
    } satisfies SSEMessage)

    this.#connectionsToUserData.forEach((_, connection) => {
      connection.writeSSE({
        data: payload,
        event: "message",
      })
    })
  }
}
