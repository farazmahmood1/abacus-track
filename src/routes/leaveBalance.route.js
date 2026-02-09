import express from 'express'
import leaveBalanceController from '../controllers/leaveBalance.controller.js'
import { requirePermission } from '../middlewares/requirePermission.js'

const router = express.Router()

/**
 * GET /api/leave-balances/my-balances
 * Get current user's leave balances
 */
router.get(
  '/my-balances',
  requirePermission('leave', 'read'),
  leaveBalanceController.getMyBalances
)

/**
 * GET /api/leave-balances/policies
 * Get all leave policies
 */
router.get(
  '/policies',
  requirePermission('leave', 'read'),
  leaveBalanceController.listPolicies
)

/**
 * POST /api/leave-balances/policies
 * Create or update a leave policy (admin)
 */
router.post(
  '/policies',
  requirePermission('settings', 'edit'),
  leaveBalanceController.upsertPolicy
)

/**
 * GET /api/leave-balances
 * Get all employees' balances (admin)
 */
router.get(
  '/',
  requirePermission('leave', 'read'),
  leaveBalanceController.getAllBalances
)

/**
 * POST /api/leave-balances/initialize
 * Initialize yearly balances for all employees (admin)
 */
router.post(
  '/initialize',
  requirePermission('settings', 'edit'),
  leaveBalanceController.initializeBalances
)

/**
 * GET /api/leave-balances/:userId
 * Get specific user's balances (admin)
 */
router.get(
  '/:userId',
  requirePermission('leave', 'read'),
  leaveBalanceController.getUserBalances
)

/**
 * PUT /api/leave-balances/:id
 * Manually adjust a leave balance (admin)
 */
router.put(
  '/:id',
  requirePermission('settings', 'edit'),
  leaveBalanceController.adjustBalance
)

export default router
