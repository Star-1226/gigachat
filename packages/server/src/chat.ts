import type { SSEStreamingApi } from "hono/streaming"
import {
  MESSAGE_EXPIRATION_MS,
  PROTOCOL_VERSION,
  SERVER_USER_NAME,
  type ChatMessage,
  type ChatMessageDTO,
  type Reaction,
  type ReactionEmoji,
  type SSEMessage,
  type SSEMessageWithVersion,
} from "shared"
import { randomFarewell, randomGreeting, randomName } from "./random.js"

type Connection = SSEStreamingApi
export type UserData = {
  name: string
  onRemoved: () => void
}

function formatMessage<T extends SSEMessage>(
  message: T
): { data: string; event: "message" } {
  return {
    data: JSON.stringify({
      ...message,
      v: PROTOCOL_VERSION,
    } satisfies SSEMessageWithVersion),
    event: "message",
  }
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
    // this.#namesToUserData = new Map(
    //   Array.from({ length: 100 }).map((asd, i) => [
    //     `user-${i}`,
    //     { name: `user-${i}`, onRemoved: () => {} },
    //   ])
    // )
    this.#globalUserId = 0
  }

  createUserName() {
    return `${randomName()}#${String(++this.#globalUserId).padStart(4, "0")}`
  }

  getUser(name: string) {
    return this.#namesToUserData.get(name)
  }

  createUser(
    connection: Connection,
    name: string,
    opts: { onRemoved: () => void }
  ) {
    const userData: UserData = {
      name,
      onRemoved: opts.onRemoved,
    }
    this.#connectionsToUserData.set(connection, userData)
    this.#namesToUserData.set(name, userData)

    connection.writeSSE(
      formatMessage({
        type: "messages",
        messages: this.#messages,
      })
    )

    connection.writeSSE(
      formatMessage({
        type: "users",
        users: Array.from(this.#namesToUserData.keys()),
      })
    )

    this.broadcastWithExclude(name, {
      type: "+user",
      id: name,
    })

    this.addMessage(SERVER_USER_NAME, { content: randomGreeting(name) })
  }

  removeUser(connection: Connection) {
    const data = this.#connectionsToUserData.get(connection)
    if (!data) return
    const { name, onRemoved } = data
    this.#connectionsToUserData.delete(connection)
    this.#namesToUserData.delete(name)
    this.broadcast({ type: "-user", id: name })
    this.addMessage(SERVER_USER_NAME, { content: randomFarewell(name) })
    onRemoved()
  }

  addMessage(name: string, dto: ChatMessageDTO) {
    const message: ChatMessage = {
      id: crypto.randomUUID(),
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
    const msg = formatMessage(payload)
    this.#connectionsToUserData.forEach((_, connection) => {
      connection.writeSSE(msg)
    })
  }

  private broadcastWithExclude(exclude: string, payload: SSEMessage) {
    const msg = formatMessage(payload)
    this.#connectionsToUserData.forEach((data, connection) => {
      if (data.name === exclude) return
      connection.writeSSE(msg)
    })
  }
}
