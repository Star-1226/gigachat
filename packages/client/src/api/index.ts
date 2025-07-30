import { GigaAPI } from "shared"
import { BASE_URL } from "$/constants"

type GigaEndpoint = keyof GigaAPI & {}

const init: RequestInit = {
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
  },
}

export async function POST<K extends GigaEndpoint>(
  path: K,
  body: GigaAPI[K]["POST"]["in"]
): Promise<GigaAPI[K]["POST"]["out"]> {
  const response = await fetch(`${BASE_URL}/api${path}`, {
    ...init,
    method: "POST",
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    throw new Error(response.statusText)
  }
  return response.json()
}

export async function GET<K extends GigaEndpoint>(
  path: K
): Promise<GigaAPI[K]["GET"]["out"]> {
  const response = await fetch(`${BASE_URL}/api${path}`, init)
  if (!response.ok) {
    throw new Error(response.statusText)
  }
  return response.json()
}

export async function DELETE<K extends GigaEndpoint>(
  path: K,
  body?: GigaAPI[K]["DELETE"]["in"]
): Promise<GigaAPI[K]["DELETE"]["out"]> {
  const response = await fetch(`${BASE_URL}/api${path}`, {
    ...init,
    method: "DELETE",
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    throw new Error(response.statusText)
  }
  return response.json()
}
