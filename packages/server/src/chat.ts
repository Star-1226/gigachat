import type { SSEStreamingApi } from "hono/streaming"
import type { ChatMessage } from "shared"

const log = (...msgs: any[]) => console.log("[ChatService]", ...msgs)

export class ChatService {
  #messages: ChatMessage[]
  #subscribers: Set<SSEStreamingApi>
  #removedCallbacks: Map<SSEStreamingApi, () => void>

  constructor() {
    this.#messages = []
    this.#subscribers = new Set()
    this.#removedCallbacks = new Map()
    setInterval(() => {
      const messagesToRemove = this.#messages.filter(
        (message) => Date.now() - message.timestamp > 10_000
      )
      this.#messages = this.#messages.filter(
        (message) => !messagesToRemove.includes(message)
      )
      //log("remove old messages", messagesToRemove.length)
      const payload = {
        data: JSON.stringify({
          type: "remove",
          messages: messagesToRemove.map((message) => message.id),
        }),
        event: "message",
      }
      this.#subscribers.forEach((subscriber) => {
        subscriber.writeSSE(payload)
      })
    }, 1000)
  }

  onSubscriberRemoved(subscriber: SSEStreamingApi, callback: () => void) {
    this.#removedCallbacks.set(subscriber, callback)
  }

  addSubscriber(subscriber: SSEStreamingApi) {
    this.#subscribers.add(subscriber)
    subscriber.writeSSE({
      data: JSON.stringify({
        type: "messages",
        messages: this.#messages,
      }),
      event: "message",
    })
    log("add subscriber", this.#subscribers.size)
  }

  removeSubscriber(subscriber: SSEStreamingApi) {
    this.#removedCallbacks.get(subscriber)?.()
    this.#subscribers.delete(subscriber)
    log("remove subscriber", this.#subscribers.size)
  }

  addMessage(message: ChatMessage) {
    this.#messages.push(message)
    log("add message", message, this.#subscribers.size)
    this.#subscribers.forEach((subscriber) => {
      subscriber.writeSSE({
        data: JSON.stringify({
          type: "message",
          message,
        }),
        event: "message",
      })
    })
  }
}
