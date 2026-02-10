import express from 'express'
import pomodoroController from '../controllers/pomodoro.controller.js'
import { requirePermission } from '../middlewares/requirePermission.js'

const router = express.Router()

router.post('/sessions', requirePermission('leave', 'read'), pomodoroController.saveSession)
router.get('/history', requirePermission('leave', 'read'), pomodoroController.getHistory)
router.get('/stats', requirePermission('leave', 'read'), pomodoroController.getStats)
router.get('/settings', requirePermission('leave', 'read'), pomodoroController.getSettings)
router.put('/settings', requirePermission('leave', 'read'), pomodoroController.updateSettings)

export default router
