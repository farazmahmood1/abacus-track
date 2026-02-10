import * as milestoneService from '../services/milestone.service.js'
import catchAsync from '../utils/catchAsync.js'

const getUpcoming = catchAsync(async (req, res) => {
  const days = req.query.days ? parseInt(req.query.days) : 30
  const data = await milestoneService.getUpcomingMilestones(days)
  res.json({ success: true, data })
})

const getToday = catchAsync(async (req, res) => {
  const data = await milestoneService.getTodayMilestones()
  res.json({ success: true, data })
})

const updateDates = catchAsync(async (req, res) => {
  const { userId } = req.params
  const data = await milestoneService.updateUserDates(userId, req.body)
  res.json({ success: true, data })
})

export default { getUpcoming, getToday, updateDates }
