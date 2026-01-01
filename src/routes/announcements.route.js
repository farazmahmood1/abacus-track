import express from 'express'
import { requirePermission } from '../middlewares/requirePermission.js'
import announcementsController from '../controllers/announcements.controller.js'

const router = express.Router()

// Admin endpoint to list all announcements with optional filters
router.get(
  '/',
  requirePermission('announcement', 'read'),
  announcementsController.listAnnouncements
)

// Employee endpoint to list announcements for their department (company-wide + department-specific)
router.get(
  '/employee/list',
  requirePermission('announcement', 'read'),
  announcementsController.listEmployeeAnnouncements
)

router.get(
  '/:id',
  requirePermission('announcement', 'read'),
  announcementsController.getAnnouncement
)

router.post(
  '/',
  requirePermission('announcement', 'create'),
  announcementsController.createAnnouncement
)
router.put(
  '/:id',
  requirePermission('announcement', 'edit'),
  announcementsController.updateAnnouncement
)
router.delete(
  '/:id',
  requirePermission('announcement', 'delete'),
  announcementsController.deleteAnnouncement
)

export default router
