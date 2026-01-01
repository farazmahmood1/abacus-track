import prisma from '../config/prisma.js'
import { subDays, startOfDay, endOfDay } from 'date-fns'

/**
 * Get attendance records for a specific date range
 */
export const getAttendanceRecords = async (userId, filters = {}) => {
  const {
    date = new Date(),
    department = 'All',
    search = '',
    page = 1,
    pageSize = 10,
    showActiveOnly = false,
  } = filters

  const targetDate = new Date(date)
  const startDate = startOfDay(targetDate)
  const endDate = endOfDay(targetDate)

  // Build where clause
  const where = {
    AND: [
      {
        OR: [
          {
            // Users with timesheet records for the date
            timesheets: {
              some: {
                workDate: {
                  gte: startDate,
                  lte: endDate,
                },
              },
            },
          },
          {
            // Users with timer sessions for the date
            timerSessions: {
              some: {
                startTime: {
                  gte: startDate,
                  lte: endDate,
                },
              },
            },
          },
        ],
      },
    ],
  }

  // Department filter
  if (department && department !== 'All') {
    where.department = department
  }

  // Search filter
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { id: { contains: search, mode: 'insensitive' } },
    ]
  }

  // Get all users first (for showing absent users) - exclude admin role
  const allUsersWhere = {
    role: { not: 'admin' },
  }
  if (department && department !== 'All') {
    allUsersWhere.department = department
  }
  if (search) {
    allUsersWhere.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { id: { contains: search, mode: 'insensitive' } },
    ]
  }

  const allUsers = await prisma.user.findMany({
    where: allUsersWhere,
    select: {
      id: true,
      uniqueId: true,
      name: true,
      email: true,
      department: {
        select: {
          name: true,
        },
      },
      timerSessions: {
        where: {
          startTime: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { startTime: 'desc' },
        include: {
          pauseLogs: true,
        },
      },
      timesheets: {
        where: {
          workDate: {
            gte: startDate,
            lte: endDate,
          },
        },
      },
    },
  })

  // Process attendance records
  const attendanceRecords = allUsers.map(user => {
    // Filter timesheets to only those with workDate matching the selected local date
    const timesheetsForDate = user.timesheets.filter(sheet => {
      const sheetYear = sheet.workDate.getFullYear()
      const sheetMonth = sheet.workDate.getMonth()
      const sheetDay = sheet.workDate.getDate()

      const targetYear = targetDate.getFullYear()
      const targetMonth = targetDate.getMonth()
      const targetDay = targetDate.getDate()

      return (
        sheetYear === targetYear && sheetMonth === targetMonth && sheetDay === targetDay
      )
    })
    const timesheet = timesheetsForDate[0]

    // Filter timerSessions to only those that started on the selected local date
    const timerSessionsForDate = user.timerSessions.filter(session => {
      const sessionLocalDate = new Date(session.startTime)
      const sessionLocalYear = sessionLocalDate.getFullYear()
      const sessionLocalMonth = sessionLocalDate.getMonth()
      const sessionLocalDate_day = sessionLocalDate.getDate()

      const targetYear = targetDate.getFullYear()
      const targetMonth = targetDate.getMonth()
      const targetDay = targetDate.getDate()

      return (
        sessionLocalYear === targetYear &&
        sessionLocalMonth === targetMonth &&
        sessionLocalDate_day === targetDay
      )
    })
    const timerSession = timerSessionsForDate[0]

    let status = 'Absent'
    let checkIn = null
    let checkOut = null
    let workHours = 0
    let isOnBreak = false

    // Check if the selected date is today
    const isToday = startOfDay(new Date()).getTime() === startOfDay(targetDate).getTime()

    // Check if user has an active break
    if (
      isToday &&
      timerSession &&
      timerSession.pauseLogs &&
      timerSession.pauseLogs.length > 0
    ) {
      const activeBreak = timerSession.pauseLogs.find(log => log.resumedAt === null)
      if (activeBreak) {
        isOnBreak = true
      }
    }

    // Determine status: prioritize active timer session for real-time status
    if (isToday && timerSession && timerSession.isActive && !timerSession.isPaused) {
      // Check if on break first
      if (isOnBreak) {
        status = 'Break'
      } else {
        // User is currently online
        status = 'Online'
      }
      checkIn = timerSession.startTime
      checkOut = timerSession.endTime || null // endTime may be null if session is active
    } else if (timesheet || timerSession) {
      // User has records but not currently online
      status = 'Offline'

      // Use timesheet data if available (aggregated hours)
      if (timesheet) {
        checkIn = timesheet.checkInTime
        checkOut = timesheet.checkOutTime
        workHours = timesheet.totalHours || 0
      } else if (timerSession) {
        // Fall back to individual timer session if no timesheet
        checkIn = timerSession.startTime
        checkOut = timerSession.endTime
        workHours = timerSession.totalDuration ? timerSession.totalDuration / 3600 : 0
      }
    }

    // For Online status, recalculate elapsed time
    if (status === 'Online' && checkIn) {
      // Currently online, calculate elapsed time
      const elapsed = (new Date() - new Date(checkIn)) / 1000
      // Subtract pause time
      let totalPauseSeconds = 0
      if (timerSession?.pauseLogs) {
        timerSession.pauseLogs.forEach(log => {
          if (log.resumedAt) {
            totalPauseSeconds += log.duration || 0
          } else {
            // Currently paused
            totalPauseSeconds += Math.floor((new Date() - new Date(log.pausedAt)) / 1000)
          }
        })
      }
      // Add current session elapsed time to any existing timesheet hours
      const currentSessionHours = (elapsed - totalPauseSeconds) / 3600
      workHours = (timesheet?.totalHours || 0) + currentSessionHours
    }

    return {
      id: user.id,
      uniqueId: user.uniqueId,
      employeeName: user.name,
      department: user.department?.name || null,
      date: targetDate,
      status,
      checkInTime: checkIn,
      checkOutTime: checkOut,
      workHours: Math.max(0, workHours).toFixed(4),
    }
  })

  // Filter active only if requested
  let filteredRecords = attendanceRecords
  if (showActiveOnly) {
    filteredRecords = attendanceRecords.filter(record => record.status === 'Online')
  }

  // Sort by status (Online first, then Offline, then Absent)
  filteredRecords.sort((a, b) => {
    const statusOrder = { Online: 0, Offline: 1, Absent: 2 }
    return statusOrder[a.status] - statusOrder[b.status]
  })

  // Pagination
  const total = filteredRecords.length
  const startIndex = (page - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedRecords = filteredRecords.slice(startIndex, endIndex)

  return {
    data: paginatedRecords,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

/**
 * Get attendance summary stats
 */
export const getAttendanceSummary = async (date = new Date()) => {
  const targetDate = new Date(date)
  const startDate = startOfDay(targetDate)
  const endDate = endOfDay(targetDate)

  // Check if the selected date is today
  const isToday = startOfDay(new Date()).getTime() === startOfDay(targetDate).getTime()

  // Get all users - exclude admin role
  const totalEmployees = await prisma.user.count({
    where: {
      role: { not: 'admin' },
    },
  })

  // Get users with active timer sessions (only count as online if it's today)
  let onlineUsers = 0
  if (isToday) {
    onlineUsers = await prisma.timerSession.count({
      where: {
        startTime: {
          gte: startDate,
          lte: endDate,
        },
        isActive: true,
      },
    })
  }

  // Get users with records (timer sessions or timesheets) - exclude admin role
  const usersWithRecords = await prisma.user.count({
    where: {
      role: { not: 'admin' },
      OR: [
        {
          timerSessions: {
            some: {
              startTime: {
                gte: startDate,
                lte: endDate,
              },
            },
          },
        },
        {
          timesheets: {
            some: {
              workDate: {
                gte: startDate,
                lte: endDate,
              },
            },
          },
        },
      ],
    },
  })

  const offlineUsers = usersWithRecords - onlineUsers
  const absentUsers = totalEmployees - usersWithRecords

  return {
    total: totalEmployees,
    online: onlineUsers,
    offline: offlineUsers,
    absent: absentUsers,
  }
}

/**
 * Export attendance data to CSV format
 */
export const exportAttendanceData = async (filters = {}) => {
  const { data } = await getAttendanceRecords(null, {
    ...filters,
    page: 1,
    pageSize: 1000,
  })

  return data
}

/**
 * Create a check-in notification
 */
export const createCheckInNotification = async userId => {
  try {
    const notification = await prisma.checkInOutNotification.create({
      data: {
        userId,
        type: 'check_in',
        time: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return {
      success: true,
      data: notification,
    }
  } catch (error) {
    console.error('Error creating check-in notification:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Create a check-out notification
 */
export const createCheckOutNotification = async userId => {
  try {
    const notification = await prisma.checkInOutNotification.create({
      data: {
        userId,
        type: 'check_out',
        time: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return {
      success: true,
      data: notification,
    }
  } catch (error) {
    console.error('Error creating check-out notification:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Get unread check-in/check-out notifications for admins
 */
export const getUnreadCheckInOutNotifications = async (page = 1, pageSize = 10) => {
  try {
    const skip = (page - 1) * pageSize

    const [notifications, total] = await Promise.all([
      prisma.checkInOutNotification.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          time: 'desc',
        },
        skip,
        take: pageSize,
      }),
      prisma.checkInOutNotification.count({
        where: {
          isRead: false,
        },
      }),
    ])

    return {
      success: true,
      data: notifications,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    }
  } catch (error) {
    console.error('Error fetching unread check-in/check-out notifications:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Get all check-in/check-out notifications for a specific date
 */
export const getTodayCheckInOutNotifications = async (page = 1, pageSize = 10) => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const skip = (page - 1) * pageSize

    const [notifications, total] = await Promise.all([
      prisma.checkInOutNotification.findMany({
        where: {
          time: {
            gte: today,
            lt: tomorrow,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          time: 'desc',
        },
        skip,
        take: pageSize,
      }),
      prisma.checkInOutNotification.count({
        where: {
          time: {
            gte: today,
            lt: tomorrow,
          },
        },
      }),
    ])

    return {
      success: true,
      data: notifications,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    }
  } catch (error) {
    console.error('Error fetching today check-in/check-out notifications:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Mark a check-in/check-out notification as read
 */
export const markCheckInOutNotificationAsRead = async notificationId => {
  try {
    const notification = await prisma.checkInOutNotification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return {
      success: true,
      data: notification,
    }
  } catch (error) {
    console.error('Error marking notification as read:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Mark all check-in/check-out notifications as read
 */
export const markAllCheckInOutNotificationsAsRead = async () => {
  try {
    const result = await prisma.checkInOutNotification.updateMany({
      where: {
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    })

    return {
      success: true,
      data: {
        updatedCount: result.count,
      },
    }
  } catch (error) {
    console.error('Error marking all notifications as read:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Delete a check-in/check-out notification
 */
export const deleteCheckInOutNotification = async notificationId => {
  try {
    const notification = await prisma.checkInOutNotification.delete({
      where: { id: notificationId },
    })

    return {
      success: true,
      data: notification,
    }
  } catch (error) {
    console.error('Error deleting notification:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}
