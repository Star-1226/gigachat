import { ElementProps, unwrap } from "kiru"
import { className as cls } from "kiru/utils"

export function Button({ className, ...props }: ElementProps<"button">) {
  return (
    <button
      className={cls(
        "bg-blue-600 p-2 rounded-lg font-medium",
        "not-disabled:hover:bg-blue-700",
        unwrap(className)
      )}
      {...props}
    />
  )
}
