import dotenv from 'dotenv'

dotenv.config()

const parseOrigins = (value) =>
  (value || '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean)
    .map((origin) => {
      // FRONTEND_URL must be a full origin (scheme + host). Bare hosts break CORS matching.
      if (/^https?:\/\//i.test(origin)) return origin
      if (origin.includes('localhost') || origin.startsWith('127.')) {
        return `http://${origin}`
      }
      return `https://${origin}`
    })

const frontendOrigins = parseOrigins(process.env.FRONTEND_URL)
const defaultDevOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173']

/** Exact origins always allowed for CORS / Better Auth */
export const env = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || 'fasal-ai-dev-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  betterAuthSecret: process.env.BETTER_AUTH_SECRET,
  betterAuthUrl: process.env.BETTER_AUTH_URL,
  resendApiKey: process.env.RESEND_API_KEY,
  resendFromEmail: process.env.RESEND_FROM_EMAIL || 'FasalAI <onboarding@resend.dev>',
  frontendUrl: frontendOrigins[0] || defaultDevOrigins[0],
  frontendOrigins: [...new Set([
    ...frontendOrigins,
    ...defaultDevOrigins,
    // Known production frontends (also set FRONTEND_URL on Railway)
    'https://fasal-ai-lemon.vercel.app',
    'https://fasal-ai-one.vercel.app',
  ])],
  /** Better Auth supports wildcards like https://*.vercel.app */
  trustedOriginPatterns: [
    'https://*.vercel.app',
    'http://localhost:*',
    'http://127.0.0.1:*',
  ],
}

export const isAllowedOrigin = (origin) => {
  if (!origin) return true
  if (env.frontendOrigins.includes(origin)) return true

  try {
    const { hostname, protocol } = new URL(origin)
    if (protocol !== 'http:' && protocol !== 'https:') return false
    if (hostname === 'localhost' || hostname === '127.0.0.1') return true
    if (hostname.endsWith('.vercel.app')) return true
  } catch {
    return false
  }

  return false
}

const REQUIRED = [
  'DATABASE_URL',
  'BETTER_AUTH_SECRET',
  'BETTER_AUTH_URL',
]

export const assertRequiredEnv = () => {
  const missing = REQUIRED.filter((key) => !process.env[key])

  if (missing.length === 0) return

  console.error(
    `[env] Missing required environment variables:\n` +
      missing.map((key) => `  - ${key}`).join('\n') +
      `\n\nSet these in your host's Environment Variables panel (not only in local .env).`
  )
  process.exit(1)
}
