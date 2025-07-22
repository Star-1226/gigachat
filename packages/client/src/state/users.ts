import { computed, signal } from "kaioken"
import { username } from "./connection"

export const users = signal<string[]>([])
export const otherUsers = computed(() =>
  users.value.filter((user) => user !== username.peek())
)
