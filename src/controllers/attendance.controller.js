import * as attendanceService from '../services/attendance.service.js'
import catchAsync from '../utils/catchAsync.js'
import ApiError from '../utils/ApiError.js'

/**
 * Get attendance records
 */
export const getAttendanceRecords = catchAsync(async (req, res) => {
  if (!req.user?.id) {
    throw new ApiError(401, 'Unauthorized')
  }

  const { date, department, search, page, pageSize, showActiveOnly } = req.query

  // Parse date string (YYYY-MM-DD) or use today
  let parsedDate = new Date()
  if (date) {
    // Create date in local timezone from YYYY-MM-DD string
    const [year, month, day] = date.split('-').map(Number)
    parsedDate = new Date(year, month - 1, day)
  }

  const result = await attendanceService.getAttendanceRecords(req.user.id, {
    date: parsedDate,
    department,
    search,
    page: parseInt(page) || 1,
    pageSize: parseInt(pageSize) || 10,
    showActiveOnly: showActiveOnly === 'true',
    companyId: req.user.companyId,
  })

  res.json(result)
})

/**
 * Get attendance summary
 */
export const getAttendanceSummary = catchAsync(async (req, res) => {
  if (!req.user?.id) {
    throw new ApiError(401, 'Unauthorized')
  }

  const { date } = req.query

  // Parse date string (YYYY-MM-DD) or use today
  let parsedDate = new Date()
  if (date) {
    // Create date in local timezone from YYYY-MM-DD string
    const [year, month, day] = date.split('-').map(Number)
    parsedDate = new Date(year, month - 1, day)
  }

  const summary = await attendanceService.getAttendanceSummary(parsedDate, req.user.companyId)

  res.json(summary)
})

/**
 * Export attendance data
 */
export const exportAttendance = catchAsync(async (req, res) => {
  if (!req.user?.id) {
    throw new ApiError(401, 'Unauthorized')
  }

  const { date, department, search } = req.query

  // Parse date string (YYYY-MM-DD) or use today
  let parsedDate = new Date()
  if (date) {
    // Create date in local timezone from YYYY-MM-DD string
    const [year, month, day] = date.split('-').map(Number)
    parsedDate = new Date(year, month - 1, day)
  }

  const data = await attendanceService.exportAttendanceData({
    date: parsedDate,
    department,
    search,
    companyId: req.user.companyId,
  })

  res.json({ data })
})

/**
 * Get unread check-in/check-out notifications
 */
export const getUnreadCheckInOutNotifications = catchAsync(async (req, res) => {
  if (!req.user?.id) {
    throw new ApiError(401, 'Unauthorized')
  }

  const { page, pageSize } = req.query

  const result = await attendanceService.getUnreadCheckInOutNotifications(
    parseInt(page) || 1,
    parseInt(pageSize) || 10
  )

  if (!result.success) {
    throw new ApiError(400, result.error)
  }

  res.json(result)
})

/**
 * Get today's check-in/check-out notifications
 */
export const getTodayCheckInOutNotifications = catchAsync(async (req, res) => {
  if (!req.user?.id) {
    throw new ApiError(401, 'Unauthorized')
  }

  const { page, pageSize } = req.query

  const result = await attendanceService.getTodayCheckInOutNotifications(
    parseInt(page) || 1,
    parseInt(pageSize) || 10
  )

  if (!result.success) {
    throw new ApiError(400, result.error)
  }

  res.json(result)
})

/**
 * Mark check-in/check-out notification as read
 */
export const markCheckInOutNotificationAsRead = catchAsync(async (req, res) => {
  if (!req.user?.id) {
    throw new ApiError(401, 'Unauthorized')
  }

  const { id } = req.params

  if (!id) {
    throw new ApiError(400, 'Notification ID is required')
  }

  const result = await attendanceService.markCheckInOutNotificationAsRead(id)

  if (!result.success) {
    throw new ApiError(400, result.error)
  }

  res.json({
    success: true,
    message: 'Notification marked as read',
    data: result.data,
  })
})

/**
 * Mark all check-in/check-out notifications as read
 */
export const markAllCheckInOutNotificationsAsRead = catchAsync(async (req, res) => {
  if (!req.user?.id) {
    throw new ApiError(401, 'Unauthorized')
  }

  const result = await attendanceService.markAllCheckInOutNotificationsAsRead()

  if (!result.success) {
    throw new ApiError(400, result.error)
  }

  res.json({
    success: true,
    message: 'All notifications marked as read',
    data: result.data,
  })
})

/**
 * Delete a check-in/check-out notification
 */
export const deleteCheckInOutNotification = catchAsync(async (req, res) => {
  if (!req.user?.id) {
    throw new ApiError(401, 'Unauthorized')
  }

  const { id } = req.params

  if (!id) {
    throw new ApiError(400, 'Notification ID is required')
  }

  const result = await attendanceService.deleteCheckInOutNotification(id)

  if (!result.success) {
    throw new ApiError(400, result.error)
  }

  res.json({
    success: true,
    message: 'Notification deleted',
    data: result.data,
  })
})
