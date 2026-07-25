import dotenv from 'dotenv'

dotenv.config()

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
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
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
