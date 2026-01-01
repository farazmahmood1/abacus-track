import express from 'express'
import { requireAuth } from '../middlewares/authMiddleware.js'
import * as notificationsController from '../controllers/notifications.controller.js'

const router = express.Router()

router.use(requireAuth)

router.get('/', notificationsController.getNotifications)
router.patch('/:notificationId/read', notificationsController.markAsRead)
router.patch('/read-all', notificationsController.markAllAsRead)
router.delete('/:notificationId', notificationsController.deleteNotification)

export default router
