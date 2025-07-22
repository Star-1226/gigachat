import { useClickOutside } from "@kaioken-core/hooks"
import {
  StyleObject,
  useLayoutEffect,
  useMemo,
  useRef,
  useSignal,
} from "kaioken"
import { ReactionEmoji, REACTION_EMOJIS } from "shared"
import { messageListElement, messages } from "$/state"

type EmojiListProps = {
  messageId: string
  onEmojiSelect: (kind: ReactionEmoji) => void
  dismiss: (e: Event) => void
  anchorRef: Kaioken.RefObject<HTMLButtonElement>
}

export function EmojiPicker({
  messageId,
  onEmojiSelect,
  dismiss,
  anchorRef,
}: EmojiListProps) {
  const ref = useRef<HTMLDivElement>(null)
  useClickOutside(ref, dismiss, {
    ignore: [anchorRef],
  })

  const styles = useSignal<StyleObject>({})
  const msgIndex = useMemo(
    () => messages.peek().findIndex((m) => m.id === messageId),
    [messages.peek()]
  )
  useLayoutEffect(() => {
    const setStyles = () => {
      if (!anchorRef.current || !ref.current) return

      const anchorRect = anchorRef.current.getBoundingClientRect()
      const selfRect = ref.current.getBoundingClientRect()
      const listElRect = messageListElement.peek()!.getBoundingClientRect()

      const viewportHeight = window.innerHeight

      let top = anchorRect.top + anchorRect.height + 5
      // Clamp bottom edge (if not enough space below, try above)
      if (top + selfRect.height > viewportHeight) {
        top = Math.max(listElRect.bottom - selfRect.height - 8, 8)
      } else {
        top = Math.max(top, listElRect.top + 8)
      }

      styles.value = {
        top: `${top}px`,
        left: `${anchorRect.left}px`,
        viewTransitionName: "emoji-picker",
      }
    }

    setStyles()
    const listEl = messageListElement.peek()
    window.addEventListener("resize", setStyles)
    listEl?.addEventListener("scroll", setStyles)

    return () => {
      window.removeEventListener("resize", setStyles)
      listEl?.removeEventListener("scroll", setStyles)
    }
  }, [msgIndex])

  return (
    <div ref={ref} style={styles} className="absolute z-10">
      <ul className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr] gap-1 bg-[#1e1e1e] p-1 shadow shadow-neutral-900 rounded">
        {REACTION_EMOJIS.map((emoji) => (
          <li key={emoji}>
            <button
              className="p-1 text-xl flex items-center rounded bg-white/1.25 hover:bg-white/7.5 border border-white/5"
              onclick={() => onEmojiSelect(emoji)}
            >
              {emoji}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
