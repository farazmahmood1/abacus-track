import express from 'express'
import * as announcementNotificationsController from '../controllers/announcementNotifications.controller.js'
import { requireAuth } from '../middlewares/authMiddleware.js'

const router = express.Router()

// All routes require authentication
router.use(requireAuth)

// Get user's announcement notifications
router.get('/', announcementNotificationsController.getAnnouncementNotifications)

// Get unread count
router.get('/unread-count', announcementNotificationsController.getUnreadCount)

// Mark announcement as read
router.patch('/:announcementId/read', announcementNotificationsController.markAsRead)

// Mark all as read
router.patch('/read-all', announcementNotificationsController.markAllAsRead)

// Delete a notification
router.delete('/:announcementId', announcementNotificationsController.deleteNotification)

export default router
