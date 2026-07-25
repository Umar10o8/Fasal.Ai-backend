import app from './app.js'
import { assertRequiredEnv, env } from './config/env.js'

assertRequiredEnv()

const port = env.port

app.listen(port, () => {
  console.log(`Fasal AI API listening on http://localhost:${port}`)
})
