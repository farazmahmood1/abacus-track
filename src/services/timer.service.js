import prisma from '../config/prisma.js'
import ApiError from '../utils/ApiError.js'
import {
  emitCheckIn,
  emitCheckOut,
  emitTimerPause,
  emitTimerResume,
  emitBreakStart,
  emitBreakEnd,
  emitAdminNotification,
} from './socketEvents.js'
import { recordOvertime } from './overtime.service.js'
import { recordCheckInDeviation, recordCheckOutDeviation } from './deviations.service.js'

/**
 * Check if user has an active timer session
 */
export const getActiveSession = async userId => {
  return await prisma.timerSession.findFirst({
    where: {
      userId,
      isActive: true,
    },
    include: {
      pauseLogs: {
        where: { resumedAt: null },
        orderBy: { pausedAt: 'desc' },
      },
      project: {
        select: {
          id: true,
          name: true,
          status: true,
        },
      },
    },
  })
}

/**
 * Get last session for today (even if inactive, for resume purposes)
 */
export const getLastSessionToday = async userId => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  return await prisma.timerSession.findFirst({
    where: {
      userId,
      createdAt: {
        gte: today,
        lt: tomorrow,
      },
    },
    orderBy: { createdAt: 'desc' },
    include: {
      pauseLogs: {
        where: { resumedAt: null },
        orderBy: { pausedAt: 'desc' },
      },
      project: {
        select: {
          id: true,
          name: true,
          status: true,
        },
      },
    },
  })
}

/**
 * Get today's work hours (from active session project hours)
 */
/**
 * Get today's work hours (from timesheet records)
 */
export const getTodayTimesheet = async userId => {
  const now = new Date()
  const localYear = now.getFullYear()
  const localMonth = now.getMonth()
  const localDate = now.getDate()

  // Construct UTC date that corresponds to the start of "today" in local terms
  // The Timesheet model stores workDate as UTC midnight
  const todayWorkDate = new Date(Date.UTC(localYear, localMonth, localDate, 0, 0, 0, 0))

  const timesheets = await prisma.timesheet.findMany({
    where: {
      userId,
      workDate: todayWorkDate
    }
  })

  const totalHours = timesheets.reduce((sum, ts) => sum + (ts.totalHours || 0), 0)

  return {
    totalHours: totalHours || 0
  }
}

/**
 * Create a new timer session (check-in)
 */
export const checkIn = async (userId, projectId = null) => {
  // Check if user already has an active session
  const existingSession = await getActiveSession(userId)
  if (existingSession) {
    throw new ApiError(400, 'User already has an active timer session')
  }

  // Validate project if provided
  if (projectId) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    })
    if (!project) {
      throw new ApiError(404, 'Project not found')
    }
  }

  // Get current UTC date
  const now = new Date()

  const session = await prisma.timerSession.create({
    data: {
      userId,
      projectId: projectId || null,
      startTime: now,
      status: 'checked_in',
      isActive: true,
    },
    include: {
      pauseLogs: true,
      project: {
        select: {
          id: true,
          name: true,
          status: true,
        },
      },
    },
  })

  // Create check-in notification for admins
  await prisma.checkInOutNotification.create({
    data: {
      userId,
      type: 'check_in',
      time: now,
    },
  })

  // Record late arrival deviation if applicable
  await recordCheckInDeviation(userId, session.id, now)

  // Emit real-time check-in event
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } })
  emitCheckIn(userId, user?.name || 'Unknown', session)
  emitAdminNotification({
    type: 'check-in',
    title: 'Employee Check-in',
    message: `${user?.name || 'An employee'} has checked in`,
    userId,
    timestamp: now.toISOString(),
  })

  return session
}

/**
 * Check out from current timer session
 */
