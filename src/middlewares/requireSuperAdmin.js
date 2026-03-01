import { auth } from '../lib/auth.js'
import ApiError from '../utils/ApiError.js'

export const requireSuperAdmin = async (req, res, next) => {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    })

    if (!session?.user) {
      return next(new ApiError(401, 'Unauthorized'))
    }

    if (session.user.role !== 'super_admin') {
      return next(new ApiError(403, 'Forbidden: Super Admin access required'))
    }

    req.user = session.user
    next()
  } catch (err) {
    console.error('Super Admin middleware error:', err)
    next(new ApiError(500, 'Authorization check failed'))
  }
}
