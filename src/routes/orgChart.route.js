import express from 'express'
import orgChartController from '../controllers/orgChart.controller.js'
import { requirePermission } from '../middlewares/requirePermission.js'

const router = express.Router()

router.get('/', requirePermission('dashboard', 'read'), orgChartController.getOrgChart)
router.patch('/:userId/manager', requirePermission('settings', 'edit'), orgChartController.setManager)

export default router
