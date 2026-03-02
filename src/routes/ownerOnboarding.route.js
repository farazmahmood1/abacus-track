import express from 'express'
import * as ownerOnboardingController from '../controllers/ownerOnboarding.controller.js'
import { requireAuth } from '../middlewares/authMiddleware.js'

const router = express.Router()

router.get('/', requireAuth, ownerOnboardingController.getOnboarding)
router.put('/profile', requireAuth, ownerOnboardingController.updateProfile)
router.put('/company', requireAuth, ownerOnboardingController.updateCompanyDetails)
router.put('/work-setup', requireAuth, ownerOnboardingController.updateWorkSetup)
router.post('/complete', requireAuth, ownerOnboardingController.completeOnboarding)

export default router
