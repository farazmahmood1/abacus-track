import express from 'express'
import reportsController from '../controllers/reports.controller.js'
import { requirePermission } from '../middlewares/requirePermission.js'

const router = express.Router()

// App Usage Reports
router.get('/app-usage', requirePermission('dashboard', 'read'), reportsController.getAppUsageReport)
router.get('/app-usage/categories', requirePermission('dashboard', 'read'), reportsController.getAppUsageByCategory)

// App Categories CRUD
router.get('/app-categories', requirePermission('dashboard', 'read'), reportsController.listAppCategories)
router.post('/app-categories', requirePermission('settings', 'edit'), reportsController.upsertAppCategory)
router.delete('/app-categories/:id', requirePermission('settings', 'edit'), reportsController.deleteAppCategory)

// Idle Time Reports
router.get('/idle-time', requirePermission('dashboard', 'read'), reportsController.getIdleTimeReport)
router.get('/idle-time/summary', requirePermission('dashboard', 'read'), reportsController.getIdleTimeSummary)

// Attendance Heatmap
router.get('/attendance-heatmap', requirePermission('dashboard', 'read'), reportsController.getAttendanceHeatmap)

// Department Comparison
router.get('/department-comparison', requirePermission('dashboard', 'read'), reportsController.getDepartmentComparison)

// Employee Trends
router.get('/employee-trends/:userId', requirePermission('dashboard', 'read'), reportsController.getEmployeeTrends)

// Cost Analysis
router.get('/cost-analysis', requirePermission('dashboard', 'read'), reportsController.getCostAnalysis)
router.get('/cost-analysis/department', requirePermission('dashboard', 'read'), reportsController.getCostByDepartment)

export default router
