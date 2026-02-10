import prisma from '../config/prisma.js'
import ApiError from '../utils/ApiError.js'

/**
 * List all shifts
 */
export async function listShifts() {
  return prisma.shift.findMany({
    orderBy: { createdAt: 'asc' },
    include: {
      _count: {
        select: { employees: true },
      },
    },
  })
}

/**
 * Get a shift by ID
 */
export async function getShiftById(id) {
  const shift = await prisma.shift.findUnique({
    where: { id },
    include: {
      employees: {
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true, departmentId: true },
          },
        },
        where: {
          OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
        },
      },
    },
  })

  if (!shift) {
    throw new ApiError(404, 'Shift not found')
  }

  return shift
}

/**
 * Create a new shift
 */
export async function createShift(data) {
  // If this shift is marked as default, unset any existing default
  if (data.isDefault) {
    await prisma.shift.updateMany({
      where: { isDefault: true },
      data: { isDefault: false },
    })
  }

  return prisma.shift.create({ data })
}

/**
 * Update a shift
 */
export async function updateShift(id, data) {
  const existing = await prisma.shift.findUnique({ where: { id } })
  if (!existing) {
    throw new ApiError(404, 'Shift not found')
  }

  // If setting as default, unset others
  if (data.isDefault) {
    await prisma.shift.updateMany({
      where: { isDefault: true, id: { not: id } },
      data: { isDefault: false },
    })
  }

  return prisma.shift.update({ where: { id }, data })
}

/**
 * Delete a shift
 */
export async function deleteShift(id) {
  const existing = await prisma.shift.findUnique({
    where: { id },
    include: { _count: { select: { employees: true } } },
  })

  if (!existing) {
    throw new ApiError(404, 'Shift not found')
  }

  if (existing._count.employees > 0) {
    throw new ApiError(400, 'Cannot delete shift with assigned employees. Unassign them first.')
  }

  return prisma.shift.delete({ where: { id } })
}

/**
 * Assign an employee to a shift
 */
export async function assignEmployeeToShift({ userId, shiftId, startDate, endDate }) {
  // Validate user exists
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    throw new ApiError(404, 'User not found')
  }

  // Validate shift exists
  const shift = await prisma.shift.findUnique({ where: { id: shiftId } })
  if (!shift) {
    throw new ApiError(404, 'Shift not found')
  }

  // End any current active shift assignments for this user
  await prisma.userShift.updateMany({
    where: {
      userId,
      endDate: null,
    },
    data: {
      endDate: new Date(startDate),
    },
  })

  return prisma.userShift.create({
    data: {
      userId,
      shiftId,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      shift: true,
    },
  })
}

/**
 * Unassign an employee from a shift (end the assignment)
 */
export async function unassignEmployeeFromShift({ userId, shiftId }) {
  const assignment = await prisma.userShift.findFirst({
    where: {
      userId,
      shiftId,
      endDate: null,
    },
  })

  if (!assignment) {
    throw new ApiError(404, 'Active shift assignment not found')
  }

  return prisma.userShift.update({
    where: { id: assignment.id },
    data: { endDate: new Date() },
  })
}

/**
 * Get current user's active shift
 */
export async function getMyShift(userId) {
  const now = new Date()

  const assignment = await prisma.userShift.findFirst({
    where: {
      userId,
      startDate: { lte: now },
      OR: [{ endDate: null }, { endDate: { gte: now } }],
    },
    include: {
      shift: true,
    },
    orderBy: { startDate: 'desc' },
  })

  return assignment?.shift || null
}

/**
 * Get employees in a shift
 */
export async function getShiftEmployees(shiftId) {
  const shift = await prisma.shift.findUnique({ where: { id: shiftId } })
  if (!shift) {
    throw new ApiError(404, 'Shift not found')
  }

  const assignments = await prisma.userShift.findMany({
    where: {
      shiftId,
      OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          uniqueId: true,
          departmentId: true,
          department: { select: { name: true } },
        },
      },
    },
  })

  return assignments.map(a => ({
    ...a.user,
    assignedAt: a.startDate,
    assignmentId: a.id,
  }))
}

// ============================================
// Shift Schedule (Drag-and-Drop)
// ============================================

export async function getSchedule(weekStart, departmentId) {
  const start = new Date(weekStart)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 7)

  const where = {
    date: { gte: start, lt: end },
  }

  if (departmentId) {
    where.employee = { departmentId }
  }

  return prisma.shiftScheduleEntry.findMany({
    where,
    include: {
      employee: { select: { id: true, name: true, email: true, image: true, departmentId: true } },
      shift: { select: { id: true, name: true, startTime: true, endTime: true } },
    },
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
  })
}

