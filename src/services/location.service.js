import prisma from '../config/prisma.js'

export async function getLocationLogs(sessionId) {
  return prisma.locationLog.findMany({
    where: { timerSessionId: sessionId },
    orderBy: { timestamp: 'asc' },
  })
}

export async function getEmployeeLocations(employeeId, date) {
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  return prisma.locationLog.findMany({
    where: {
      userId: employeeId,
      timestamp: { gte: startOfDay, lte: endOfDay },
    },
    orderBy: { timestamp: 'asc' },
  })
}

export async function createLocationLog(data) {
  return prisma.locationLog.create({ data })
}
