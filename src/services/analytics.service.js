import prisma from '../config/prisma.js'

export async function getPlatformOverview() {
  const [
    totalCompanies,
    activeCompanies,
    suspendedCompanies,
    totalUsers,
    activeSubscriptions,
    plans,
  ] = await Promise.all([
    prisma.company.count(),
    prisma.company.count({ where: { status: 'ACTIVE' } }),
    prisma.company.count({ where: { status: 'SUSPENDED' } }),
    prisma.user.count({ where: { role: { not: 'super_admin' } } }),
    prisma.subscription.count({ where: { status: 'ACTIVE' } }),
    prisma.plan.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { subscriptions: { where: { status: 'ACTIVE' } } },
        },
      },
      orderBy: { sortOrder: 'asc' },
    }),
  ])

  // MRR calculation
  const activeSubsWithPlans = await prisma.subscription.findMany({
    where: { status: 'ACTIVE' },
    include: { plan: true, company: { select: { currentUserCount: true } } },
  })

  let mrr = 0
  for (const sub of activeSubsWithPlans) {
    const pricePerSeat = sub.billingCycle === 'YEARLY'
      ? sub.plan.yearlyPrice / 12
      : sub.plan.price
    mrr += pricePerSeat * (sub.company.currentUserCount || 1)
  }

  const subscriptionsByPlan = plans.map((p) => ({
    planName: p.name,
    planSlug: p.slug,
    count: p._count.subscriptions,
  }))

  // Recent companies
  const recentCompanies = await prisma.company.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      id: true,
      name: true,
      slug: true,
      logo: true,
      status: true,
      createdAt: true,
      _count: { select: { users: true } },
    },
  })

  return {
    totalCompanies,
    activeCompanies,
    suspendedCompanies,
    deactivatedCompanies: totalCompanies - activeCompanies - suspendedCompanies,
    totalUsers,
    activeSubscriptions,
    mrr: Math.round(mrr * 100) / 100,
    arr: Math.round(mrr * 12 * 100) / 100,
    subscriptionsByPlan,
    recentCompanies,
  }
}

export async function getUsageAnalytics() {
  const companies = await prisma.company.findMany({
    where: { status: 'ACTIVE' },
    select: {
      id: true,
      name: true,
      slug: true,
      currentUserCount: true,
      _count: {
        select: {
          users: true,
          departments: true,
          projects: true,
        },
      },
    },
    orderBy: { currentUserCount: 'desc' },
    take: 20,
  })

  return companies
}
