let baseUrl = ""
if (import.meta.env.DEV) {
  baseUrl = `http://${window.location.hostname}:8787`
} else {
  baseUrl = ""
}
export const BASE_URL = baseUrl
