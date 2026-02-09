import express from 'express'
import deviationsController from '../controllers/deviations.controller.js'
import { requirePermission } from '../middlewares/requirePermission.js'

const router = express.Router()

router.get('/my-deviations', requirePermission('leave', 'read'), deviationsController.getMyDeviations)
router.get('/summary', requirePermission('dashboard', 'read'), deviationsController.getSummary)
router.get('/', requirePermission('dashboard', 'read'), deviationsController.listDeviations)
router.patch('/:id/excuse', requirePermission('settings', 'edit'), deviationsController.excuseDeviation)

export default router
