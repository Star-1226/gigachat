import { signal } from "kaioken"

export const notifications = new Map<string, Notification>()

const permission = signal<NotificationPermission>(Notification.permission)

export function prepareNotifications() {
  if (!("Notification" in window)) {
    console.log("This browser does not support notifications.")
    return
  }
  if (permission.value === "default") {
    Notification.requestPermission().then((result) => {
      permission.value = result
    })
  }

  // Listen for permission changes (if supported)
  if (navigator.permissions?.query) {
    navigator.permissions.query({ name: "notifications" }).then((status) => {
      const update = () => (permission.value = Notification.permission)
      status.addEventListener("change", update)
    })
  }
}

export function notify(
  id: string,
  title: string,
  options?: NotificationOptions
) {
  notifications.forEach((n) => n.close())
  notifications.clear()

  if (permission.value === "granted") {
    const n = new Notification(title, options)
    notifications.set(id, n)

    n.addEventListener(
      "click",
      (e) => {
        e.preventDefault()
        notifications.delete(id)
        window.focus()
        n.close()
      },
      { once: true }
    )

    return n
  }
}
