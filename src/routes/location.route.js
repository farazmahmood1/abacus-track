import express from 'express'
import locationController from '../controllers/location.controller.js'
import { requirePermission } from '../middlewares/requirePermission.js'

const router = express.Router()

router.get('/logs/:sessionId', requirePermission('dashboard', 'read'), locationController.getLocationLogs)
router.get('/employee/:employeeId', requirePermission('dashboard', 'read'), locationController.getEmployeeLocations)

export default router
