import prisma from '../config/prisma.js'

/**
 * List holidays, optionally filtered by year
 */
export async function listHolidays({ year } = {}) {
  const where = {}
  if (year) {
    where.date = {
      gte: new Date(`${year}-01-01`),
      lt: new Date(`${Number(year) + 1}-01-01`),
    }
  }
  return prisma.holiday.findMany({ where, orderBy: { date: 'asc' } })
}

/**
 * Create a holiday
 */
export async function createHoliday(data) {
  return prisma.holiday.create({
    data: {
      name: data.name,
      date: new Date(data.date + 'T00:00:00Z'),
      isOptional: data.isOptional || false,
    },
  })
}

/**
 * Update a holiday
 */
export async function updateHoliday(id, data) {
  const updateData = {}
  if (data.name !== undefined) updateData.name = data.name
  if (data.date !== undefined) updateData.date = new Date(data.date + 'T00:00:00Z')
  if (data.isOptional !== undefined) updateData.isOptional = data.isOptional
  return prisma.holiday.update({ where: { id }, data: updateData })
}

/**
 * Delete a holiday
 */
export async function deleteHoliday(id) {
  return prisma.holiday.delete({ where: { id } })
}

/**
 * Get unified calendar data for a month (leaves + holidays)
 */
export async function getCalendarData({ year, month }) {
  const startDate = new Date(`${year}-${String(month).padStart(2, '0')}-01`)
  const endDate = new Date(year, month, 0) // last day of month

  const [holidays, leaves] = await Promise.all([
    prisma.holiday.findMany({
      where: { date: { gte: startDate, lte: endDate } },
      orderBy: { date: 'asc' },
    }),
    prisma.leave.findMany({
      where: {
        status: 'APPROVED',
        OR: [
          { startDate: { gte: startDate, lte: endDate } },
          { endDate: { gte: startDate, lte: endDate } },
          { AND: [{ startDate: { lte: startDate } }, { endDate: { gte: endDate } }] },
        ],
      },
      include: {
        employee: { select: { id: true, name: true, image: true, department: { select: { name: true } } } },
      },
      orderBy: { startDate: 'asc' },
    }),
  ])

  return { holidays, leaves }
}