export const checkOut = async userId => {
  const session = await getActiveSession(userId)
  if (!session) {
    throw new ApiError(400, 'No active timer session found')
  }

  // Resume if paused
  if (session.isPaused) {
    await resumeTimer(userId)
  }

  const endTime = new Date()

  // Calculate time from last switch (or session start if no previous switch)
  const timeStartPoint = session.lastProjectSwitchTime || session.startTime
  const totalSeconds = Math.floor((endTime - timeStartPoint) / 1000)

  // Get all completed pause durations (only pauses that have been resumed)
  const pauseLogs = await prisma.pauseLog.findMany({
    where: {
      timerSessionId: session.id,
      duration: { not: null },
    },
  })

  let totalPauseSeconds = 0
  pauseLogs.forEach(log => {
    if (log.duration) {
      totalPauseSeconds += log.duration
    }
  })

  // Calculate actual work time (only for current project segment)
  const actualWorkSeconds = Math.max(0, totalSeconds - totalPauseSeconds)
  const workHours = actualWorkSeconds / 3600

  // Update session
  const updatedSession = await prisma.timerSession.update({
    where: { id: session.id },
    data: {
      endTime,
      totalDuration: actualWorkSeconds,
      isActive: false,
      status: 'checked_out',
    },
    include: {
      pauseLogs: true,
    },
  })

  // Increment project hours if project is assigned (only for the final segment)
  if (workHours > 0 && session.projectId) {
    await prisma.project.update({
      where: { id: session.projectId },
      data: {
        totalHoursWorked: {
          increment: workHours,
        },
      },
    })
  }

  // Also create timesheet entry for historical records and attendance tracking
  // For timesheet, we need TOTAL time from original check-in (not just last segment)
  const totalSessionSeconds = Math.floor((endTime - session.startTime) / 1000)
  const totalSessionWorkHours =
    Math.max(0, totalSessionSeconds - totalPauseSeconds) / 3600

  if (totalSessionWorkHours > 0 && session.projectId) {
    const checkInTime = session.startTime
    const workDate = new Date(checkInTime)
    const localYear = workDate.getFullYear()
    const localMonth = workDate.getMonth()
    const localDate = workDate.getDate()
    const utcWorkDate = new Date(Date.UTC(localYear, localMonth, localDate, 0, 0, 0, 0))

    // Upsert timesheet - accumulate if exists, create if not
    const existingTimesheet = await prisma.timesheet.findUnique({
      where: {
        userId_workDate: {
          userId,
          workDate: utcWorkDate,
        },
      },
    })

    await prisma.timesheet.upsert({
      where: {
        userId_workDate: {
          userId,
          workDate: utcWorkDate,
        },
      },
      update: {
        checkOutTime: endTime,
        totalHours: (existingTimesheet?.totalHours || 0) + totalSessionWorkHours,
        totalPauseTime: (existingTimesheet?.totalPauseTime || 0) + totalPauseSeconds,
      },
      create: {
        userId,
        projectId: session.projectId,
        workDate: utcWorkDate,
        checkInTime: session.startTime,
        checkOutTime: endTime,
        totalHours: totalSessionWorkHours,
        totalPauseTime: totalPauseSeconds,
      },
    })
  }

  // Record early departure deviation if applicable
  await recordCheckOutDeviation(userId, session.id, endTime)

  // Record overtime data
  await recordOvertime(userId, endTime, totalSessionWorkHours || workHours)

  // Create check-out notification for admins
  await prisma.checkInOutNotification.create({
    data: {
      userId,
      type: 'check_out',
      time: endTime,
    },
  })

  // Emit real-time check-out event
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } })
  emitCheckOut(userId, user?.name || 'Unknown', updatedSession)
  emitAdminNotification({
    type: 'check-out',
    title: 'Employee Check-out',
    message: `${user?.name || 'An employee'} has checked out`,
    userId,
    timestamp: endTime.toISOString(),
  })

  return updatedSession
}

/**
 * Pause the current timer session
 */
