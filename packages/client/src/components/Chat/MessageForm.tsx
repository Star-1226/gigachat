import { useTextareaAutoSize } from "@kaioken-core/hooks"
import { useRef, useSignal, useComputed } from "kaioken"
import { MAX_MESSAGE_CHARS } from "shared"
import { sendMessage } from "../../api/handlers"
import { SendIcon } from "../../icons/SendIcon"
import { Button } from "../Button"

export function MessageForm() {
  const textAreaRef = useRef<HTMLTextAreaElement>(null)
  const textAreaCtrls = useTextareaAutoSize(textAreaRef)
  const inputText = useSignal("")
  const inputTextLength = useComputed(() => inputText.value.length)
  const isInputTextInvalid = useComputed(
    () => !inputTextLength.value || inputTextLength.value > MAX_MESSAGE_CHARS
  )
  const inputBadgeClass = useComputed(() => {
    const bg =
      inputTextLength.value < MAX_MESSAGE_CHARS
        ? "bg-neutral-900 text-neutral-400"
        : "bg-red-800 text-neutral-300"
    return `absolute right-2 bottom-2 leading-none bg-neutral-900 rounded-lg p-1 ${bg}`
  })

  const handleSubmitEvent = async (e: Event) => {
    e.preventDefault()
    if (isInputTextInvalid.value) return
    try {
      await sendMessage(inputText.peek())
      inputText.value = ""
      textAreaCtrls.update()
    } catch (error) {
      alert(error)
    }
  }

  return (
    <form
      className="flex items-center justify-center w-full p-4"
      onsubmit={handleSubmitEvent}
    >
      <div className="flex gap-2 w-full bg-neutral-700 p-2 rounded-lg">
        <div className="flex grow relative">
          <textarea
            name="message"
            ref={textAreaRef}
            bind:value={inputText}
            className="grow rounded-lg p-2 bg-neutral-800 text-sm resize-none min-h-full"
            minLength={1}
            maxLength={MAX_MESSAGE_CHARS}
            onkeypress={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                handleSubmitEvent(e)
              }
            }}
          />
          <small className={inputBadgeClass}>
            {inputTextLength}/{MAX_MESSAGE_CHARS}
          </small>
        </div>
        <Button disabled={isInputTextInvalid} type="submit">
          <SendIcon />
        </Button>
      </div>
    </form>
  )
}
