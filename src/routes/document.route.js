import express from 'express'
import documentController from '../controllers/document.controller.js'
import { requirePermission } from '../middlewares/requirePermission.js'
import { uploadGeneralDocument } from '../middlewares/upload.js'

const router = express.Router()

router.get('/', requirePermission('leave', 'read'), documentController.getAll)
router.get('/:id', requirePermission('leave', 'read'), documentController.getById)
router.get(
  '/:id/acknowledgments',
  requirePermission('dashboard', 'read'),
  documentController.getAcknowledgments
)
router.post(
  '/',
  requirePermission('settings', 'edit'),
  uploadGeneralDocument.single('file'),
  documentController.create
)
router.put(
  '/:id',
  requirePermission('settings', 'edit'),
  uploadGeneralDocument.single('file'),
  documentController.update
)
router.delete('/:id', requirePermission('settings', 'edit'), documentController.remove)
router.post('/:id/acknowledge', requirePermission('leave', 'read'), documentController.acknowledge)

export default router