export const pauseTimer = async userId => {
  const session = await getActiveSession(userId)
  if (!session) {
    throw new ApiError(400, 'No active timer session found')
  }

  if (session.isPaused) {
    throw new ApiError(400, 'Timer is already paused')
  }

  const pausedAt = new Date()

  const updatedSession = await prisma.timerSession.update({
    where: { id: session.id },
    data: {
      isPaused: true,
      pausedAt,
      status: 'paused',
    },
  })

  // Create pause log entry
  await prisma.pauseLog.create({
    data: {
      timerSessionId: session.id,
      pausedAt,
    },
  })

  // Emit real-time pause event
  const pauseUser = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } })
  emitTimerPause(userId, pauseUser?.name || 'Unknown')

  return updatedSession
}

/**
 * Resume the current timer session
 */
export const resumeTimer = async userId => {
  const session = await getActiveSession(userId)
  if (!session) {
    throw new ApiError(400, 'No active timer session found')
  }

  if (!session.isPaused) {
    throw new ApiError(400, 'Timer is not paused')
  }

  const resumedAt = new Date()

  // Get the latest pause log that doesn't have a resume time
  const pauseLog = await prisma.pauseLog.findFirst({
    where: {
      timerSessionId: session.id,
      resumedAt: null,
    },
    orderBy: { pausedAt: 'desc' },
  })

  if (pauseLog) {
    const pauseDuration = Math.floor((resumedAt - pauseLog.pausedAt) / 1000)
    await prisma.pauseLog.update({
      where: { id: pauseLog.id },
      data: {
        resumedAt,
        duration: pauseDuration,
      },
    })
  }

  const updatedSession = await prisma.timerSession.update({
    where: { id: session.id },
    data: {
      isPaused: false,
      pausedAt: null,
      status: 'checked_in',
    },
    include: {
      pauseLogs: true,
    },
  })

  // Emit real-time resume event
  const resumeUser = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } })
  emitTimerResume(userId, resumeUser?.name || 'Unknown')

  return updatedSession
}

/**
 * Get session details with all logs
 */
