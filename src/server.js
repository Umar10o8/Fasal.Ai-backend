import app from './app.js'
import { connectDB } from './config/db.js'
import { env } from './config/env.js'

async function start() {
  try {
    await connectDB(env.mongoUri)
    app.listen(env.port, () => {
      console.log(`Fasal AI API listening on http://localhost:${env.port}`)
    })
  } catch (err) {
    console.error('Failed to start server:', err.message)
    process.exit(1)
  }
}

start()
