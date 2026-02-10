import express from 'express'
import compensationController from '../controllers/compensation.controller.js'
import { requirePermission } from '../middlewares/requirePermission.js'

const router = express.Router()

router.get('/', requirePermission('dashboard', 'read'), compensationController.getAll)
router.get('/summary', requirePermission('dashboard', 'read'), compensationController.getSummary)
router.get('/me', requirePermission('leave', 'read'), compensationController.getMyCompensations)
router.get('/me/summary', requirePermission('leave', 'read'), compensationController.getMySummary)
router.post('/', requirePermission('settings', 'edit'), compensationController.create)
router.patch('/:id/status', requirePermission('settings', 'edit'), compensationController.updateStatus)
router.delete('/:id', requirePermission('settings', 'edit'), compensationController.remove)

export default router
