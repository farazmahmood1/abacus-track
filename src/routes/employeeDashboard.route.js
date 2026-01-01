import express from 'express'
import * as employeeDashboardController from '../controllers/employeeDashboard.controller.js'
import { requireAuth } from '../middlewares/authMiddleware.js'

const router = express.Router()

// Require authentication for all routes
router.use(requireAuth)

// Get employee dashboard stats
router.get('/stats', employeeDashboardController.getDashboardStats)

// Get employee weekly hours
router.get('/weekly-hours', employeeDashboardController.getWeeklyHours)

export default router
