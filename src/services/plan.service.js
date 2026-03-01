import prisma from '../config/prisma.js'
import ApiError from '../utils/ApiError.js'

const DEFAULT_FEATURES = [
  { key: 'time_tracking', name: 'Time Tracking' },
  { key: 'leave_management', name: 'Leave Management' },
  { key: 'attendance', name: 'Attendance' },
  { key: 'projects', name: 'Projects' },
  { key: 'departments', name: 'Departments' },
  { key: 'shifts', name: 'Shifts' },
  { key: 'overtime', name: 'Overtime' },
  { key: 'timesheets', name: 'Timesheets' },
  { key: 'reports', name: 'Reports' },
  { key: 'reviews', name: 'Reviews' },
  { key: 'assets', name: 'Assets' },
  { key: 'standups', name: 'Standups' },
  { key: 'feedback', name: 'Feedback' },
  { key: 'chat', name: 'Chat' },
  { key: 'calendar', name: 'Calendar' },
  { key: 'pomodoro', name: 'Pomodoro' },
  { key: 'mood_analytics', name: 'Mood Analytics' },
  { key: 'org_chart', name: 'Org Chart' },
  { key: 'compensation', name: 'Compensation' },
  { key: 'expenses', name: 'Expenses' },
  { key: 'offboarding', name: 'Offboarding' },
  { key: 'leaderboard', name: 'Leaderboard' },
  { key: 'wellness', name: 'Wellness' },
  { key: 'documents', name: 'Documents' },
  { key: 'integrations', name: 'Integrations' },
  { key: 'announcements', name: 'Announcements' },
  { key: 'advanced_analytics', name: 'Advanced Analytics' },
  { key: 'desktop_app', name: 'Desktop App' },
  { key: 'mobile_app', name: 'Mobile App' },
  { key: 'api_access', name: 'API Access' },
]

export { DEFAULT_FEATURES }

export async function listPlans() {
  return prisma.plan.findMany({
    where: { isActive: true },
    include: { features: true },
    orderBy: { sortOrder: 'asc' },
  })
}

export async function listAllPlans() {
  return prisma.plan.findMany({
    include: { features: true },
    orderBy: { sortOrder: 'asc' },
  })
}

export async function getPlanById(id) {
  const plan = await prisma.plan.findUnique({
    where: { id },
    include: { features: true },
  })
  if (!plan) throw new ApiError(404, 'Plan not found')
  return plan
}

export async function createPlan(data) {
  const existing = await prisma.plan.findUnique({ where: { slug: data.slug } })
  if (existing) throw new ApiError(409, 'Plan with this slug already exists')

  return prisma.plan.create({
    data: {
      name: data.name,
      slug: data.slug,
      description: data.description,
      price: data.price || 0,
      yearlyPrice: data.yearlyPrice || 0,
      currency: data.currency || 'USD',
      maxUsers: data.maxUsers || 5,
      maxStorage: data.maxStorage || 1024,
      apiAccess: data.apiAccess || false,
      supportLevel: data.supportLevel || 'BASIC',
      isCustom: data.isCustom || false,
      sortOrder: data.sortOrder || 0,
      stripeProductId: data.stripeProductId,
      stripeMonthlyPriceId: data.stripeMonthlyPriceId,
      stripeYearlyPriceId: data.stripeYearlyPriceId,
      features: {
        create: (data.features || []).map((f) => ({
          featureKey: f.featureKey,
          featureName: f.featureName || DEFAULT_FEATURES.find((d) => d.key === f.featureKey)?.name || f.featureKey,
          enabled: f.enabled ?? false,
          limit: f.limit ?? null,
        })),
      },
    },
    include: { features: true },
  })
}