export const getSessionDetails = async sessionId => {
  const session = await prisma.timerSession.findUnique({
    where: { id: sessionId },
    include: {
      activityLogs: true,
      pauseLogs: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      project: {
        select: {
          id: true,
          name: true,
          status: true,
          department: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  })

  if (!session) {
    throw new ApiError(404, 'Timer session not found')
  }

  return session
}

/**
 * Get user's timer sessions with pagination
 */
export const getUserSessions = async (
  userId,
  limit = 10,
  offset = 0,
  projectId = null
) => {
  const where = { userId }
  if (projectId) {
    where.projectId = projectId
  }

  const [sessions, total] = await Promise.all([
    prisma.timerSession.findMany({
      where,
      include: {
        pauseLogs: true,
        project: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.timerSession.count({ where }),
  ])

  return {
    data: sessions,
    total,
    limit,
    offset,
  }
}

/**
 * Get user's timesheets with pagination
 */
export const getUserTimesheets = async (userId, limit = 30, offset = 0) => {
  const [timesheets, total] = await Promise.all([
    prisma.timesheet.findMany({
      where: { userId },
      orderBy: { workDate: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.timesheet.count({ where: { userId } }),
  ])

  return {
    data: timesheets,
    total,
    limit,
    offset,
  }
}

/**
 * Create or update timesheet for a work day
 */
export const createOrUpdateTimesheet = async (userId, sessionId, timerSession) => {
  // Use check-in date as work date (ignore time, set to 00:00:00)
  // Use local date components to match the user's local timezone
  const checkInTime = new Date(timerSession.startTime)
  const localYear = checkInTime.getFullYear()
  const localMonth = checkInTime.getMonth()
  const localDate = checkInTime.getDate()

  // Create workDate in local timezone - store as UTC midnight to match user's local date
  const workDate = new Date(localYear, localMonth, localDate, 0, 0, 0, 0)
  // Convert to UTC midnight to store consistently in database
  const utcWorkDate = new Date(Date.UTC(localYear, localMonth, localDate, 0, 0, 0, 0))

  // Calculate durations for this session
  let totalPauseSeconds = 0

  const pauseLogs = await prisma.pauseLog.findMany({
    where: { timerSessionId: sessionId },
  })

  pauseLogs.forEach(log => {
    if (log.duration) totalPauseSeconds += log.duration
  })

  const totalSeconds = timerSession.totalDuration || 0
  const totalHours = totalSeconds / 3600

  // Check if timesheet exists for this user and date
  const existingTimesheet = await prisma.timesheet.findUnique({
    where: {
      userId_workDate: {
        userId,
        workDate: utcWorkDate,
      },
    },
  })

  // If exists, accumulate hours; if not, create new
  const timesheet = await prisma.timesheet.upsert({
    where: {
      userId_workDate: {
        userId,
        workDate: utcWorkDate,
      },
    },
    update: {
      checkOutTime: timerSession.endTime,
      // Accumulate hours from existing timesheet
      totalHours: (existingTimesheet?.totalHours || 0) + totalHours,
      totalPauseTime: (existingTimesheet?.totalPauseTime || 0) + totalPauseSeconds,
    },
    create: {
      userId,
      projectId: timerSession.projectId,
      workDate: utcWorkDate,
      checkInTime: timerSession.startTime,
      checkOutTime: timerSession.endTime,
      totalHours,
      totalPauseTime: totalPauseSeconds,
    },
  })

  return timesheet
}

/**
 * Get timesheet for a specific date range
 */
export const getTimesheetRange = async (userId, startDate, endDate) => {
  const timesheets = await prisma.timesheet.findMany({
    where: {
      userId,
      workDate: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    },
    orderBy: { workDate: 'asc' },
  })

  // Calculate statistics
  const stats = {
    totalDays: timesheets.length,
    totalHours: timesheets.reduce((sum, ts) => sum + (ts.totalHours || 0), 0),
    totalPauseTime: timesheets.reduce((sum, ts) => sum + (ts.totalPauseTime || 0), 0),
    averageHoursPerDay:
      timesheets.length > 0
        ? timesheets.reduce((sum, ts) => sum + (ts.totalHours || 0), 0) /
        timesheets.length
        : 0,
  }

  return {
    timesheets,
    stats,
  }
}

/**
 * Get elapsed time for active session (including pause calculations)
 */
export const getElapsedTime = async userId => {
  const activeSession = await getActiveSession(userId)

  if (!activeSession) {
    return null
  }

  const now = new Date()
  const elapsed = Math.floor((now - activeSession.startTime) / 1000)

  // Get all pauses (completed and current)
  const pauseLogs = await prisma.pauseLog.findMany({
    where: { timerSessionId: activeSession.id },
  })

  let totalPauseSeconds = 0
  pauseLogs.forEach(log => {
    if (log.resumedAt) {
      // Completed pause
      const pauseDuration = Math.floor((log.resumedAt - log.pausedAt) / 1000)
      totalPauseSeconds += pauseDuration
    } else {
      // Currently paused
      const pauseDuration = Math.floor((now - log.pausedAt) / 1000)
      totalPauseSeconds += pauseDuration
    }
  })

  const actualWorked = Math.max(0, elapsed - totalPauseSeconds)

  return {
    sessionId: activeSession.id,
    elapsedSeconds: actualWorked,
    totalElapsedSeconds: elapsed,
    totalPauseSeconds,
    isPaused: activeSession.isPaused,
    startTime: activeSession.startTime,
    pausedAt: activeSession.pausedAt,
    pauseCount: pauseLogs.length,
  }
}

/**
 * Get project time summary - total hours logged for a project by user
 */
export const getProjectTimeByUser = async (projectId, userId) => {
  const [timerSessions, timesheets] = await Promise.all([
    prisma.timerSession.findMany({
      where: {
        projectId,
        userId,
        isActive: false,
      },
      select: {
        totalDuration: true,
        startTime: true,
        endTime: true,
      },
    }),
    prisma.timesheet.findMany({
      where: {
        projectId,
        userId,
      },
      select: {
        totalHours: true,
        workDate: true,
      },
    }),
  ])

  // Calculate total time
  const timerHours = timerSessions.reduce((sum, session) => {
    return sum + (session.totalDuration ? session.totalDuration / 3600 : 0)
  }, 0)

  const timesheetHours = timesheets.reduce((sum, ts) => {
    return sum + (ts.totalHours || 0)
  }, 0)

  return {
    projectId,
    userId,
    timerHours: parseFloat(timerHours.toFixed(2)),
    timesheetHours: parseFloat(timesheetHours.toFixed(2)),
    totalHours: parseFloat((timerHours + timesheetHours).toFixed(2)),
    sessionsCount: timerSessions.length,
    timesheetDaysCount: timesheets.length,
  }
}

/**
 * Start break for current timer session
 */
export const startBreak = async userId => {
  const session = await getActiveSession(userId)
  if (!session) {
    throw new ApiError(400, 'No active timer session')
  }

  // Create pause log for break
  const breakLog = await prisma.pauseLog.create({
    data: {
      timerSessionId: session.id,
      pausedAt: new Date(),
    },
  })

  // Emit real-time break start event
  const breakStartUser = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } })
  emitBreakStart(userId, breakStartUser?.name || 'Unknown')

  return {
    ...session,
    currentBreak: breakLog,
  }
}

/**
 * End break for current timer session
 */
export const endBreak = async userId => {
  const session = await getActiveSession(userId)
  if (!session) {
    throw new ApiError(400, 'No active timer session')
  }

  // Find the latest pause log (break) that hasn't been resumed
  const activeBreak = await prisma.pauseLog.findFirst({
    where: {
      timerSessionId: session.id,
      resumedAt: null,
    },
    orderBy: { pausedAt: 'desc' },
  })

  if (!activeBreak) {
    throw new ApiError(400, 'No active break found')
  }

  // Calculate break duration
  const now = new Date()
  const breakDuration = Math.floor((now - activeBreak.pausedAt) / 1000)

  // Resume the break
  const resumedBreak = await prisma.pauseLog.update({
    where: { id: activeBreak.id },
    data: {
      resumedAt: now,
      duration: breakDuration,
    },
  })

  // Emit real-time break end event
  const breakEndUser = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } })
  emitBreakEnd(userId, breakEndUser?.name || 'Unknown')

  return {
    ...session,
    resumedBreak,
  }
}

/**
 * Check if user is currently on break
 */
export const getBreakStatus = async userId => {
  const session = await getActiveSession(userId)
  if (!session) {
    return null
  }

  // Check if there's an active break (pause log without resumedAt)
  const activeBreak = await prisma.pauseLog.findFirst({
    where: {
      timerSessionId: session.id,
      resumedAt: null,
    },
    orderBy: { pausedAt: 'desc' },
  })

  return {
    isOnBreak: !!activeBreak,
    breakStartTime: activeBreak?.pausedAt || null,
  }
}

/**
 * Update project for active timer session and log the switch
 */
export const updateProjectInSession = async (userId, projectId) => {
  // Get active session
  const session = await getActiveSession(userId)
  if (!session) {
    throw new ApiError(400, 'No active timer session found')
  }

  // Validate project if provided
  if (projectId) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    })
    if (!project) {
      throw new ApiError(404, 'Project not found')
    }
  }

  // If project is changing, log hours for the previous project
  if (session.projectId && session.projectId !== projectId) {
    const currentTime = new Date()

    // Calculate time from last switch (or session start if no previous switch)
    const timeStartPoint = session.lastProjectSwitchTime || session.startTime
    const timeWorkedSeconds = Math.floor((currentTime - timeStartPoint) / 1000)

    // Get pause durations since last switch (only completed pauses with duration)
    const pauseLogs = await prisma.pauseLog.findMany({
      where: {
        timerSessionId: session.id,
        duration: { not: null },
      },
    })

    let totalPauseSeconds = 0
    pauseLogs.forEach(log => {
      if (log.duration) totalPauseSeconds += log.duration
    })

    const actualWorkSeconds = Math.max(0, timeWorkedSeconds - totalPauseSeconds)
    const workHours = actualWorkSeconds / 3600

    // Increment hours in previous project
    if (workHours > 0) {
      await prisma.project.update({
        where: { id: session.projectId },
        data: {
          totalHoursWorked: {
            increment: workHours,
          },
        },
      })
    }

    // Track the project switch time but DON'T reset startTime
    // This keeps the original session start time intact
    await prisma.timerSession.update({
      where: { id: session.id },
      data: {
        lastProjectSwitchTime: currentTime,
      },
    })

    // Clear pause logs for fresh tracking on new project
    await prisma.pauseLog.deleteMany({
      where: { timerSessionId: session.id },
    })
  }

  // Update session with new project
  const updatedSession = await prisma.timerSession.update({
    where: { id: session.id },
    data: {
      projectId: projectId || null,
    },
    include: {
      project: {
        select: {
          id: true,
          name: true,
          status: true,
          totalHoursWorked: true,
        },
      },
    },
  })

  console.log('✨ Session updated successfully: ' + projectId)
  return updatedSession
}

