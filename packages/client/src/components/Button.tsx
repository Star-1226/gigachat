import { ElementProps, unwrap } from "kaioken"

export function Button({ className, ...props }: ElementProps<"button">) {
  return (
    <button
      className={[
        "bg-blue-600 p-2 rounded-lg font-medium",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        unwrap(className),
      ].join(" ")}
      {...props}
    />
  )
}
