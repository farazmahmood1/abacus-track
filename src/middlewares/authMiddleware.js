import { auth } from '../lib/auth.js'
import ApiError from '../utils/ApiError.js'

export const requireAuth = async (req, res, next) => {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    })

    if (!session?.user) {
      return next(new ApiError(401, 'Unauthorized'))
    }

    req.user = session.user
    next()
  } catch (err) {
    console.error('Auth middleware error:', err)
    next(new ApiError(401, 'Unauthorized'))
  }
}
