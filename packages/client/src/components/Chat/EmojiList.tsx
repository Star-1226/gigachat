import { useClickOutside } from "@kaioken-core/hooks"
import { useRef } from "kaioken"
import { ReactionEmoji, REACTION_EMOJIS } from "shared"

type EmojiListProps = {
  onEmojiSelect: (kind: ReactionEmoji) => void
  dismiss: () => void
}

export function EmojiList({ onEmojiSelect, dismiss }: EmojiListProps) {
  const ref = useRef<HTMLDivElement>(null)
  useClickOutside(ref, dismiss)

  return (
    <div ref={ref} className="absolute right-0 top-0 z-10">
      <ul className="grid grid-cols-[1fr_1fr_1fr_1fr] gap-2 bg-neutral-800 p-1 shadow shadow-neutral-900 rounded">
        {REACTION_EMOJIS.map((emoji) => (
          <li key={emoji}>
            <button
              className="p-1 text-xl flex items-center rounded bg-white/2.5 hover:bg-white/7.5 border border-white/5"
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
