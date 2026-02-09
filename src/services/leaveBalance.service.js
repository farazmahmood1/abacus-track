import prisma from '../config/prisma.js'
import ApiError from '../utils/ApiError.js'

/**
 * Get all leave policies
 */
export async function listPolicies() {
  return prisma.leavePolicy.findMany({
    orderBy: { leaveType: 'asc' },
  })
}

/**
 * Create or update a leave policy
 */
export async function upsertPolicy(data) {
  return prisma.leavePolicy.upsert({
    where: { leaveType: data.leaveType },
    create: data,
    update: {
      annualDays: data.annualDays,
      maxCarryOver: data.maxCarryOver ?? 0,
      isActive: data.isActive ?? true,
    },
  })
}

/**
 * Get leave balances for a user for a given year
 */
export async function getUserBalances(userId, year) {
  const currentYear = year || new Date().getFullYear()

  const balances = await prisma.leaveBalance.findMany({
    where: { userId, year: currentYear },
    orderBy: { leaveType: 'asc' },
  })

  return balances.map(b => ({
    ...b,
    remainingDays: b.totalDays + b.carriedOver - b.usedDays,
  }))
}

/**
 * Get all employees' balances for a given year (admin view)
 */
export async function getAllBalances(year, { page = 1, limit = 20 }) {
  const currentYear = year || new Date().getFullYear()

  const [balances, total] = await Promise.all([
    prisma.leaveBalance.findMany({
      where: { year: currentYear },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true, departmentId: true },
        },
      },
      orderBy: [{ userId: 'asc' }, { leaveType: 'asc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.leaveBalance.count({ where: { year: currentYear } }),
  ])

  return {
    data: balances.map(b => ({
      ...b,
      remainingDays: b.totalDays + b.carriedOver - b.usedDays,
    })),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

/**
 * Initialize yearly balances for all employees based on active policies
 */
export async function initializeYearlyBalances(year) {
  const currentYear = year || new Date().getFullYear()

  // Get all active policies
  const policies = await prisma.leavePolicy.findMany({
    where: { isActive: true },
  })

  if (policies.length === 0) {
    throw new ApiError(400, 'No active leave policies found. Create policies first.')
  }

  // Get all active employees (not banned)
  const employees = await prisma.user.findMany({
    where: { banned: { not: true } },
    select: { id: true },
  })

  // For each employee, get previous year balances for carry-over calculation
  const previousYear = currentYear - 1
  const previousBalances = await prisma.leaveBalance.findMany({
    where: { year: previousYear },
  })

  const previousBalanceMap = new Map()
  previousBalances.forEach(b => {
    const key = `${b.userId}-${b.leaveType}`
    previousBalanceMap.set(key, b)
  })

  // Build upsert data
  const operations = []

  for (const employee of employees) {
    for (const policy of policies) {
      const prevKey = `${employee.id}-${policy.leaveType}`
      const prevBalance = previousBalanceMap.get(prevKey)

      // Calculate carry-over: min(remaining days from last year, maxCarryOver)
      let carriedOver = 0
      if (prevBalance && policy.maxCarryOver > 0) {
        const remaining = prevBalance.totalDays + prevBalance.carriedOver - prevBalance.usedDays
        carriedOver = Math.min(Math.max(remaining, 0), policy.maxCarryOver)
      }

      operations.push(
        prisma.leaveBalance.upsert({
          where: {
            userId_leaveType_year: {
              userId: employee.id,
              leaveType: policy.leaveType,
              year: currentYear,
            },
          },
          create: {
            userId: employee.id,
            leaveType: policy.leaveType,
            year: currentYear,
            totalDays: policy.annualDays,
            usedDays: 0,
            carriedOver,
          },
          update: {
            totalDays: policy.annualDays,
            carriedOver,
          },
        })
      )
    }
  }

  // Execute in batches of 50 to avoid overwhelming the DB
  const batchSize = 50
  let created = 0
  for (let i = 0; i < operations.length; i += batchSize) {
    const batch = operations.slice(i, i + batchSize)
    await prisma.$transaction(batch)
    created += batch.length
  }

  return { initialized: created, employees: employees.length, policies: policies.length }
}

/**
 * Manually adjust a leave balance (admin)
 */
export async function adjustBalance(balanceId, data) {
  const existing = await prisma.leaveBalance.findUnique({ where: { id: balanceId } })
  if (!existing) {
    throw new ApiError(404, 'Leave balance not found')
  }

  return prisma.leaveBalance.update({
    where: { id: balanceId },
    data,
  })
}

/**
 * Deduct leave days from balance (called when leave is approved)
 */
export async function deductBalance(userId, leaveType, days) {
  const year = new Date().getFullYear()

  const balance = await prisma.leaveBalance.findUnique({
    where: {
      userId_leaveType_year: { userId, leaveType, year },
    },
  })

  if (!balance) {
    // No balance record means no policy set up — allow the leave but log warning
    return null
  }

  const remaining = balance.totalDays + balance.carriedOver - balance.usedDays
  if (remaining < days) {
    throw new ApiError(400, `Insufficient ${leaveType.toLowerCase().replace(/_/g, ' ')} balance. Remaining: ${remaining} days, requested: ${days} days.`)
  }

  return prisma.leaveBalance.update({
    where: { id: balance.id },
    data: {
      usedDays: { increment: days },
    },
  })
}

/**
 * Restore leave days to balance (called when leave is rejected/cancelled after approval)
 */
export async function restoreBalance(userId, leaveType, days) {
  const year = new Date().getFullYear()

  const balance = await prisma.leaveBalance.findUnique({
    where: {
      userId_leaveType_year: { userId, leaveType, year },
    },
  })

  if (!balance) return null

  return prisma.leaveBalance.update({
    where: { id: balance.id },
    data: {
      usedDays: { decrement: days },
    },
  })
}
