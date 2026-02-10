import prisma from '../config/prisma.js'
import ApiError from '../utils/ApiError.js'

/**
 * Compute the next send date based on frequency.
 * DAILY: next day at 8 AM UTC
 * WEEKLY: next Monday at 8 AM UTC
 * MONTHLY: 1st of next month at 8 AM UTC
 */
export function computeNextSendAt(frequency, fromDate = new Date()) {
  const date = new Date(fromDate)

  switch (frequency) {
    case 'DAILY': {
      date.setUTCDate(date.getUTCDate() + 1)
      date.setUTCHours(8, 0, 0, 0)
      return date
    }
    case 'WEEKLY': {
      // Next Monday
      const dayOfWeek = date.getUTCDay() // 0=Sun, 1=Mon, ...
      const daysUntilMonday = dayOfWeek === 0 ? 1 : dayOfWeek === 1 ? 7 : 8 - dayOfWeek
      date.setUTCDate(date.getUTCDate() + daysUntilMonday)
      date.setUTCHours(8, 0, 0, 0)
      return date
    }
    case 'MONTHLY': {
      // 1st of next month
      date.setUTCMonth(date.getUTCMonth() + 1, 1)
      date.setUTCHours(8, 0, 0, 0)
      return date
    }
    default:
      throw new ApiError(400, `Invalid frequency: ${frequency}`)
  }
}

export async function createScheduledReport(userId, data) {
  const nextSendAt = computeNextSendAt(data.frequency)

  return prisma.scheduledReport.create({
    data: {
      name: data.name,
      reportType: data.reportType,
      frequency: data.frequency,
      recipients: data.recipients,
      filters: data.filters || null,
      isActive: data.isActive !== undefined ? data.isActive : true,
      nextSendAt,
      createdBy: userId,
    },
    include: {
      creator: { select: { id: true, name: true, email: true } },
    },
  })
}

export async function getScheduledReports(page = 1, limit = 10) {
  const skip = (page - 1) * limit

  const [records, total] = await Promise.all([
    prisma.scheduledReport.findMany({
      include: {
        creator: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.scheduledReport.count(),
  ])

  return {
    data: records,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  }
}

export async function getScheduledReport(id) {
  const report = await prisma.scheduledReport.findUnique({
    where: { id },
    include: {
      creator: { select: { id: true, name: true, email: true } },
    },
  })
  if (!report) throw new ApiError(404, 'Scheduled report not found')
  return report
}

export async function updateScheduledReport(id, data) {
  const existing = await prisma.scheduledReport.findUnique({ where: { id } })
  if (!existing) throw new ApiError(404, 'Scheduled report not found')

  const updateData = {}
  if (data.name !== undefined) updateData.name = data.name
  if (data.reportType !== undefined) updateData.reportType = data.reportType
  if (data.frequency !== undefined) {
    updateData.frequency = data.frequency
    updateData.nextSendAt = computeNextSendAt(data.frequency)
  }
  if (data.recipients !== undefined) updateData.recipients = data.recipients
  if (data.filters !== undefined) updateData.filters = data.filters
  if (data.isActive !== undefined) updateData.isActive = data.isActive

  return prisma.scheduledReport.update({
    where: { id },
    data: updateData,
    include: {
      creator: { select: { id: true, name: true, email: true } },
    },
  })
}

export async function deleteScheduledReport(id) {
  const existing = await prisma.scheduledReport.findUnique({ where: { id } })
  if (!existing) throw new ApiError(404, 'Scheduled report not found')

  return prisma.scheduledReport.delete({ where: { id } })
}

export async function toggleActive(id) {
  const existing = await prisma.scheduledReport.findUnique({ where: { id } })
  if (!existing) throw new ApiError(404, 'Scheduled report not found')

  const isActive = !existing.isActive
  const updateData = { isActive }

  // Recompute nextSendAt when re-activating
  if (isActive) {
    updateData.nextSendAt = computeNextSendAt(existing.frequency)
  }

  return prisma.scheduledReport.update({
    where: { id },
    data: updateData,
    include: {
      creator: { select: { id: true, name: true, email: true } },
    },
  })
}
