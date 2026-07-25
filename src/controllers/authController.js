import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma.js'
import { signToken } from '../utils/token.js'

function toSafeUser(user) {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    createdAt: user.createdAt,
  }
}

export async function signup(req, res, next) {
  try {
    const { firstName, lastName, email, password } = req.body

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'First name, last name, email, and password are required',
      })
    }

    if (String(password).length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      })
    }

    const normalizedEmail = email.toLowerCase().trim()
    const trimmedFirstName = firstName.trim()
    const trimmedLastName = lastName.trim()

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Email is already registered',
      })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          name: `${trimmedFirstName} ${trimmedLastName}`,
          firstName: trimmedFirstName,
          lastName: trimmedLastName,
          email: normalizedEmail,
        },
      })

      await tx.account.create({
        data: {
          userId: created.id,
          accountId: created.id,
          providerId: 'credential',
          password: hashedPassword,
        },
      })

      return created
    })

    const token = signToken(user.id)

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        user: toSafeUser(user),
        token,
      },
    })
  } catch (err) {
    next(err)
  }
}

export async function signin(req, res, next) {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      })
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        accounts: {
          where: { providerId: 'credential' },
          take: 1,
        },
      },
    })

    const account = user?.accounts?.[0]
    const passwordValid =
      account?.password && (await bcrypt.compare(password, account.password))

    if (!user || !passwordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      })
    }

    const token = signToken(user.id)

    res.json({
      success: true,
      message: 'Signed in successfully',
      data: {
        user: toSafeUser(user),
        token,
      },
    })
  } catch (err) {
    next(err)
  }
}

export async function me(req, res) {
  res.json({
    success: true,
    data: { user: toSafeUser(req.user) },
  })
}
