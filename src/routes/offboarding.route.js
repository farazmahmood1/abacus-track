import express from 'express'
import offboardingController from '../controllers/offboarding.controller.js'
import { requirePermission } from '../middlewares/requirePermission.js'

const router = express.Router()

router.get('/', requirePermission('dashboard', 'read'), offboardingController.getAll)
router.get('/:id', requirePermission('dashboard', 'read'), offboardingController.getById)
router.post('/', requirePermission('settings', 'edit'), offboardingController.initiate)
router.patch('/:processId/tasks/:taskId', requirePermission('settings', 'edit'), offboardingController.toggleTask)
router.put('/:processId/tasks/:taskId', requirePermission('settings', 'edit'), offboardingController.updateTask)
router.patch('/:id/cancel', requirePermission('settings', 'edit'), offboardingController.cancel)

export default router
