import express from 'express'
import milestoneController from '../controllers/milestone.controller.js'
import { requirePermission } from '../middlewares/requirePermission.js'

const router = express.Router()

router.get('/upcoming', requirePermission('leave', 'read'), milestoneController.getUpcoming)
router.get('/today', requirePermission('leave', 'read'), milestoneController.getToday)
router.put('/dates/:userId', requirePermission('settings', 'edit'), milestoneController.updateDates)

export default router
