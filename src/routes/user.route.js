import express from 'express'
import { reportIssue, uploadProfileImage } from '../controllers/user.controller.js'
import { upload } from '../middlewares/upload.js'
import { requireAuth } from '../middlewares/authMiddleware.js'

const router = express.Router()

router.post('/report', reportIssue)
router.post('/upload-image', requireAuth, upload.single('image'), uploadProfileImage)

export default router
