import { auth } from '../lib/auth.js'
import ApiError from '../utils/ApiError.js'

/**
 * Middleware that extracts companyId from the authenticated user
 * and attaches it to req.companyId for downstream use.
 * Super admins can optionally pass ?companyId= query param to scope to a specific company.
 */
export const requireCompanyScope = async (req, res, next) => {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    })

    if (!session?.user) {
      return next(new ApiError(401, 'Unauthorized'))
    }

    req.user = session.user

    // Super admins can scope to any company via query param
    if (session.user.role === 'super_admin') {
      req.companyId = req.query.companyId || null
      return next()
    }

    // Regular users must belong to a company
    if (!session.user.companyId) {
      return next(new ApiError(403, 'User is not associated with any company'))
    }

    req.companyId = session.user.companyId
    next()
  } catch (err) {
    console.error('Company scope middleware error:', err)
    next(new ApiError(500, 'Company scope check failed'))
  }
}
