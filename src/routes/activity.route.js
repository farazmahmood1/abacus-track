import express from 'express'
import { batchPushActivity } from '../controllers/activity.controller.js'
import { requireAuth } from '../middlewares/authMiddleware.js'

const router = express.Router()

router.post('/batch', requireAuth, batchPushActivity)

export default router
