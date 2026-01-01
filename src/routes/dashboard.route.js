import express from 'express'
import * as dashboardController from '../controllers/dashboard.controller.js'
import { requirePermission } from '../middlewares/requirePermission.js'

const router = express.Router()

/**
 * Get dashboard data with optional filters
 * Supports query params: departmentId, projectId, startDate, endDate
 * GET /api/dashboard
 */
router.get(
  '/',
  requirePermission('dashboard', 'read'),
  dashboardController.getDashboardData
)

export default router
