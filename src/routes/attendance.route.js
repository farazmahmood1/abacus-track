import express from 'express'
import * as attendanceController from '../controllers/attendance.controller.js'
import { requireAuth } from '../middlewares/authMiddleware.js'
import { requirePermission } from '../middlewares/requirePermission.js'

const router = express.Router()

router.use(requireAuth)

router.get('/', attendanceController.getAttendanceRecords)
router.get('/summary', attendanceController.getAttendanceSummary)
router.get('/export', attendanceController.exportAttendance)

// Notification routes (admin only)
router.get(
  '/notifications/unread',
  requirePermission('notifications', 'read'),
  attendanceController.getUnreadCheckInOutNotifications
)
router.get(
  '/notifications/today',
  requirePermission('notifications', 'read'),
  attendanceController.getTodayCheckInOutNotifications
)
router.patch(
  '/notifications/:id/read',
  attendanceController.markCheckInOutNotificationAsRead
)
router.patch(
  '/notifications/read-all',
  attendanceController.markAllCheckInOutNotificationsAsRead
)
router.delete('/notifications/:id', attendanceController.deleteCheckInOutNotification)

export default router
