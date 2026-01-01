import express from 'express'
import { requirePermission } from '../middlewares/requirePermission.js'
import { requireAuth } from '../middlewares/authMiddleware.js'
import { uploadDocument } from '../middlewares/upload.js'
import leavesController from '../controllers/leaves.controller.js'

const router = express.Router()

router.get('/my-leaves', requireAuth, leavesController.getMyLeaves)
router.get('/stats', requireAuth, leavesController.getLeaveStats)
router.get(
  '/admin/stats',
  requirePermission('leave', 'read'),
  leavesController.getAdminLeaveStats
)
router.post(
  '/',
  requirePermission('leave', 'create'),
  uploadDocument.single('prescription'),
  leavesController.createLeave
)

router.get('/', requirePermission('leave', 'read'), leavesController.listLeaves)
router.patch(
  '/:id/approve',
  requirePermission('leave', 'edit'),
  leavesController.approveLeave
)

router.put(
  '/:id',
  requirePermission('leave', 'edit'),
  uploadDocument.single('prescription'),
  leavesController.updateLeave
)

router.get('/:id', requirePermission('leave', 'read'), leavesController.getLeave)

router.delete('/:id', requirePermission('leave', 'delete'), leavesController.deleteLeave)

export default router
