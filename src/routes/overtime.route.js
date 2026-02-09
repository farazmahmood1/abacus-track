import express from 'express'
import overtimeController from '../controllers/overtime.controller.js'
import { requirePermission } from '../middlewares/requirePermission.js'

const router = express.Router()

/**
 * GET /api/overtime/config
 */
router.get('/config', requirePermission('settings', 'read'), overtimeController.getConfig)

/**
 * PUT /api/overtime/config
 */
router.put('/config', requirePermission('settings', 'edit'), overtimeController.updateConfig)

/**
 * GET /api/overtime/my-overtime
 */
router.get('/my-overtime', requirePermission('leave', 'read'), overtimeController.getMyOvertime)

/**
 * GET /api/overtime/alerts
 */
router.get('/alerts', requirePermission('dashboard', 'read'), overtimeController.getAlerts)

/**
 * GET /api/overtime/summary
 */
router.get('/summary', requirePermission('dashboard', 'read'), overtimeController.getSummary)

/**
 * GET /api/overtime
 */
router.get('/', requirePermission('dashboard', 'read'), overtimeController.getAllOvertime)

export default router
