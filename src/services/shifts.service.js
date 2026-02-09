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