export async function createScheduleEntry(data) {
  return prisma.shiftScheduleEntry.create({
    data: {
      employeeId: data.employeeId,
      shiftId: data.shiftId,
      date: new Date(data.date),
      startTime: data.startTime,
      endTime: data.endTime,
      createdBy: data.createdBy,
    },
    include: {
      employee: { select: { id: true, name: true, email: true, image: true } },
      shift: { select: { id: true, name: true, startTime: true, endTime: true } },
    },
  })
}

export async function bulkCreateScheduleEntries(entries, createdBy) {
  const results = []
  for (const entry of entries) {
    const created = await createScheduleEntry({ ...entry, createdBy })
    results.push(created)
  }
  return results
}

export async function moveScheduleEntry(id, data) {
  const entry = await prisma.shiftScheduleEntry.findUnique({ where: { id } })
  if (!entry) throw new ApiError(404, 'Schedule entry not found')

  const updateData = {}
  if (data.date) updateData.date = new Date(data.date)
  if (data.employeeId) updateData.employeeId = data.employeeId
  if (data.shiftId) updateData.shiftId = data.shiftId
  if (data.startTime) updateData.startTime = data.startTime
  if (data.endTime) updateData.endTime = data.endTime

  return prisma.shiftScheduleEntry.update({
    where: { id },
    data: updateData,
    include: {
      employee: { select: { id: true, name: true, email: true, image: true } },
      shift: { select: { id: true, name: true, startTime: true, endTime: true } },
    },
  })
}

export async function deleteScheduleEntry(id) {
  const entry = await prisma.shiftScheduleEntry.findUnique({ where: { id } })
  if (!entry) throw new ApiError(404, 'Schedule entry not found')
  return prisma.shiftScheduleEntry.delete({ where: { id } })
}

// ============================================
// Shift Swap Requests
// ============================================

export async function createSwapRequest(data) {
  return prisma.shiftSwapRequest.create({
    data: {
      requesterId: data.requesterId,
      requesterScheduleId: data.requesterScheduleId,
      targetEmployeeId: data.targetEmployeeId,
      targetScheduleId: data.targetScheduleId,
      reason: data.reason || null,
    },
    include: {
      requester: { select: { id: true, name: true, image: true } },
      targetEmployee: { select: { id: true, name: true, image: true } },
    },
  })
}

