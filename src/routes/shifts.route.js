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

// ============================================
// Schedule (Drag-and-Drop)
// ============================================
router.get('/schedule', requirePermission('shift', 'read'), shiftsController.getSchedule)
router.post('/schedule', requirePermission('shift', 'edit'), shiftsController.createScheduleEntry)
router.post('/schedule/bulk', requirePermission('shift', 'edit'), shiftsController.bulkCreateScheduleEntries)
router.put('/schedule/:id', requirePermission('shift', 'edit'), shiftsController.moveScheduleEntry)
router.delete('/schedule/:id', requirePermission('shift', 'edit'), shiftsController.deleteScheduleEntry)
router.get('/schedule/conflicts', requirePermission('shift', 'read'), shiftsController.checkConflicts)

// ============================================
// Swap Requests
// ============================================
router.post('/swaps', requirePermission('shift', 'read'), shiftsController.createSwapRequest)
router.get('/swaps', requirePermission('shift', 'read'), shiftsController.getSwapRequests)
router.get('/swaps/my', requirePermission('shift', 'read'), shiftsController.getMySwapRequests)
router.patch('/swaps/:id', requirePermission('shift', 'edit'), shiftsController.respondToSwapRequest)

// ============================================
// Availability
// ============================================
router.get('/availability/me', requirePermission('shift', 'read'), shiftsController.getMyAvailability)
router.put('/availability/me', requirePermission('shift', 'read'), shiftsController.updateMyAvailability)
router.get('/availability/employee/:employeeId', requirePermission('shift', 'read'), shiftsController.getEmployeeAvailability)
router.get('/availability/department/:departmentId', requirePermission('shift', 'read'), shiftsController.getDepartmentAvailability)

// ============================================
// Shift Settings
// ============================================
router.get('/settings', requirePermission('shift', 'read'), shiftsController.getShiftSettings)
router.put('/settings', requirePermission('shift', 'edit'), shiftsController.updateShiftSettings)

// ============================================
// Single shift by ID (MUST be after all specific routes)
// ============================================

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

export default router
