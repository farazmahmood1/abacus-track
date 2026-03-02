import * as ownerOnboardingService from '../services/ownerOnboarding.service.js'
import catchAsync from '../utils/catchAsync.js'
import ApiError from '../utils/ApiError.js'

export const getOnboarding = catchAsync(async (req, res) => {
  if (!req.user?.id) throw new ApiError(401, 'Unauthorized')

  const data = await ownerOnboardingService.getOwnerOnboardingData(req.user.id)
  res.json({ success: true, data })
})

export const updateProfile = catchAsync(async (req, res) => {
  if (!req.user?.id) throw new ApiError(401, 'Unauthorized')

  const { phone, designation } = req.body
  const data = await ownerOnboardingService.updateOwnerProfile(req.user.id, {
    phone,
    designation,
  })
  res.json({ success: true, data })
})

export const updateCompanyDetails = catchAsync(async (req, res) => {
  if (!req.user?.id) throw new ApiError(401, 'Unauthorized')
  if (!req.user?.companyId) throw new ApiError(400, 'No company associated')

  const { description, industry, teamSize, website, companyAddress } = req.body
  const data = await ownerOnboardingService.updateCompanyDetails(req.user.companyId, {
    description,
    industry,
    teamSize,
    website,
    companyAddress,
  })
  res.json({ success: true, data })
})

export const updateWorkSetup = catchAsync(async (req, res) => {
  if (!req.user?.id) throw new ApiError(401, 'Unauthorized')
  if (!req.user?.companyId) throw new ApiError(400, 'No company associated')

  const { timezone, workingHours } = req.body
  const data = await ownerOnboardingService.updateWorkSetup(req.user.companyId, {
    timezone,
    workingHours,
  })
  res.json({ success: true, data })
})

export const completeOnboarding = catchAsync(async (req, res) => {
  if (!req.user?.id) throw new ApiError(401, 'Unauthorized')

  const data = await ownerOnboardingService.completeOwnerOnboarding(req.user.id)
  res.json({ success: true, data, message: 'Owner onboarding completed successfully' })
})
