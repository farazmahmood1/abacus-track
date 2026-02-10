import express from 'express'
import moodController from '../controllers/mood.controller.js'
import { requirePermission } from '../middlewares/requirePermission.js'

const router = express.Router()

router.post('/', requirePermission('leave', 'read'), moodController.submitMood)
router.get('/my', requirePermission('leave', 'read'), moodController.getMyMoods)
router.get('/team', requirePermission('dashboard', 'read'), moodController.getTeamMoods)
router.get('/analytics', requirePermission('dashboard', 'read'), moodController.getMoodAnalytics)

export default router
