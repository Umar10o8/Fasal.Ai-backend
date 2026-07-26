import express from 'express'
import morgan from 'morgan'
import { toNodeHandler } from 'better-auth/node'
import { env, isAllowedOrigin } from './config/env.js'
import { auth } from './lib/auth.js'
import rootRoutes from './routes/index.js'
import authRoutes from './routes/authRoutes.js'
import otpRoutes from './routes/otpRoutes.js'
import { notFound, errorHandler } from './middleware/errorHandler.js'

const app = express()

// Railway healthchecks often hit `/` — must respond before any proxy timeout / restart loop
app.get('/', (_req, res) => {
  res.status(200).type('text').send('ok')
})

// Explicit CORS so headers apply even when Better Auth's node handler writes the response
app.use((req, res, next) => {
  const origin = req.headers.origin

  if (origin && isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    res.setHeader('Vary', 'Origin')
  }

  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET,POST,PUT,PATCH,DELETE,OPTIONS'
  )
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Requested-With, X-CSRF-Token'
  )
  res.setHeader('Access-Control-Max-Age', '86400')

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204)
  }

  next()
})

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
