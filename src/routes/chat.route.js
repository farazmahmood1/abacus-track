import express from 'express'
import chatController from '../controllers/chat.controller.js'
import { requirePermission } from '../middlewares/requirePermission.js'

const router = express.Router()

// All chat routes require basic auth (leave:read as the baseline permission)
router.post('/conversations', requirePermission('leave', 'read'), chatController.createConversation)
router.get('/conversations', requirePermission('leave', 'read'), chatController.listConversations)
router.get('/conversations/:id/messages', requirePermission('leave', 'read'), chatController.getMessages)
router.post('/conversations/:id/messages', requirePermission('leave', 'read'), chatController.sendMessage)
router.patch('/conversations/:id/read', requirePermission('leave', 'read'), chatController.markAsRead)

export default router
