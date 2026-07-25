import app from './app.js'
import { assertRequiredEnv, env } from './config/env.js'

assertRequiredEnv()

const port = env.port

// Bind 0.0.0.0 so Railway's proxy can reach the process
app.listen(port, '0.0.0.0', () => {
  console.log(`Fasal AI API listening on 0.0.0.0:${port}`)
  console.log(`BETTER_AUTH_URL=${env.betterAuthUrl}`)
  console.log(`Allowed origins: ${env.frontendOrigins.join(', ')}`)
})
