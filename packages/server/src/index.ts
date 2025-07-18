import { serve } from "@hono/node-server"
import { serveStatic } from "@hono/node-server/serve-static"
import { Hono } from "hono"

const app = new Hono()

// API routes first - these should not be caught by static middleware
app.get("/api/hello", (c) => {
  return c.json({ message: "Hello from Hono API!" })
})

// Serve static files with proper configuration
// The server runs from /app/packages/server, so client files are at ../../client
app.use(
  "/*",
  serveStatic({
    root: "../../client",
    index: "index.html",
  })
)

serve(
  {
    fetch: app.fetch,
    port: 8787,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`)
    console.log(`Serving static files from ../../client`)
  }
)
