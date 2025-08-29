import { useEffectEvent, useLayoutEffect } from "kiru"

export function useClickOutside(
  ref: Kiru.RefObject<HTMLElement>,
  callback: (e: MouseEvent) => void,
  options: { ignore?: Kiru.RefObject<HTMLElement>[] } = {}
) {
  const applyCallback = useEffectEvent(callback)
  useLayoutEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!ref.current || options?.ignore?.some((r) => r.current === e.target))
        return
      applyCallback(e)
    }
    document.addEventListener("click", handler)
    return () => document.removeEventListener("click", handler)
  })
}
