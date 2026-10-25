import { fromNodeHeaders } from 'better-auth/node'
import { auth } from '../lib/auth.js'

export async function requireSession(req, res, next) {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    })

    if (!session?.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      })
    }

    req.user = session.user
    next()
  } catch (err) {
    next(err)
  }
}
