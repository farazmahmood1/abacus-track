import prisma from '../config/prisma.js'
import ApiError from '../utils/ApiError.js'

/**
 * Get current week data for submission (auto-populate from existing Timesheet records)
 */
export async function getCurrentWeekData(userId, weekStartStr) {
  const weekStart = new Date(weekStartStr)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)

  // Check if already submitted
  const existing = await prisma.timesheetSubmission.findUnique({
    where: { userId_weekStart: { userId, weekStart } },
    include: {
      entries: {
        include: { project: { select: { id: true, name: true } } },
      },
    },
  })

  if (existing) {
    return { submission: existing, isSubmitted: true }
  }

  // Auto-populate from existing Timesheet records for the week
  const timesheets = await prisma.timesheet.findMany({
    where: {
      userId,
      workDate: { gte: weekStart, lte: weekEnd },
    },
    include: {
      project: { select: { id: true, name: true } },
    },
    orderBy: { workDate: 'asc' },
  })

  const autoEntries = timesheets.map((ts) => ({
    date: ts.workDate,
    projectId: ts.projectId,
    project: ts.project,
    hours: ts.totalHours || 0,
    description: ts.notes || '',
  }))

  return { entries: autoEntries, isSubmitted: false }
}

/**
 * Submit a weekly timesheet
 */
export async function submitTimesheet(userId, data) {
  const { weekStart: weekStartStr, entries } = data

  const weekStart = new Date(new Date(weekStartStr).toISOString().split('T')[0])
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)

  // Check for existing submission
  const existing = await prisma.timesheetSubmission.findUnique({
    where: { userId_weekStart: { userId, weekStart } },
  })

  if (existing) {
    if (existing.status === 'APPROVED') {
      throw new ApiError(400, 'This week\'s timesheet has already been approved')
    }
    // If pending or rejected, allow resubmission by deleting old one
    await prisma.timesheetSubmission.delete({ where: { id: existing.id } })
  }

  const totalHours = entries.reduce((sum, e) => sum + e.hours, 0)

  const submission = await prisma.timesheetSubmission.create({
    data: {
      userId,
      weekStart,
      weekEnd,
      totalHours,
      entries: {
        create: entries.map((entry) => ({
          date: new Date(new Date(entry.date).toISOString().split('T')[0]),
          projectId: entry.projectId || null,
          hours: entry.hours,
          description: entry.description || null,
        })),
      },
    },
    include: {
      entries: {
        include: { project: { select: { id: true, name: true } } },
      },
      user: { select: { id: true, name: true, email: true, image: true } },
    },
  })

  return submission
}

/**
 * Get current user's submissions
 */
export async function getMySubmissions(userId, { page = 1, limit = 10, status }) {
  const where = { userId }
  if (status) where.status = status

  const [records, total] = await Promise.all([
    prisma.timesheetSubmission.findMany({
      where,
      include: {
        entries: {
          include: { project: { select: { id: true, name: true } } },
          orderBy: { date: 'asc' },
        },
        approver: { select: { id: true, name: true } },
      },
      orderBy: { weekStart: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.timesheetSubmission.count({ where }),
  ])

  return {
    data: records,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  }
}

/**
 * List all submissions (admin, filterable)
 */
export async function listSubmissions({ userId, status, startDate, endDate, page = 1, limit = 15 }) {
  const where = {}

  if (userId) where.userId = userId
  if (status) where.status = status
  if (startDate || endDate) {
    where.weekStart = {}
    if (startDate) where.weekStart.gte = new Date(startDate)
    if (endDate) where.weekStart.lte = new Date(endDate)
  }

  const [records, total] = await Promise.all([
    prisma.timesheetSubmission.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, image: true, departmentId: true } },
        entries: {
          include: { project: { select: { id: true, name: true } } },
          orderBy: { date: 'asc' },
        },
        approver: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.timesheetSubmission.count({ where }),
  ])

  return {
    data: records,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  }
}

/**
 * Get a single submission by ID
 */
export async function getSubmission(id) {
  const submission = await prisma.timesheetSubmission.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, image: true, departmentId: true } },
      entries: {
        include: { project: { select: { id: true, name: true } } },
        orderBy: { date: 'asc' },
      },
      approver: { select: { id: true, name: true } },
    },
  })

  if (!submission) throw new ApiError(404, 'Timesheet submission not found')
  return submission
}

/**
 * Approve or reject a timesheet submission (admin)
 */
export async function approveSubmission(id, adminUserId, { status, adminNote }) {
  const existing = await prisma.timesheetSubmission.findUnique({ where: { id } })

  if (!existing) throw new ApiError(404, 'Timesheet submission not found')
  if (existing.status !== 'PENDING') {
    throw new ApiError(400, 'This submission has already been processed')
  }

  return prisma.timesheetSubmission.update({
    where: { id },
    data: {
      status,
      approvedBy: adminUserId,
      approvedAt: new Date(),
      adminNote: adminNote || null,
    },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
      entries: {
        include: { project: { select: { id: true, name: true } } },
        orderBy: { date: 'asc' },
      },
      approver: { select: { id: true, name: true } },
    },
  })
}
