export async function connect(): Promise<{ name: string }> {
  const response = await fetch("/api/connect")
  return response.json()
}

export async function sendMessage(message: string) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content: message }),
  })
  if (!response.ok) {
    throw new Error(response.statusText)
  }
}
