import prisma from '../config/prisma.js'
import ApiError from '../utils/ApiError.js'

/**
 * Get or create the overtime config (singleton)
 */
export async function getConfig() {
  let config = await prisma.overtimeConfig.findFirst()
  if (!config) {
    config = await prisma.overtimeConfig.create({
      data: {},
    })
  }
  return config
}

/**
 * Update overtime config
 */
export async function updateConfig(data) {
  let config = await prisma.overtimeConfig.findFirst()
  if (!config) {
    return prisma.overtimeConfig.create({ data })
  }
  return prisma.overtimeConfig.update({
    where: { id: config.id },
    data,
  })
}

/**
 * Record overtime for a user on checkout
 * Called from timer.service.js when a user checks out
 */
export async function recordOvertime(userId, date, totalHoursWorked) {
  const config = await getConfig()
  if (!config.isActive) return null

  const regularHours = Math.min(totalHoursWorked, config.dailyLimitHours)
  const overtimeHours = Math.max(0, totalHoursWorked - config.dailyLimitHours)

  return prisma.overtimeRecord.upsert({
    where: {
      userId_date: {
        userId,
        date: new Date(date.toISOString().split('T')[0]),
      },
    },
    create: {
      userId,
      date: new Date(date.toISOString().split('T')[0]),
      regularHours,
      overtimeHours,
      totalHours: totalHoursWorked,
    },
    update: {
      regularHours,
      overtimeHours,
      totalHours: totalHoursWorked,
    },
  })
}

/**
 * Get current user's overtime records
 */
export async function getMyOvertime(userId, { startDate, endDate, page = 1, limit = 20 }) {
  const where = { userId }

  if (startDate || endDate) {
    where.date = {}
    if (startDate) where.date.gte = new Date(startDate)
    if (endDate) where.date.lte = new Date(endDate)
  }

  const [records, total] = await Promise.all([
    prisma.overtimeRecord.findMany({
      where,
      orderBy: { date: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.overtimeRecord.count({ where }),
  ])

  return {
    data: records,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  }
}

/**
 * Get all overtime records (admin)
 */
export async function getAllOvertime({ startDate, endDate, userId, page = 1, limit = 20 }) {
  const where = {}

  if (userId) where.userId = userId
  if (startDate || endDate) {
    where.date = {}
    if (startDate) where.date.gte = new Date(startDate)
    if (endDate) where.date.lte = new Date(endDate)
  }

  const [records, total] = await Promise.all([
    prisma.overtimeRecord.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true, departmentId: true },
        },
      },
      orderBy: { date: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.overtimeRecord.count({ where }),
  ])

  return {
    data: records,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  }
}

/**
 * Get employees near or exceeding overtime limits (alerts)
 */
export async function getAlerts() {
  const config = await getConfig()
  if (!config.isActive) return []

  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay()) // Sunday
  weekStart.setHours(0, 0, 0, 0)

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  // Get weekly overtime aggregates
  const weeklyData = await prisma.overtimeRecord.groupBy({
    by: ['userId'],
    where: {
      date: { gte: weekStart },
    },
    _sum: { totalHours: true, overtimeHours: true },
  })

  // Get monthly overtime aggregates
  const monthlyData = await prisma.overtimeRecord.groupBy({
    by: ['userId'],
    where: {
      date: { gte: monthStart },
    },
    _sum: { totalHours: true, overtimeHours: true },
  })

  const threshold = config.alertThreshold
  const alerts = []

  // Build alerts map by user
  const userIds = new Set([
    ...weeklyData.map(d => d.userId),
    ...monthlyData.map(d => d.userId),
  ])

  // Get user details
  const users = await prisma.user.findMany({
    where: { id: { in: Array.from(userIds) } },
    select: { id: true, name: true, email: true, departmentId: true },
  })

  const userMap = new Map(users.map(u => [u.id, u]))

  for (const userId of userIds) {
    const user = userMap.get(userId)
    if (!user) continue

    const weekly = weeklyData.find(d => d.userId === userId)
    const monthly = monthlyData.find(d => d.userId === userId)

    const weeklyTotal = weekly?._sum.totalHours || 0
    const monthlyTotal = monthly?._sum.totalHours || 0

    if (weeklyTotal >= config.weeklyLimitHours * threshold) {
      alerts.push({
        userId,
        user,
        type: 'weekly',
        currentHours: weeklyTotal,
        limitHours: config.weeklyLimitHours,
        percentage: Math.round((weeklyTotal / config.weeklyLimitHours) * 100),
        exceeded: weeklyTotal >= config.weeklyLimitHours,
      })
    }

    if (monthlyTotal >= config.monthlyLimitHours * threshold) {
      alerts.push({
        userId,
        user,
        type: 'monthly',
        currentHours: monthlyTotal,
        limitHours: config.monthlyLimitHours,
        percentage: Math.round((monthlyTotal / config.monthlyLimitHours) * 100),
        exceeded: monthlyTotal >= config.monthlyLimitHours,
      })
    }
  }

  return alerts.sort((a, b) => b.percentage - a.percentage)
}

/**
 * Get overtime summary (weekly/monthly totals)
 */
export async function getSummary(userId) {
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay())
  weekStart.setHours(0, 0, 0, 0)

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const where = userId ? { userId } : {}

  const [weeklyAgg, monthlyAgg] = await Promise.all([
    prisma.overtimeRecord.aggregate({
      where: { ...where, date: { gte: weekStart } },
      _sum: { totalHours: true, overtimeHours: true, regularHours: true },
    }),
    prisma.overtimeRecord.aggregate({
      where: { ...where, date: { gte: monthStart } },
      _sum: { totalHours: true, overtimeHours: true, regularHours: true },
    }),
  ])

  const config = await getConfig()

  return {
    weekly: {
      totalHours: weeklyAgg._sum.totalHours || 0,
      overtimeHours: weeklyAgg._sum.overtimeHours || 0,
      regularHours: weeklyAgg._sum.regularHours || 0,
      limit: config.weeklyLimitHours,
    },
    monthly: {
      totalHours: monthlyAgg._sum.totalHours || 0,
      overtimeHours: monthlyAgg._sum.overtimeHours || 0,
      regularHours: monthlyAgg._sum.regularHours || 0,
      limit: config.monthlyLimitHours,
    },
    config,
  }
}
