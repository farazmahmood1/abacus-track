import express from 'express'
import scheduledReportController from '../controllers/scheduledReport.controller.js'
import { requirePermission } from '../middlewares/requirePermission.js'

const router = express.Router()

router.post('/', requirePermission('dashboard', 'read'), scheduledReportController.create)
router.get('/', requirePermission('dashboard', 'read'), scheduledReportController.getAll)
router.get('/:id', requirePermission('dashboard', 'read'), scheduledReportController.getOne)
router.put('/:id', requirePermission('dashboard', 'read'), scheduledReportController.update)
router.delete('/:id', requirePermission('dashboard', 'read'), scheduledReportController.remove)
router.patch('/:id/toggle', requirePermission('dashboard', 'read'), scheduledReportController.toggle)

export default router
