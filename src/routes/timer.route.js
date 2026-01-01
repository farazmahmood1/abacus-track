import express from 'express'
import * as timerController from '../controllers/timer.controller.js'
import { requireAuth } from '../middlewares/authMiddleware.js'

const router = express.Router()

// Require web authentication for all timer routes
router.use(requireAuth)

// Get active session
router.get('/active', timerController.getActiveSession)

// Get last session for today
router.get('/last-session', timerController.getLastSessionToday)

// Get elapsed time (real-time)
router.get('/elapsed', timerController.getElapsedTime)

// Check in (start timer)
router.post('/checkin', timerController.checkIn)

// Check out (end timer)
router.post('/checkout', timerController.checkOut)

// Pause timer
router.post('/pause', timerController.pauseTimer)

// Resume timer
router.post('/resume', timerController.resumeTimer)

// Start break
router.post('/break/start', timerController.startBreak)

// End break
router.post('/break/end', timerController.endBreak)

// Get break status
router.get('/break/status', timerController.getBreakStatus)

// Update project for active session
router.patch('/active/project', timerController.updateProjectInSession)

// Get project time for user
router.get('/projects/:projectId', timerController.getProjectTime)

// Get session details
router.get('/sessions/:sessionId', timerController.getSessionDetails)

// Get user's sessions (paginated, can filter by project)
router.get('/sessions', timerController.getUserSessions)

// Get user's timesheets (paginated)
router.get('/timesheets', timerController.getUserTimesheets)

// Get timesheet range with stats
router.get('/timesheets/range', timerController.getTimesheetRange)

export default router
