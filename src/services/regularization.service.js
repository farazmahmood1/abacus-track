import prisma from '../config/prisma.js'
import ApiError from '../utils/ApiError.js'

/**
 * Submit a regularization request (employee)
 */
export async function createRegularization(userId, data) {
  const { date, type, requestedTime, reason } = data

  const dateOnly = new Date(new Date(date).toISOString().split('T')[0])

  // Check for existing pending request for same user + date
  const existing = await prisma.attendanceRegularization.findFirst({
    where: {
      userId,
      date: dateOnly,
      status: 'PENDING',
    },
  })

  if (existing) {
    throw new ApiError(400, 'You already have a pending regularization request for this date')
  }

  return prisma.attendanceRegularization.create({
    data: {
      userId,
      date: dateOnly,
      type,
      requestedTime: new Date(requestedTime),
      reason,
    },
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true },
      },
    },
  })
}

/**
 * Get current user's regularization requests
 */
export async function getMyRequests(userId, { page = 1, limit = 20, status }) {
  const where = { userId }
  if (status) where.status = status

  const [records, total] = await Promise.all([
    prisma.attendanceRegularization.findMany({
      where,
      include: {
        approver: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.attendanceRegularization.count({ where }),
  ])

  return {
    data: records,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  }
}

/**
 * List all regularization requests (admin, filterable)
 */
export async function listRegularizations({ userId, status, startDate, endDate, page = 1, limit = 20 }) {
  const where = {}

  if (userId) where.userId = userId
  if (status) where.status = status
  if (startDate || endDate) {
    where.date = {}
    if (startDate) where.date.gte = new Date(startDate)
    if (endDate) where.date.lte = new Date(endDate)
  }

  const [records, total] = await Promise.all([
    prisma.attendanceRegularization.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true, departmentId: true },
        },
        approver: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.attendanceRegularization.count({ where }),
  ])

  return {
    data: records,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  }
}

/**
 * Approve or reject a regularization request (admin)
 * On approval: create/update TimerSession and Timesheet
 */
export async function approveRegularization(id, adminUserId, { status, adminNote }) {
  const existing = await prisma.attendanceRegularization.findUnique({
    where: { id },
    include: { user: true },
  })

  if (!existing) {
    throw new ApiError(404, 'Regularization request not found')
  }

  if (existing.status !== 'PENDING') {
    throw new ApiError(400, 'This request has already been processed')
  }

  const updated = await prisma.attendanceRegularization.update({
    where: { id },
    data: {
      status,
      approvedBy: adminUserId,
      adminNote: adminNote || null,
    },
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true },
      },
      approver: {
        select: { id: true, name: true },
      },
    },
  })

  // On approval, adjust attendance records
  if (status === 'APPROVED') {
    await applyRegularization(existing)
  }

  return updated
}

/**
 * Apply a regularization to attendance records
 */
async function applyRegularization(regularization) {
  const { userId, date, type, requestedTime } = regularization
  const dateOnly = new Date(date)

  switch (type) {
    case 'MISSED_CHECKIN': {
      // Create a timer session with the requested check-in time
      const existingSession = await prisma.timerSession.findFirst({
        where: {
          userId,
          startTime: {
            gte: new Date(dateOnly.getFullYear(), dateOnly.getMonth(), dateOnly.getDate()),
            lt: new Date(dateOnly.getFullYear(), dateOnly.getMonth(), dateOnly.getDate() + 1),
          },
        },
      })

      if (!existingSession) {
        await prisma.timerSession.create({
          data: {
            userId,
            startTime: new Date(requestedTime),
            isActive: false,
            status: 'checked_out',
          },
        })
      }
      break
    }

    case 'MISSED_CHECKOUT': {
      // Find the open session for that day and close it
      const session = await prisma.timerSession.findFirst({
        where: {
          userId,
          startTime: {
            gte: new Date(dateOnly.getFullYear(), dateOnly.getMonth(), dateOnly.getDate()),
            lt: new Date(dateOnly.getFullYear(), dateOnly.getMonth(), dateOnly.getDate() + 1),
          },
          endTime: null,
        },
      })

      if (session) {
        const totalDuration = Math.floor(
          (new Date(requestedTime).getTime() - session.startTime.getTime()) / 1000
        )

        await prisma.timerSession.update({
          where: { id: session.id },
          data: {
            endTime: new Date(requestedTime),
            totalDuration: Math.max(0, totalDuration),
            isActive: false,
            status: 'checked_out',
          },
        })

        // Update or create timesheet for that day
        const workHours = totalDuration / 3600
        await prisma.timesheet.upsert({
          where: { userId_workDate: { userId, workDate: dateOnly } },
          create: {
            userId,
            projectId: session.projectId,
            workDate: dateOnly,
            checkInTime: session.startTime,
            checkOutTime: new Date(requestedTime),
            totalHours: workHours,
          },
          update: {
            checkOutTime: new Date(requestedTime),
            totalHours: workHours,
          },
        })
      }
      break
    }

    case 'WRONG_TIME': {
      // Update the session's check-in or check-out time
      const session = await prisma.timerSession.findFirst({
        where: {
          userId,
          startTime: {
            gte: new Date(dateOnly.getFullYear(), dateOnly.getMonth(), dateOnly.getDate()),
            lt: new Date(dateOnly.getFullYear(), dateOnly.getMonth(), dateOnly.getDate() + 1),
          },
        },
        orderBy: { startTime: 'asc' },
      })

      if (session) {
        // If requestedTime is before original startTime, it's a check-in correction
        // Otherwise, it's a check-out correction
        const reqTime = new Date(requestedTime)
        if (reqTime < session.startTime) {
          await prisma.timerSession.update({
            where: { id: session.id },
            data: { startTime: reqTime },
          })
        } else if (session.endTime) {
          const totalDuration = Math.floor(
            (reqTime.getTime() - session.startTime.getTime()) / 1000
          )
          await prisma.timerSession.update({
            where: { id: session.id },
            data: {
              endTime: reqTime,
              totalDuration: Math.max(0, totalDuration),
            },
          })
        }
      }
      break
    }
  }
}
