import { Hono } from "hono"
import { serve } from "@hono/node-server"
import { serveStatic } from "@hono/node-server/serve-static"
import SSERouter from "./routers/sse.js"
import APIRouter from "./routers/api.js"
import { isProd } from "./env.js"

const app = new Hono()

if (!isProd) {
  await import("hono/cors").then(({ cors }) => {
    app.use(
      "*",
      cors({
        origin: "http://localhost:5173",
        allowMethods: ["GET", "POST", "DELETE", "OPTIONS"],
        credentials: true,
      })
    )
  })
}

app.route("/", SSERouter)
app.route("/", APIRouter)

// Serve static files with proper configuration
// The server runs from /app/packages/server, so client files are at ../../client
if (isProd) {
  app.use(
    "/*",
    serveStatic({
      root: "../../client",
      index: "index.html",
    })
  )
}
serve(
  {
    fetch: app.fetch,
    hostname: "0.0.0.0",
    port: 8787,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`)
    if (isProd) {
      console.log(`Serving static files from ../../client`)
    }
  }
)
