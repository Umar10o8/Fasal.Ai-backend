import { User } from '../models/User.js'
import { verifyToken } from '../utils/token.js'

export async function protect(req, res, next) {
  try {
    const header = req.headers.authorization
    if (!header?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Not authorized' })
    }

    const decoded = verifyToken(header.slice(7))
    const user = await User.findById(decoded.sub)
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' })
    }

    req.user = user
    next()
  } catch (err) {
    next(err)
  }
}
