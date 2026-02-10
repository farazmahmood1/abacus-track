import express from 'express'
import wellnessController from '../controllers/wellness.controller.js'
import { requirePermission } from '../middlewares/requirePermission.js'

const router = express.Router()

// Admin-only routes
router.post('/', requirePermission('dashboard', 'read'), wellnessController.create)

// Shared routes (must come before /:id)
router.get('/active', requirePermission('leave', 'read'), wellnessController.getActive)
router.get('/my', requirePermission('leave', 'read'), wellnessController.getMyChallenges)

// General list
router.get('/', requirePermission('leave', 'read'), wellnessController.getAll)

// Single challenge
router.get('/:id', requirePermission('leave', 'read'), wellnessController.getOne)

// Admin-only update/delete
router.put('/:id', requirePermission('dashboard', 'read'), wellnessController.update)
router.delete('/:id', requirePermission('dashboard', 'read'), wellnessController.remove)

// Participant actions
router.post('/:id/join', requirePermission('leave', 'read'), wellnessController.join)
router.patch('/:id/progress', requirePermission('leave', 'read'), wellnessController.updateProgress)
router.get('/:id/leaderboard', requirePermission('leave', 'read'), wellnessController.getLeaderboard)

export default router
