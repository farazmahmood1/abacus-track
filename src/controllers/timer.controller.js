import * as timerService from '../services/timer.service.js'
import ApiError from '../utils/ApiError.js'
import catchAsync from '../utils/catchAsync.js'

/**
 * Get current active session for authenticated user
 */
export const getActiveSession = catchAsync(async (req, res) => {
  if (!req.user?.id) {
    throw new ApiError(401, 'Unauthorized')
  }

  const activeSession = await timerService.getActiveSession(req.user.id)

  // Include calculated elapsed time
  let elapsedData = null
  let timesheetData = null

  if (activeSession) {
    elapsedData = await timerService.getElapsedTime(req.user.id)
  }

  // Always fetch today's timesheet to show accumulated hours
  timesheetData = await timerService.getTodayTimesheet(req.user.id)

  res.json({
    timer: activeSession,
    elapsed: elapsedData,
    timesheet: timesheetData,
    message: activeSession ? 'Active session found' : 'No active session',
  })
})

/**
 * Get last session for today (for resume or context)
 */
export const getLastSessionToday = catchAsync(async (req, res) => {
  if (!req.user?.id) {
    throw new ApiError(401, 'Unauthorized')
  }

  const lastSession = await timerService.getLastSessionToday(req.user.id)

  res.json({
    timer: lastSession,
    message: lastSession ? 'Last session found' : 'No session today',
  })
})

/**
 * Check in (start timer)
 */
export const checkIn = catchAsync(async (req, res) => {
  if (!req.user?.id) {
    throw new ApiError(401, 'Unauthorized')
  }

  const { projectId, latitude, longitude, address } = req.body || {}

  const timerSession = await timerService.checkIn(req.user.id, projectId || null, {
    latitude,
    longitude,
    address,
  })

  res.status(201).json({
    timer: timerSession,
    message: 'Checked in successfully',
  })
})

/**
 * Check out (end timer)
 */
export const checkOut = catchAsync(async (req, res) => {
  if (!req.user?.id) {
    throw new ApiError(401, 'Unauthorized')
  }

  const { latitude, longitude, address } = req.body || {}

  const timerSession = await timerService.checkOut(req.user.id, {
    latitude,
    longitude,
    address,
  })

  res.json({
    timer: timerSession,
    message: 'Checked out successfully',
  })
})

/**
 * Pause timer
 */
export const pauseTimer = catchAsync(async (req, res) => {
  if (!req.user?.id) {
    throw new ApiError(401, 'Unauthorized')
  }

  const timerSession = await timerService.pauseTimer(req.user.id)

  res.json({
    timer: timerSession,
    message: 'Timer paused',
  })
})

/**
 * Resume timer
 */
export const resumeTimer = catchAsync(async (req, res) => {
  if (!req.user?.id) {
    throw new ApiError(401, 'Unauthorized')
  }

  const timerSession = await timerService.resumeTimer(req.user.id)

  res.json({
    timer: timerSession,
    message: 'Timer resumed',
  })
})

/**
 * Get session details
 */
export const getSessionDetails = catchAsync(async (req, res) => {
  const { sessionId } = req.params
  const session = await timerService.getSessionDetails(sessionId)

  res.json({
    data: session,
  })
})

/**
 * Get user's timer sessions (paginated)
 */
export const getUserSessions = catchAsync(async (req, res) => {
  if (!req.userId) {
    throw new ApiError(401, 'Unauthorized')
  }

  const limit = Math.min(parseInt(req.query.limit) || 10, 100)
  const offset = parseInt(req.query.offset) || 0
  const projectId = req.query.projectId || null

  const result = await timerService.getUserSessions(req.userId, limit, offset, projectId)

  res.json({
    data: result.data,
    total: result.total,
    limit: result.limit,
    offset: result.offset,
  })
})

/**
 * Get user's timesheets (paginated)
 */
export const getUserTimesheets = catchAsync(async (req, res) => {
  if (!req.userId) {
    throw new ApiError(401, 'Unauthorized')
  }

  const limit = Math.min(parseInt(req.query.limit) || 30, 100)
  const offset = parseInt(req.query.offset) || 0

  const result = await timerService.getUserTimesheets(req.userId, limit, offset)

  res.json({
    data: result.data,
    total: result.total,
    limit: result.limit,
    offset: result.offset,
  })
})

/**
 * Get elapsed time for active session
 */
export const getElapsedTime = catchAsync(async (req, res) => {
  if (!req.userId) {
    throw new ApiError(401, 'Unauthorized')
  }

  const elapsedData = await timerService.getElapsedTime(req.userId)

  res.json({
    data: elapsedData,
    message: elapsedData ? 'Active session found' : 'No active session',
  })
})

/**
 * Get timesheet range with statistics
 */
export const getTimesheetRange = catchAsync(async (req, res) => {
  const authSession = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  })

  if (!authSession?.user) {
    throw new ApiError(401, 'Unauthorized')
  }

  const { startDate, endDate } = req.query

  if (!startDate || !endDate) {
    throw new ApiError(400, 'startDate and endDate are required')
  }

  const result = await timerService.getTimesheetRange(
    authSession.user.id,
    startDate,
    endDate
  )

  res.json({
    data: result.timesheets,
    stats: result.stats,
  })
})

/**
 * Get project time summary for user
 */
export const getProjectTime = catchAsync(async (req, res) => {
  if (!req.user?.id) {
    throw new ApiError(401, 'Unauthorized')
  }

  const { projectId } = req.params

  if (!projectId) {
    throw new ApiError(400, 'Project ID is required')
  }

  const timeData = await timerService.getProjectTimeByUser(projectId, req.user.id)

  res.json({
    data: timeData,
    message: 'Project time retrieved successfully',
  })
})

export const startBreak = catchAsync(async (req, res) => {
  const session = await timerService.startBreak(req.user.id)

  res.json({
    data: session,
    message: 'Break started successfully',
  })
})

export const endBreak = catchAsync(async (req, res) => {
  const session = await timerService.endBreak(req.user.id)

  res.json({
    data: session,
    message: 'Break ended successfully',
  })
})

export const getBreakStatus = catchAsync(async (req, res) => {
  const breakStatus = await timerService.getBreakStatus(req.user.id)

  res.json({
    data: breakStatus,
    message: 'Break status retrieved successfully',
  })
})

/**
 * Update project for active timer session
 */
export const updateProjectInSession = catchAsync(async (req, res) => {
  if (!req.user?.id) {
    throw new ApiError(401, 'Unauthorized')
  }

  const { projectId } = req.body

  if (!projectId) {
    throw new ApiError(400, 'Project ID is required')
  }

  const updatedSession = await timerService.updateProjectInSession(req.user.id, projectId)

  res.json({
    timer: updatedSession,
    message: 'Project updated successfully',
  })
})

/**
 * Get sessions for a specific employee on a specific date (Admin only)
 */
export const getEmployeeSessions = catchAsync(async (req, res) => {
  const { employeeId } = req.params
  const { date } = req.query

  if (!employeeId) {
    throw new ApiError(400, 'Employee ID is required')
  }

  if (!date) {
    throw new ApiError(400, 'Date is required')
  }

  const sessions = await timerService.getSessionsByEmployeeAndDate(employeeId, date)

  res.json({
    data: sessions,
    message: 'Employee sessions retrieved successfully',
  })
})
