import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import { toNodeHandler } from 'better-auth/node'
import { env } from './config/env.js'
import { auth } from './lib/auth.js'
import rootRoutes from './routes/index.js'
import authRoutes from './routes/authRoutes.js'
import otpRoutes from './routes/otpRoutes.js'
import { notFound, errorHandler } from './middleware/errorHandler.js'

const app = express()

app.use(cors({
  origin(origin, callback) {
    // Non-browser clients (health checks, curl) send no Origin
    if (!origin || env.frontendOrigins.includes(origin)) {
      callback(null, true)
      return
    }
    callback(null, false)
  },
  credentials: true,
}))

// Better Auth handles all /api/auth/* routes automatically
// Must be registered before express.json() so the body is not consumed first
// Express 5 requires named wildcard syntax: /api/auth/{*any}
app.all('/api/auth/{*any}', toNodeHandler(auth))

app.use(express.json())
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'))

app.use('/api', rootRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/otp', otpRoutes)

app.use(notFound)
app.use(errorHandler)

export default app
