import express from 'express'
import standupsController from '../controllers/standups.controller.js'
import { requirePermission } from '../middlewares/requirePermission.js'

const router = express.Router()

router.post('/', requirePermission('leave', 'create'), standupsController.submitStandup)
router.get('/my-standups', requirePermission('leave', 'read'), standupsController.getMyStandups)
router.get('/today', requirePermission('leave', 'read'), standupsController.getTodayStandup)
router.get('/missing', requirePermission('dashboard', 'read'), standupsController.getMissingStandups)
router.get('/', requirePermission('dashboard', 'read'), standupsController.listStandups)

export default router