export async function updatePlan(id, data) {
  const plan = await prisma.plan.findUnique({ where: { id } })
  if (!plan) throw new ApiError(404, 'Plan not found')

  return prisma.plan.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
      price: data.price,
      yearlyPrice: data.yearlyPrice,
      maxUsers: data.maxUsers,
      maxStorage: data.maxStorage,
      apiAccess: data.apiAccess,
      supportLevel: data.supportLevel,
      isActive: data.isActive,
      sortOrder: data.sortOrder,
      stripeProductId: data.stripeProductId,
      stripeMonthlyPriceId: data.stripeMonthlyPriceId,
      stripeYearlyPriceId: data.stripeYearlyPriceId,
    },
    include: { features: true },
  })
}

export async function updatePlanFeatures(planId, features) {
  const plan = await prisma.plan.findUnique({ where: { id: planId } })
  if (!plan) throw new ApiError(404, 'Plan not found')

  // Delete existing features and recreate
  await prisma.planFeature.deleteMany({ where: { planId } })

  const created = await Promise.all(
    features.map((f) =>
      prisma.planFeature.create({
        data: {
          planId,
          featureKey: f.featureKey,
          featureName: f.featureName || DEFAULT_FEATURES.find((d) => d.key === f.featureKey)?.name || f.featureKey,
          enabled: f.enabled ?? false,
          limit: f.limit ?? null,
        },
      })
    )
  )

  return created
}

export async function seedDefaultPlans() {
  const plans = [
    {
      name: 'Free',
      slug: 'free',
      description: 'For small teams getting started',
      price: 0,
      yearlyPrice: 0,
      maxUsers: 5,
      maxStorage: 500,
      apiAccess: false,
      supportLevel: 'BASIC',
      sortOrder: 0,
      enabledFeatures: [
        'time_tracking', 'attendance', 'leave_management', 'departments',
        'announcements', 'calendar', 'chat', 'pomodoro', 'feedback',
      ],
    },
    {
      name: 'Pro',
      slug: 'basic',
      description: 'For growing teams that need more',
      price: 8,
      yearlyPrice: 78,
      maxUsers: 50,
      maxStorage: 5120,
      apiAccess: false,
      supportLevel: 'STANDARD',
      sortOrder: 1,
      enabledFeatures: [
        'time_tracking', 'attendance', 'leave_management', 'departments',
        'announcements', 'calendar', 'chat', 'pomodoro', 'feedback',
        'projects', 'shifts', 'overtime', 'timesheets', 'reports',
        'standups', 'leaderboard', 'documents', 'expenses', 'desktop_app', 'mobile_app',
      ],
    },
    {
      name: 'Business',
      slug: 'enterprise',
      description: 'Full platform for scaling organizations',
      price: 16,
      yearlyPrice: 154,
      maxUsers: 500,
      maxStorage: 51200,
      apiAccess: true,
      supportLevel: 'PRIORITY',
      sortOrder: 2,
      enabledFeatures: DEFAULT_FEATURES.map((f) => f.key),
    },
    {
      name: 'Enterprise',
      slug: 'custom',
      description: 'Custom solutions for large enterprises',
      price: 0,
      yearlyPrice: 0,
      maxUsers: -1,
      maxStorage: -1,
      apiAccess: true,
      supportLevel: 'DEDICATED',
      isCustom: true,
      sortOrder: 3,
      enabledFeatures: DEFAULT_FEATURES.map((f) => f.key),
    },
  ]

  for (const planData of plans) {
    const existing = await prisma.plan.findUnique({ where: { slug: planData.slug } })
    if (existing) continue

    await prisma.plan.create({
      data: {
        name: planData.name,
        slug: planData.slug,
        description: planData.description,
        price: planData.price,
        yearlyPrice: planData.yearlyPrice,
        maxUsers: planData.maxUsers,
        maxStorage: planData.maxStorage,
        apiAccess: planData.apiAccess,
        supportLevel: planData.supportLevel,
        isCustom: planData.isCustom || false,
        sortOrder: planData.sortOrder,
        features: {
          create: DEFAULT_FEATURES.map((f) => ({
            featureKey: f.key,
            featureName: f.name,
            enabled: planData.enabledFeatures.includes(f.key),
          })),
        },
      },
    })
  }
}
