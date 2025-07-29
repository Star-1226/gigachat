import { useTextareaAutoSize } from "@kaioken-core/hooks"
import { useRef, useSignal, useComputed, useCallback } from "kaioken"
import { MAX_MESSAGE_CHARS } from "shared"
import { SendIcon } from "$/icons/SendIcon"
import { Button } from "../Button"
import { formElement, textAreaElement } from "$/state"
import createMessage from "$/actions/message.create"

type MessageFormProps = {
  onMessageAdded: () => void
}

export function MessageForm({ onMessageAdded }: MessageFormProps) {
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null)
  const textAreaCtrls = useTextareaAutoSize(textAreaRef)
  const inputText = useSignal("")
  const inputTextLength = useComputed(() => inputText.value.trim().length)
  const isSubmitDisabled = useComputed(() => {
    const textLength = inputTextLength.value

    return !textLength || textLength > MAX_MESSAGE_CHARS
  })
  const inputBadgeClass = useComputed(() => {
    const bg =
      inputTextLength.value < MAX_MESSAGE_CHARS
        ? "bg-neutral-800 text-neutral-400"
        : "bg-[#9d0000] text-neutral-300"
    return `text-[10px] font-bold leading-none rounded-lg p-1 transition-colors ${bg}`
  })

  const handleSubmitEvent = async (e: Event) => {
    e.preventDefault()
    if (isSubmitDisabled.peek()) return

    const content = inputText.peek().trim()
    inputText.value = ""
    textAreaCtrls.update()
    onMessageAdded()
    createMessage(content)
  }

  const bindTextAreaRef = useCallback((el: HTMLTextAreaElement | null) => {
    textAreaRef.current = el
    textAreaElement.value = el
  }, [])

  return (
    <form
      ref={formElement}
      className="flex items-center justify-center w-full p-4 transition-all"
      onsubmit={handleSubmitEvent}
    >
      <div className="flex gap-2 w-full bg-neutral-700 p-2 rounded-lg">
        <div className="flex grow">
          <textarea
            name="message"
            ref={bindTextAreaRef}
            bind:value={inputText}
            className="grow rounded-lg p-2 bg-neutral-800 text-sm resize-none min-h-full disabled:opacity-75"
            minLength={1}
            maxLength={MAX_MESSAGE_CHARS}
            onkeypress={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                handleSubmitEvent(e)
              }
            }}
          />
        </div>

        <Button
          type="submit"
          disabled={isSubmitDisabled}
          className="flex flex-col items-center justify-between gap-2"
        >
          <SendIcon />
          <span className={inputBadgeClass}>
            {inputTextLength}/{MAX_MESSAGE_CHARS}
          </span>
        </Button>
      </div>
    </form>
  )
}
