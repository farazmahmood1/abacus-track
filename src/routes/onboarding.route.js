import express from 'express'
import * as onboardingController from '../controllers/onboarding.controller.js'
import { requirePermission } from '../middlewares/requirePermission.js'

const router = express.Router()

// Get onboarding data
router.get(
  '/',
  requirePermission('onboarding', 'read'),
  onboardingController.getOnboarding
)

// Profile (About)
router.put(
  '/profile',
  requirePermission('onboarding', 'edit'),
  onboardingController.updateProfile
)

// Experiences
router.post(
  '/experience',
  requirePermission('onboarding', 'create'),
  onboardingController.addExperience
)
router.put(
  '/experience/:id',
  requirePermission('onboarding', 'edit'),
  onboardingController.updateExperience
)
router.delete(
  '/experience/:id',
  requirePermission('onboarding', 'delete'),
  onboardingController.deleteExperience
)

// Education
router.post(
  '/education',
  requirePermission('onboarding', 'create'),
  onboardingController.addEducation
)
router.put(
  '/education/:id',
  requirePermission('onboarding', 'edit'),
  onboardingController.updateEducation
)
router.delete(
  '/education/:id',
  requirePermission('onboarding', 'delete'),
  onboardingController.deleteEducation
)

// Skills
router.post(
  '/skill',
  requirePermission('onboarding', 'create'),
  onboardingController.addSkill
)
router.delete(
  '/skill/:id',
  requirePermission('onboarding', 'delete'),
  onboardingController.deleteSkill
)

// Complete onboarding
router.post(
  '/complete',
  requirePermission('onboarding', 'edit'),
  onboardingController.completeOnboarding
)

// Get employee profile with onboarding data
router.get(
  '/employee/:employeeId',
  requirePermission('onboarding', 'read'),
  onboardingController.getEmployeeProfile
)

export default router
