import * as moodService from '../services/mood.service.js'
import catchAsync from '../utils/catchAsync.js'

const submitMood = catchAsync(async (req, res) => {
  const data = await moodService.submitMood(req.user.id, req.body)
  res.status(201).json({ success: true, data })
})

const getMyMoods = catchAsync(async (req, res) => {
  const { page, limit } = req.query
  const result = await moodService.getMyMoods(req.user.id, page ? parseInt(page) : 1, limit ? parseInt(limit) : 30)
  res.json({ success: true, ...result })
})

const getTeamMoods = catchAsync(async (req, res) => {
  const data = await moodService.getTeamMoods(req.query.date, req.user.companyId)
  res.json({ success: true, data })
})

const getMoodAnalytics = catchAsync(async (req, res) => {
  const data = await moodService.getMoodAnalytics(req.query.days ? parseInt(req.query.days) : 30, req.user.companyId)
  res.json({ success: true, data })
})

export default { submitMood, getMyMoods, getTeamMoods, getMoodAnalytics }
