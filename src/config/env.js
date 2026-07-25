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
