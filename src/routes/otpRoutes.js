import express from 'express'
import { PrismaClient } from '@prisma/client'
import { sendVerificationEmail } from '../lib/email.js'

const router = express.Router()
const prisma = new PrismaClient()

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString()

// POST /api/otp/send
router.post('/send', async (req, res) => {
  try {
    const { email } = req.body
    if (!email) return res.status(400).json({ message: 'Email required' })

    const otp = generateOTP()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    await prisma.oTPVerification.upsert({
      where: { email },
      update: { otp, expiresAt, verified: false },
      create: { email, otp, expiresAt, verified: false }
    })

    await sendVerificationEmail(email, otp)

    res.status(200).json({ message: 'OTP sent successfully' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to send OTP' })
  }
})

// POST /api/otp/verify
router.post('/verify', async (req, res) => {
  try {
    const { email, otp } = req.body
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP required' })

    const record = await prisma.oTPVerification.findUnique({ where: { email } })

    if (!record) return res.status(404).json({ message: 'No OTP found for this email' })
    if (record.verified) return res.status(400).json({ message: 'Email already verified' })
    if (new Date() > record.expiresAt) return res.status(400).json({ message: 'OTP expired. Request a new one.' })
    if (record.otp !== otp) return res.status(400).json({ message: 'Invalid OTP code' })

    await prisma.oTPVerification.update({
      where: { email },
      data: { verified: true }
    })

    await prisma.user.update({
      where: { email },
      data: { emailVerified: true }
    })

    res.status(200).json({ message: 'Email verified successfully' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Verification failed' })
  }
})

export default router
