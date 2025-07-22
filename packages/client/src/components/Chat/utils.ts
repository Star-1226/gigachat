import { textAreaElement, formElement } from "$/state"
import { MAX_MESSAGE_CHARS } from "shared"

export function addUserRefToTextArea(username: string) {
  const txtAreaEl = textAreaElement.peek(),
    formEl = formElement.peek()
  if (!txtAreaEl || !formEl) return

  const currentValue = txtAreaEl.value
  let toAdd = `@${username} `

  // if there's non-whitespace characters at the end, add a space
  if (currentValue.length && currentValue.trimEnd() === currentValue) {
    toAdd = ` ${toAdd}`
  }

  if (currentValue.length + toAdd.length > MAX_MESSAGE_CHARS) return

  txtAreaEl.value += toAdd
  txtAreaEl.dispatchEvent(new Event("input"))
  txtAreaEl.focus()
  formEl.style.scale = "1.05"
  setTimeout(() => (formEl.style.scale = "1"), 150)
}
