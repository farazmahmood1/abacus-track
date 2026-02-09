import express from 'express'
import shiftsController from '../controllers/shifts.controller.js'
import { requirePermission } from '../middlewares/requirePermission.js'

const router = express.Router()

/**
 * GET /api/shifts/my-shift
 * Get current user's active shift
 */
router.get(
  '/my-shift',
  requirePermission('shift', 'read'),
  shiftsController.getMyShift
)

/**
 * GET /api/shifts
 * List all shifts
 */
router.get(
  '/',
  requirePermission('shift', 'read'),
  shiftsController.listShifts
)

/**
 * POST /api/shifts
 * Create a new shift
 */
router.post(
  '/',
  requirePermission('shift', 'create'),
  shiftsController.createShift
)

/**
 * GET /api/shifts/:id
 * Get a single shift
 */
router.get(
  '/:id',
  requirePermission('shift', 'read'),
  shiftsController.getShift
)

/**
 * PUT /api/shifts/:id
 * Update a shift
 */
router.put(
  '/:id',
  requirePermission('shift', 'edit'),
  shiftsController.updateShift
)

/**
 * DELETE /api/shifts/:id
 * Delete a shift
 */
router.delete(
  '/:id',
  requirePermission('shift', 'delete'),
  shiftsController.deleteShift
)

/**
 * GET /api/shifts/:id/employees
 * Get employees in a shift
 */
router.get(
  '/:id/employees',
  requirePermission('shift', 'read'),
  shiftsController.getShiftEmployees
)

/**
 * POST /api/shifts/assign
 * Assign employee to shift
 */
router.post(
  '/assign',
  requirePermission('shift', 'edit'),
  shiftsController.assignEmployee
)

/**
 * POST /api/shifts/unassign
 * Unassign employee from shift
 */
router.post(
  '/unassign',
  requirePermission('shift', 'edit'),
  shiftsController.unassignEmployee
)

export default router
