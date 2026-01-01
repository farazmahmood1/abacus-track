import express from 'express'
import * as settingsController from '../controllers/settings.controller.js'
import { requirePermission } from '../middlewares/requirePermission.js'

const router = express.Router()

// Important Links Routes
/**
 * GET /settings/links - Get all active important links (Public)
 */
router.get('/links', settingsController.getImportantLinks)

/**
 * POST /settings/links - Create important link (Admin only)
 */
router.post(
  '/links',
  requirePermission('settings', 'create'),
  settingsController.createImportantLink
)

/**
 * PATCH /settings/links/:id - Update important link (Admin only)
 */
router.patch(
  '/links/:id',
  requirePermission('settings', 'edit'),
  settingsController.updateImportantLink
)

/**
 * DELETE /settings/links/:id - Delete important link (Admin only)
 */
router.delete(
  '/links/:id',
  requirePermission('settings', 'delete'),
  settingsController.deleteImportantLink
)

// Terms & Conditions Routes
/**
 * GET /settings/terms - Get active terms and conditions (Public)
 */
router.get('/terms', settingsController.getTermsConditions)

/**
 * GET /settings/terms/all - Get all terms versions (Admin only)
 */
router.get(
  '/terms/all',
  requirePermission('settings', 'read'),
  settingsController.getAllTermsConditions
)

/**
 * POST /settings/terms - Create terms and conditions (Admin only)
 */
router.post(
  '/terms',
  requirePermission('settings', 'create'),
  settingsController.createTermsCondition
)

/**
 * PATCH /settings/terms/:id - Update terms and conditions (Admin only)
 */
router.patch(
  '/terms/:id',
  requirePermission('settings', 'edit'),
  settingsController.updateTermsCondition
)

/**
 * DELETE /settings/terms/:id - Delete terms and conditions (Admin only)
 */
router.delete(
  '/terms/:id',
  requirePermission('settings', 'delete'),
  settingsController.deleteTermsCondition
)

export default router
