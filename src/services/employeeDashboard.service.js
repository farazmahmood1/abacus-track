import prisma from '../config/prisma.js'
import { startOfDay, endOfDay, startOfWeek, subDays } from 'date-fns'

/**
 * Get employee dashboard statistics
 */
export async function getEmployeeDashboardStats(userId) {
  const today = new Date()
  const startOfToday = startOfDay(today)
  const endOfToday = endOfDay(today)

  // Get today's timer session (check-in/check-out)
  const todaySession = await prisma.timerSession.findFirst({
    where: {
      userId,
      createdAt: {
        gte: startOfToday,
        lte: endOfToday,
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Get check-in time - send raw timestamp to frontend to format with user's timezone
  const checkInTime = todaySession?.startTime || null

  // Get check-out time - send raw timestamp to frontend to format with user's timezone
  const checkOutTime = todaySession?.endTime || null

  // Get leaves approved (count)
  const leavesApproved = await prisma.leave.count({
    where: {
      employeeId: userId,
      status: 'APPROVED',
    },
  })

  // Get leaves pending (count)
  const leavesPending = await prisma.leave.count({
    where: {
      employeeId: userId,
      status: 'PENDING',
    },
  })

  return {
    checkInTime,
    checkOutTime,
    leavesApproved,
    leavesPending,
    todaySession: {
      status: todaySession?.status || 'not_checked_in',
      startTime: todaySession?.startTime,
      endTime: todaySession?.endTime,
    },
  }
}

/**
 * Get weekly hours logged for employee
 */
export async function getWeeklyHours(userId) {
  const today = new Date()
  const weekStart = startOfWeek(today, { weekStartsOn: 1 }) // Monday

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const weeklyData = []

  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(weekStart)
    dayDate.setDate(dayDate.getDate() + i)

    const dayStart = startOfDay(dayDate)
    const dayEnd = endOfDay(dayDate)

    // Get all timer sessions for this day
    const sessions = await prisma.timerSession.findMany({
      where: {
        userId,
        createdAt: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
    })

    // Calculate total hours
    let totalSeconds = 0
    sessions.forEach(session => {
      if (session.totalDuration) {
        totalSeconds += session.totalDuration
      } else if (session.startTime && session.endTime) {
        const duration =
          new Date(session.endTime).getTime() - new Date(session.startTime).getTime()
        totalSeconds += Math.floor(duration / 1000)
      }
    })

    const hours = parseFloat((totalSeconds / 3600).toFixed(2))

    weeklyData.push({
      Days: days[i],
      hours: hours,
    })
  }

  return weeklyData
}