export async function getSwapRequests(filters = {}) {
  const { status, page = 1, limit = 10 } = filters
  const skip = (page - 1) * limit
  const where = {}
  if (status) where.status = status

  const [data, total] = await Promise.all([
    prisma.shiftSwapRequest.findMany({
      where,
      include: {
        requester: { select: { id: true, name: true, image: true } },
        targetEmployee: { select: { id: true, name: true, image: true } },
        reviewer: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.shiftSwapRequest.count({ where }),
  ])

  return { data, meta: { page, total, totalPages: Math.ceil(total / limit) } }
}

export async function getMySwapRequests(userId) {
  return prisma.shiftSwapRequest.findMany({
    where: {
      OR: [{ requesterId: userId }, { targetEmployeeId: userId }],
    },
    include: {
      requester: { select: { id: true, name: true, image: true } },
      targetEmployee: { select: { id: true, name: true, image: true } },
      reviewer: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function respondToSwapRequest(id, status, reviewerId, adminNote) {
  const request = await prisma.shiftSwapRequest.findUnique({ where: { id } })
  if (!request) throw new ApiError(404, 'Swap request not found')
  if (request.status !== 'PENDING') throw new ApiError(400, 'Request already processed')

  const updated = await prisma.shiftSwapRequest.update({
    where: { id },
    data: {
      status,
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
      adminNote: adminNote || null,
    },
  })

  // If approved, swap the schedule entries
  if (status === 'APPROVED') {
    const requesterEntry = await prisma.shiftScheduleEntry.findUnique({ where: { id: request.requesterScheduleId } })
    const targetEntry = await prisma.shiftScheduleEntry.findUnique({ where: { id: request.targetScheduleId } })

    if (requesterEntry && targetEntry) {
      await prisma.$transaction([
        prisma.shiftScheduleEntry.update({
          where: { id: requesterEntry.id },
          data: { employeeId: targetEntry.employeeId },
        }),
        prisma.shiftScheduleEntry.update({
          where: { id: targetEntry.id },
          data: { employeeId: requesterEntry.employeeId },
        }),
      ])
    }
  }

  return updated
}

// ============================================
// Shift Conflict Detection
// ============================================

export async function checkConflicts(weekStart) {
  const schedule = await getSchedule(weekStart)
  const settings = await getShiftSettings()
  const conflicts = []

  // Group by employee
  const byEmployee = {}
  schedule.forEach(entry => {
    if (!byEmployee[entry.employeeId]) byEmployee[entry.employeeId] = []
    byEmployee[entry.employeeId].push(entry)
  })

  for (const [employeeId, entries] of Object.entries(byEmployee)) {
    const sorted = entries.sort((a, b) => {
      const dateA = new Date(a.date).getTime() + parseTime(a.startTime)
      const dateB = new Date(b.date).getTime() + parseTime(b.startTime)
      return dateA - dateB
    })

    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const a = sorted[i]
        const b = sorted[j]
        const aDate = new Date(a.date).toISOString().split('T')[0]
        const bDate = new Date(b.date).toISOString().split('T')[0]

        // Same day overlap
        if (aDate === bDate) {
          if (timeOverlaps(a.startTime, a.endTime, b.startTime, b.endTime)) {
            conflicts.push({
              entryId: a.id,
              conflictingEntryId: b.id,
              type: 'OVERLAP',
              reason: `${a.employee.name} has overlapping shifts on ${aDate}`,
            })
          }
        }

        // Rest period check (between consecutive days)
        const aEnd = new Date(a.date).getTime() + parseTime(a.endTime)
        const bStart = new Date(b.date).getTime() + parseTime(b.startTime)
        const restHours = (bStart - aEnd) / (1000 * 60 * 60)

        if (restHours > 0 && restHours < settings.minRestPeriodHours) {
          conflicts.push({
            entryId: a.id,
            conflictingEntryId: b.id,
            type: 'REST_PERIOD_VIOLATION',
            reason: `${a.employee.name} has only ${restHours.toFixed(1)}h rest (min: ${settings.minRestPeriodHours}h)`,
          })
        }
      }
    }
  }

  return conflicts
}

function parseTime(timeStr) {
  const [h, m] = timeStr.split(':').map(Number)
  return (h * 60 + m) * 60 * 1000
}

function timeOverlaps(start1, end1, start2, end2) {
  const s1 = parseTime(start1), e1 = parseTime(end1)
  const s2 = parseTime(start2), e2 = parseTime(end2)
  return s1 < e2 && s2 < e1
}

// ============================================
// Employee Availability
// ============================================

export async function getMyAvailability(userId) {
  return prisma.employeeAvailability.findMany({
    where: { userId },
    orderBy: { dayOfWeek: 'asc' },
  })
}

export async function updateMyAvailability(userId, slots) {
  // Delete existing and recreate
  await prisma.employeeAvailability.deleteMany({ where: { userId } })

  if (slots.length === 0) return []

  await prisma.employeeAvailability.createMany({
    data: slots.map(s => ({
      userId,
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
      isAvailable: s.isAvailable !== undefined ? s.isAvailable : true,
    })),
  })

  return prisma.employeeAvailability.findMany({
    where: { userId },
    orderBy: { dayOfWeek: 'asc' },
  })
}

export async function getEmployeeAvailability(employeeId) {
  return prisma.employeeAvailability.findMany({
    where: { userId: employeeId },
    orderBy: { dayOfWeek: 'asc' },
  })
}

export async function getDepartmentAvailability(departmentId) {
  const employees = await prisma.user.findMany({
    where: { departmentId, banned: { not: true } },
    select: {
      id: true, name: true, image: true,
      availability: { orderBy: { dayOfWeek: 'asc' } },
    },
  })
  return employees
}

// ============================================
// Shift Settings (Rest Period)
// ============================================

export async function getShiftSettings() {
  let settings = await prisma.shiftSettings.findFirst()
  if (!settings) {
    settings = await prisma.shiftSettings.create({
      data: { minRestPeriodHours: 11, maxShiftHours: 12 },
    })
  }
  return settings
}

export async function updateShiftSettings(data) {
  const existing = await prisma.shiftSettings.findFirst()
  if (existing) {
    return prisma.shiftSettings.update({
      where: { id: existing.id },
      data: {
        minRestPeriodHours: data.minRestPeriodHours ?? existing.minRestPeriodHours,
        maxShiftHours: data.maxShiftHours ?? existing.maxShiftHours,
      },
    })
  }
  return prisma.shiftSettings.create({ data })
}
