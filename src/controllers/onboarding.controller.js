import * as onboardingService from '../services/onboarding.service.js'
import catchAsync from '../utils/catchAsync.js'
import ApiError from '../utils/ApiError.js'

/**
 * Get onboarding data
 */
export const getOnboarding = catchAsync(async (req, res) => {
  if (!req.user?.id) {
    throw new ApiError(401, 'Unauthorized')
  }

  const data = await onboardingService.getOnboardingData(req.user.id)

  res.json({
    success: true,
    data,
  })
})

/**
 * Update profile (About)
 */
export const updateProfile = catchAsync(async (req, res) => {
  if (!req.user?.id) {
    throw new ApiError(401, 'Unauthorized')
  }

  const { about } = req.body

  const profile = await onboardingService.updateProfile(req.user.id, {
    about,
  })

  res.json({
    success: true,
    data: profile,
  })
})

/**
 * Add experience
 */
export const addExperience = catchAsync(async (req, res) => {
  if (!req.user?.id) {
    throw new ApiError(401, 'Unauthorized')
  }

  const { position, company, startDate, endDate, description } = req.body

  if (!position || !company || !startDate) {
    throw new ApiError(400, 'Position, company, and startDate are required')
  }

  const experience = await onboardingService.addExperience(req.user.id, {
    position,
    company,
    startDate,
    endDate,
    description,
  })

  res.json({
    success: true,
    data: experience,
  })
})

/**
 * Update experience
 */
export const updateExperience = catchAsync(async (req, res) => {
  if (!req.user?.id) {
    throw new ApiError(401, 'Unauthorized')
  }

  const { id } = req.params
  const { position, company, startDate, endDate, description } = req.body

  if (!id || !position || !company || !startDate) {
    throw new ApiError(400, 'ID, position, company, and startDate are required')
  }

  const experience = await onboardingService.updateExperience(id, {
    position,
    company,
    startDate,
    endDate,
    description,
  })

  res.json({
    success: true,
    data: experience,
  })
})

/**
 * Delete experience
 */
export const deleteExperience = catchAsync(async (req, res) => {
  if (!req.user?.id) {
    throw new ApiError(401, 'Unauthorized')
  }

  const { id } = req.params

  if (!id) {
    throw new ApiError(400, 'Experience ID is required')
  }

  await onboardingService.deleteExperience(id)

  res.json({
    success: true,
    message: 'Experience deleted successfully',
  })
})

/**
 * Add education
 */
export const addEducation = catchAsync(async (req, res) => {
  if (!req.user?.id) {
    throw new ApiError(401, 'Unauthorized')
  }

  const { educationName, institute, startDate, endDate, description } = req.body

  if (!educationName || !institute || !startDate) {
    throw new ApiError(400, 'Education name, institute, and startDate are required')
  }

  const education = await onboardingService.addEducation(req.user.id, {
    educationName,
    institute,
    startDate,
    endDate,
    description,
  })

  res.json({
    success: true,
    data: education,
  })
})

/**
 * Update education
 */
export const updateEducation = catchAsync(async (req, res) => {
  if (!req.user?.id) {
    throw new ApiError(401, 'Unauthorized')
  }

  const { id } = req.params
  const { educationName, institute, startDate, endDate, description } = req.body

  if (!id || !educationName || !institute || !startDate) {
    throw new ApiError(400, 'ID, education name, institute, and startDate are required')
  }

  const education = await onboardingService.updateEducation(id, {
    educationName,
    institute,
    startDate,
    endDate,
    description,
  })

  res.json({
    success: true,
    data: education,
  })
})

/**
 * Delete education
 */
export const deleteEducation = catchAsync(async (req, res) => {
  if (!req.user?.id) {
    throw new ApiError(401, 'Unauthorized')
  }

  const { id } = req.params

  if (!id) {
    throw new ApiError(400, 'Education ID is required')
  }

  await onboardingService.deleteEducation(id)

  res.json({
    success: true,
    message: 'Education deleted successfully',
  })
})

/**
 * Add skill
 */
export const addSkill = catchAsync(async (req, res) => {
  if (!req.user?.id) {
    throw new ApiError(401, 'Unauthorized')
  }

  const { skillName } = req.body

  if (!skillName) {
    throw new ApiError(400, 'Skill name is required')
  }

  const skill = await onboardingService.addSkill(req.user.id, skillName)

  res.json({
    success: true,
    data: skill,
  })
})

/**
 * Delete skill
 */
export const deleteSkill = catchAsync(async (req, res) => {
  if (!req.user?.id) {
    throw new ApiError(401, 'Unauthorized')
  }

  const { id } = req.params

  if (!id) {
    throw new ApiError(400, 'Skill ID is required')
  }

  await onboardingService.deleteSkill(id)

  res.json({
    success: true,
    message: 'Skill deleted successfully',
  })
})

/**
 * Complete onboarding
 */
export const completeOnboarding = catchAsync(async (req, res) => {
  if (!req.user?.id) {
    throw new ApiError(401, 'Unauthorized')
  }

  const user = await onboardingService.completeOnboarding(req.user.id)

  res.json({
    success: true,
    data: user,
    message: 'Onboarding completed successfully',
  })
})

/**
 * Get employee profile with onboarding data
 */
export const getEmployeeProfile = catchAsync(async (req, res) => {
  if (!req.user?.id) {
    throw new ApiError(401, 'Unauthorized')
  }

  const { employeeId } = req.params

  if (!employeeId) {
    throw new ApiError(400, 'Employee ID is required')
  }

  const data = await onboardingService.getOnboardingData(employeeId)

  res.json({
    success: true,
    data,
  })
})
