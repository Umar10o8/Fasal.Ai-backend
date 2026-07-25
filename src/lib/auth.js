import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { env } from "../config/env.js"
import { prisma } from "./prisma.js"

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql"
  }),
  secret: env.betterAuthSecret,
  baseURL: env.betterAuthUrl,
  trustedOrigins: env.frontendOrigins,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,        // 7 days
    updateAge: 60 * 60 * 24,             // refresh every 1 day
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60
    }
  },
  user: {
    additionalFields: {
      firstName: { type: "string", required: true },
      lastName:  { type: "string", required: true }
    }
  }
})
