import type {
  SSEStreamingApi,
  SSEMessage as HonoSSEMessage,
} from "hono/streaming"
import {
  MESSAGE_EXPIRATION_MS,
  PROTOCOL_VERSION,
  SERVER_USER_NAME,
  type ChatMessage,
  type ChatMessageDTO,
  type Reaction,
  type ReactionDTO,
  type SSEMessage,
  type SSEMessageWithVersion,
} from "shared"
import { randomFarewell, randomGreeting, randomName } from "../random.js"

type Stream = SSEStreamingApi
export type UserData = {
  name: string
  onRemoved: () => void
}

export class ChatService {
  #messages: ChatMessage[]
  #streamToUser: Map<Stream, UserData>
  #nameToUser: Map<string, UserData>
  #globalUserId: number

  constructor() {
    this.#messages = []
    this.#streamToUser = new Map()
    this.#nameToUser = new Map()
    // this.#nameToUser = new Map(
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
    return this.#nameToUser.get(name)
  }

  createUser(cfg: { name: string; stream: Stream; onRemoved: () => void }) {
    const { name, stream, onRemoved } = cfg
    const userData: UserData = {
      name,
      onRemoved,
    }
    this.#streamToUser.set(stream, userData)
    this.#nameToUser.set(name, userData)

    stream.writeSSE(
      this.formatMessage({
        type: "messages",
        messages: this.#messages,
      })
    )

    stream.writeSSE(
      this.formatMessage({
        type: "users",
        users: Array.from(this.#nameToUser.keys()),
      })
    )

    this.broadcastWithExclude(name, {
      type: "+user",
      id: name,
    })

    this.createMessage(SERVER_USER_NAME, { content: randomGreeting(name) })
  }

  removeUser(stream: Stream) {
    const data = this.#streamToUser.get(stream)
    if (!data) return
    const { name, onRemoved } = data
    this.#streamToUser.delete(stream)
    this.#nameToUser.delete(name)
    this.broadcast({ type: "-user", id: name })
    this.createMessage(SERVER_USER_NAME, { content: randomFarewell(name) })
    onRemoved()
  }

  createMessage(from: string, { content }: ChatMessageDTO) {
    const message: ChatMessage = {
      id: crypto.randomUUID(),
      from,
      content,
      timestamp: Date.now(),
      reactions: [],
    }
    this.#messages.push(message)

    setTimeout(() => this.removeMessage(message.id), MESSAGE_EXPIRATION_MS)

    this.broadcastWithExclude(from, {
      type: "message",
      message,
    })

    return message
  }

  createReaction(
    userData: UserData,
    { messageId, kind }: ReactionDTO
  ): [string, null] | [null, Reaction] {
    const message = this.#messages.find((message) => message.id === messageId)
    if (!message) return ["Not found", null]

    const reaction: Reaction = { kind, from: userData.name }

    if (
      message.reactions.some(
        (reaction) => reaction.from === userData.name && reaction.kind === kind
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

  deleteReaction(userData: UserData, { messageId, kind }: ReactionDTO) {
    const message = this.#messages.find((message) => message.id === messageId)
    if (!message) return

    const matchedReactionIdx = message.reactions.findIndex(
      (reaction) => reaction.from === userData.name && reaction.kind === kind
    )
    if (matchedReactionIdx === -1) return
    const [reaction] = message.reactions.splice(matchedReactionIdx, 1)

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
    const msg = this.formatMessage(payload)
    this.#streamToUser.forEach((_, stream) => {
      stream.writeSSE(msg)
    })
  }

  private broadcastWithExclude(exclude: string, payload: SSEMessage) {
    const msg = this.formatMessage(payload)
    this.#streamToUser.forEach((user, stream) => {
      if (user.name === exclude) return
      stream.writeSSE(msg)
    })
  }

  private formatMessage(message: SSEMessage): HonoSSEMessage {
    return {
      data: JSON.stringify({
        ...message,
        v: PROTOCOL_VERSION,
      } satisfies SSEMessageWithVersion),
      event: "message",
    }
  }
}

export default new ChatService()
