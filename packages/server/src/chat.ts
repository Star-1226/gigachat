import type { SSEStreamingApi } from "hono/streaming"
import type { ChatMessage } from "shared"

export class ChatService {
  #messages: ChatMessage[]
  #subscribers: Set<SSEStreamingApi>
  #subscriberRemovedCallbacks: Map<SSEStreamingApi, () => void>
  #subsriberRecentMessages: Map<string, number>

  constructor() {
    this.#messages = []
    this.#subscribers = new Set()
    this.#subscriberRemovedCallbacks = new Map()
    this.#subsriberRecentMessages = new Map()

    // to limit to 10 messages per minute,
    // we need to drop the count by 1 every 6 seconds
    setInterval(() => {
      this.#subsriberRecentMessages.forEach((count, name) => {
        if (count === 0) return
        this.#subsriberRecentMessages.set(name, count - 1)
      })
    }, 6000)
  }

  onSubscriberRemoved(subscriber: SSEStreamingApi, callback: () => void) {
    this.#subscriberRemovedCallbacks.set(subscriber, callback)
  }

  addSubscriber(subscriber: SSEStreamingApi, name: string) {
    this.#subscribers.add(subscriber)
    this.#subsriberRecentMessages.set(name, 0)
    subscriber.writeSSE({
      data: JSON.stringify({
        type: "messages",
        messages: this.#messages,
      }),
      event: "message",
    })
  }

  removeSubscriber(subscriber: SSEStreamingApi, name: string) {
    this.#subscriberRemovedCallbacks.get(subscriber)?.()
    this.#subscribers.delete(subscriber)
    this.#subsriberRecentMessages.delete(name)
  }

  addMessage(message: ChatMessage) {
    this.#messages.push(message)
    setTimeout(() => this.removeMessage(message.id), 10_000)
    this.#subsriberRecentMessages.set(
      message.from,
      (this.#subsriberRecentMessages.get(message.from) ?? 0) + 1
    )
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

  canSendMessage(name: string) {
    return (this.#subsriberRecentMessages.get(name) ?? 0) < 10
  }

  private removeMessage(id: string) {
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
}
