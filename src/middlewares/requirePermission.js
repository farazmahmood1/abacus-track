import { auth } from '../lib/auth.js'
import ApiError from '../utils/ApiError.js'

export const requirePermission = (resource, action) => {
  return async (req, res, next) => {
    try {
      const session = await auth.api.getSession({
        headers: req.headers,
      })

      if (!session?.user) {
        return next(new ApiError(401, 'Unauthorized'))
      }

      const hasPermission = await auth.api.userHasPermission({
        body: {
          userId: session.user.id,
          permissions: { [resource]: [action] },
        },
      })

      if (!hasPermission.success) {
        return next(new ApiError(403, 'Forbidden: Insufficient permissions'))
      }

      req.user = session.user
      next()
    } catch (err) {
      console.error('Permission middleware error:', err)
      next(new ApiError(500, 'Permission check failed'))
    }
  }
}