/**
 * Delete a timer session (admin only)
 */
export const deleteTimerSession = async sessionId => {
  const session = await prisma.timerSession.delete({
    where: { id: sessionId },
  })

  return session
}

/**
 * Get sessions for a specific employee on a specific date
 */
export const getSessionsByEmployeeAndDate = async (employeeId, dateStr) => {
  const date = new Date(dateStr)
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)

  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  const sessions = await prisma.timerSession.findMany({
    where: {
      userId: employeeId,
      startTime: {
        gte: startOfDay,
        lte: endOfDay
      }
    },
    include: {
      activityLogs: {
        orderBy: {
          timestamp: 'asc'
        }
      },
      pauseLogs: true,
      project: {
        select: {
          id: true,
          name: true
        }
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    },
    orderBy: {
      startTime: 'asc'
    }
  })

  // Transform sessions to include aggregated statistics
  const transformedSessions = sessions.map(session => {
    // Calculate active and idle time from activity logs
    let activeTime = 0
    let idleTime = 0
    let totalKeyboard = 0
    let totalClicks = 0
    let totalMouseDistance = 0

    const ACTIVITY_LOG_DURATION_SECONDS = 600 // Each log represents 10 minutes

    session.activityLogs.forEach(log => {
      if (log.isIdle) {
        idleTime += ACTIVITY_LOG_DURATION_SECONDS
      } else {
        activeTime += ACTIVITY_LOG_DURATION_SECONDS
      }
      totalKeyboard += log.keyboardCount
      totalClicks += log.clickCount
      totalMouseDistance += log.mouseDistance
    })

    // Calculate idle percentage
    const totalTime = activeTime + idleTime
    const idlePercentage = totalTime > 0 ? (idleTime / totalTime) * 100 : 0

    return {
      id: session.id,
      employeeId: session.userId,
      employeeName: session.user.name,
      startTime: session.startTime.toISOString(),
      endTime: session.endTime ? session.endTime.toISOString() : null,
      duration: session.totalDuration || 0,
      activityLogs: session.activityLogs,
      totalKeyboard,
      totalClicks,
      totalMouseDistance,
      idlePercentage: Math.round(idlePercentage),
      activeTime,
      idleTime
    }
  })

  return transformedSessions
}
