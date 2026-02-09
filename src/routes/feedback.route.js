import express from 'express'
import feedbackController from '../controllers/feedback.controller.js'
import { requirePermission } from '../middlewares/requirePermission.js'

const router = express.Router()

router.post('/', requirePermission('leave', 'create'), feedbackController.submitFeedback)
router.get('/my-feedback', requirePermission('leave', 'read'), feedbackController.getMyFeedback)
router.get('/', requirePermission('dashboard', 'read'), feedbackController.listFeedback)
router.patch('/:id/status', requirePermission('settings', 'edit'), feedbackController.updateStatus)
router.patch('/:id/reply', requirePermission('settings', 'edit'), feedbackController.reply)

export default router
