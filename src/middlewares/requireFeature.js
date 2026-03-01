import prisma from '../config/prisma.js'
import ApiError from '../utils/ApiError.js'

/**
 * Middleware that checks if a company has access to a specific feature
 * based on their plan + any feature overrides.
 */
export const requireFeature = (featureKey) => {
  return async (req, res, next) => {
    try {
      // Super admins bypass feature checks
      if (req.user?.role === 'super_admin') {
        return next()
      }

      const companyId = req.companyId || req.user?.companyId
      if (!companyId) {
        return next(new ApiError(403, 'No company context'))
      }

      // Check for company-level override first
      const override = await prisma.companyFeatureOverride.findUnique({
        where: {
          companyId_featureKey: { companyId, featureKey },
        },
      })

      if (override) {
        if (!override.enabled) {
          return next(new ApiError(403, `Feature "${featureKey}" is disabled for your company`))
        }
        return next()
      }

      // Check plan features
      const company = await prisma.company.findUnique({
        where: { id: companyId },
        include: {
          subscriptions: {
            where: { status: 'ACTIVE' },
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              plan: {
                include: {
                  features: {
                    where: { featureKey },
                  },
                },
              },
            },
          },
        },
      })

      if (!company) {
        return next(new ApiError(404, 'Company not found'))
      }

      const subscription = company.subscriptions[0]
      if (!subscription) {
        // No active subscription — only allow if feature is in Free plan
        const freePlan = await prisma.plan.findUnique({
          where: { slug: 'free' },
          include: {
            features: { where: { featureKey } },
          },
        })
        const freeFeature = freePlan?.features[0]
        if (!freeFeature?.enabled) {
          return next(new ApiError(403, `Feature "${featureKey}" requires a paid plan`))
        }
        return next()
      }

      const planFeature = subscription.plan.features[0]
      if (!planFeature?.enabled) {
        return next(new ApiError(403, `Feature "${featureKey}" is not available on your current plan`))
      }

      next()
    } catch (err) {
      console.error('Feature gate middleware error:', err)
      next(new ApiError(500, 'Feature access check failed'))
    }
  }
}
