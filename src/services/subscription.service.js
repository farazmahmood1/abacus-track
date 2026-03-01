import prisma from '../config/prisma.js'
import ApiError from '../utils/ApiError.js'

export async function listSubscriptions({ page = 1, limit = 20, status }) {
  const where = {}
  if (status) where.status = status

  const [data, total] = await Promise.all([
    prisma.subscription.findMany({
      where,
      include: {
        company: true,
        plan: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.subscription.count({ where }),
  ])

  return { data, total, page, totalPages: Math.ceil(total / limit) }
}

export async function getCompanySubscription(companyId) {
  const subscription = await prisma.subscription.findFirst({
    where: { companyId, status: 'ACTIVE' },
    include: {
      plan: { include: { features: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return subscription
}

export async function overrideSubscription(companyId, planId) {
  const plan = await prisma.plan.findUnique({ where: { id: planId } })
  if (!plan) throw new ApiError(404, 'Plan not found')

  // Deactivate existing
  await prisma.subscription.updateMany({
    where: { companyId, status: 'ACTIVE' },
    data: { status: 'CANCELED' },
  })

  // Create new subscription (manual override by super admin)
  const subscription = await prisma.subscription.create({
    data: {
      companyId,
      planId,
      status: 'ACTIVE',
      billingCycle: 'MONTHLY',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    include: { plan: true },
  })

  // Update company limits
  await prisma.company.update({
    where: { id: companyId },
    data: { maxUsers: plan.maxUsers },
  })

  return subscription
}

export async function getInvoices(companyId) {
  // Invoices come from Stripe; this returns subscription history from DB
  return prisma.subscription.findMany({
    where: { companyId },
    include: { plan: true },
    orderBy: { createdAt: 'desc' },
  })
}
