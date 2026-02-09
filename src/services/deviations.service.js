import prisma from '../config/prisma.js'
import ApiError from '../utils/ApiError.js'

/**
 * Record a deviation on check-in (late arrival)
 * Called from timer.service.js
 */
export async function recordCheckInDeviation(userId, timerSessionId, checkInTime) {
  // Get user's active shift
  const now = new Date(checkInTime)
  const assignment = await prisma.userShift.findFirst({
    where: {
      userId,
      startDate: { lte: now },
      OR: [{ endDate: null }, { endDate: { gte: now } }],
    },
    include: { shift: true },
    orderBy: { startDate: 'desc' },
  })

  if (!assignment?.shift) return null // No shift assigned, skip

  const shift = assignment.shift
  const [startH, startM] = shift.startTime.split(':').map(Number)
  const [endH, endM] = shift.endTime.split(':').map(Number)

  // Build expected start/end for today
  const expectedStart = new Date(now)
  expectedStart.setHours(startH, startM, 0, 0)

  const expectedEnd = new Date(now)
  expectedEnd.setHours(endH, endM, 0, 0)

  // Calculate late minutes (check-in after expected start + grace)
  const graceMs = shift.graceMinutes * 60 * 1000
  const lateMs = now.getTime() - expectedStart.getTime() - graceMs
  const lateMinutes = lateMs > 0 ? Math.ceil(lateMs / 60000) : 0

  // Only record if actually late
  if (lateMinutes <= 0) return null

  const dateOnly = new Date(now.toISOString().split('T')[0])

  return prisma.attendanceDeviation.upsert({
    where: {
      userId_date: { userId, date: dateOnly },
    },
    create: {
      userId,
      date: dateOnly,
      timerSessionId,
      expectedStart,
      actualStart: now,
      expectedEnd,
      lateMinutes,
    },
    update: {
      timerSessionId,
      actualStart: now,
      lateMinutes,
    },
  })
}

/**
 * Record a deviation on check-out (early departure)
 * Called from timer.service.js
 */
export async function recordCheckOutDeviation(userId, timerSessionId, checkOutTime) {
  const now = new Date(checkOutTime)
  const assignment = await prisma.userShift.findFirst({
    where: {
      userId,
      startDate: { lte: now },
      OR: [{ endDate: null }, { endDate: { gte: now } }],
    },
    include: { shift: true },
    orderBy: { startDate: 'desc' },
  })

  if (!assignment?.shift) return null

  const shift = assignment.shift
  const [endH, endM] = shift.endTime.split(':').map(Number)

  const expectedEnd = new Date(now)
  expectedEnd.setHours(endH, endM, 0, 0)

  // Calculate early departure minutes
  const earlyMs = expectedEnd.getTime() - now.getTime()
  const earlyMinutes = earlyMs > 0 ? Math.ceil(earlyMs / 60000) : 0

  if (earlyMinutes <= 0) return null // Left on time or after expected end

  const dateOnly = new Date(now.toISOString().split('T')[0])

  // Update existing deviation record or create one
  const existing = await prisma.attendanceDeviation.findUnique({
    where: { userId_date: { userId, date: dateOnly } },
  })

  if (existing) {
    return prisma.attendanceDeviation.update({
      where: { id: existing.id },
      data: {
        actualEnd: now,
        earlyMinutes,
      },
    })
  }

  // Create new record (early departure without late arrival)
  const [startH, startM] = shift.startTime.split(':').map(Number)
  const expectedStart = new Date(now)
  expectedStart.setHours(startH, startM, 0, 0)

  return prisma.attendanceDeviation.create({
    data: {
      userId,
      date: dateOnly,
      timerSessionId,
      expectedStart,
      actualStart: expectedStart, // Assume on-time arrival
      expectedEnd,
      actualEnd: now,
      earlyMinutes,
    },
  })
}

/**
 * List deviations (admin, filterable)
 */
export async function listDeviations({ userId, startDate, endDate, page = 1, limit = 20 }) {
  const where = {}

  if (userId) where.userId = userId
  if (startDate || endDate) {
    where.date = {}
    if (startDate) where.date.gte = new Date(startDate)
    if (endDate) where.date.lte = new Date(endDate)
  }

  const [records, total] = await Promise.all([
    prisma.attendanceDeviation.findMany({
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
    prisma.attendanceDeviation.count({ where }),
  ])

  return {
    data: records,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  }
}

/**
 * Get current user's deviations
 */
export async function getMyDeviations(userId, { startDate, endDate, page = 1, limit = 20 }) {
  return listDeviations({ userId, startDate, endDate, page, limit })
}

/**
 * Mark deviation as excused (admin)
 */
export async function excuseDeviation(id, excuseReason) {
  const existing = await prisma.attendanceDeviation.findUnique({ where: { id } })
  if (!existing) {
    throw new ApiError(404, 'Deviation not found')
  }

  return prisma.attendanceDeviation.update({
    where: { id },
    data: { isExcused: true, excuseReason },
  })
}

/**
 * Get deviation summary stats
 */
export async function getDeviationSummary({ startDate, endDate }) {
  const where = {}
  if (startDate || endDate) {
    where.date = {}
    if (startDate) where.date.gte = new Date(startDate)
    if (endDate) where.date.lte = new Date(endDate)
  }

  const [totalLate, totalEarly, totalExcused] = await Promise.all([
    prisma.attendanceDeviation.count({ where: { ...where, lateMinutes: { gt: 0 } } }),
    prisma.attendanceDeviation.count({ where: { ...where, earlyMinutes: { gt: 0 } } }),
    prisma.attendanceDeviation.count({ where: { ...where, isExcused: true } }),
  ])

  return { totalLate, totalEarly, totalExcused }
}
