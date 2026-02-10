import express from 'express'
import gamificationController from '../controllers/gamification.controller.js'
import { requirePermission } from '../middlewares/requirePermission.js'

const router = express.Router()

router.get('/leaderboard', requirePermission('leave', 'read'), gamificationController.getLeaderboard)
router.get('/my-points', requirePermission('leave', 'read'), gamificationController.getMyPoints)
router.get('/my-badges', requirePermission('leave', 'read'), gamificationController.getMyBadges)
router.get('/badges', requirePermission('leave', 'read'), gamificationController.getAllBadges)
router.post('/award', requirePermission('dashboard', 'read'), gamificationController.awardPoints)

export default router
