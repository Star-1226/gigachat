let api = ""
if (import.meta.env.DEV) {
  api = `http://${window.location.hostname}:8787`
} else {
  api = ""
}
export const API_URL = api
