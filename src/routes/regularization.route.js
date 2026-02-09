import express from 'express'
import regularizationController from '../controllers/regularization.controller.js'
import { requirePermission } from '../middlewares/requirePermission.js'

const router = express.Router()

router.post('/', requirePermission('leave', 'create'), regularizationController.submitRequest)
router.get('/my-requests', requirePermission('leave', 'read'), regularizationController.getMyRequests)
router.get('/', requirePermission('dashboard', 'read'), regularizationController.listRegularizations)
router.patch('/:id/approve', requirePermission('settings', 'edit'), regularizationController.approveRegularization)

export default router
