import type { SSEStreamingApi } from "hono/streaming"
import type { ChatMessage } from "shared"

export class ChatService {
  #messages: ChatMessage[]
  #subscribers: Set<SSEStreamingApi>
  #subscriberRemovedCallbacks: Map<SSEStreamingApi, () => void>

  constructor() {
    this.#messages = []
    this.#subscribers = new Set()
    this.#subscriberRemovedCallbacks = new Map()
  }

  onSubscriberRemoved(subscriber: SSEStreamingApi, callback: () => void) {
    this.#subscriberRemovedCallbacks.set(subscriber, callback)
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
  }

  removeSubscriber(subscriber: SSEStreamingApi) {
    this.#subscriberRemovedCallbacks.get(subscriber)?.()
    this.#subscribers.delete(subscriber)
  }

  removeMessage(id: string) {
    this.#messages = this.#messages.filter((message) => message.id !== id)
    this.#subscribers.forEach((subscriber) => {
      subscriber.writeSSE({
        data: JSON.stringify({
          type: "remove",
          id,
        }),
        event: "message",
      })
    })
  }

  addMessage(message: ChatMessage) {
    this.#messages.push(message)
    setTimeout(() => this.removeMessage(message.id), 10_000)
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
