import express from 'express'
import timesheetSubmissionController from '../controllers/timesheetSubmission.controller.js'
import { requirePermission } from '../middlewares/requirePermission.js'

const router = express.Router()

// Employee routes
router.post('/', requirePermission('leave', 'create'), timesheetSubmissionController.submitTimesheet)
router.get('/my-submissions', requirePermission('leave', 'read'), timesheetSubmissionController.getMySubmissions)
router.get('/current-week', requirePermission('leave', 'read'), timesheetSubmissionController.getCurrentWeekData)

// Admin routes
router.get('/', requirePermission('dashboard', 'read'), timesheetSubmissionController.listSubmissions)
router.get('/:id', requirePermission('dashboard', 'read'), timesheetSubmissionController.getSubmission)
router.patch('/:id/approve', requirePermission('settings', 'edit'), timesheetSubmissionController.approveSubmission)

export default router
