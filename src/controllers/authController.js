import { User } from '../models/User.js'
import { signToken } from '../utils/token.js'

export async function signup(req, res, next) {
  try {
    const { firstName, lastName, email, password } = req.body

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'First name, last name, email, and password are required',
      })
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() })
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Email is already registered',
      })
    }

    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
    })

    const token = signToken(user._id)

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        user: user.toSafeJSON(),
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

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password')
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      })
    }

    const token = signToken(user._id)

    res.json({
      success: true,
      message: 'Signed in successfully',
      data: {
        user: user.toSafeJSON(),
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
    data: { user: req.user.toSafeJSON() },
  })
}
