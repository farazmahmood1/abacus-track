import * as gamificationService from '../services/gamification.service.js'
import catchAsync from '../utils/catchAsync.js'

const getLeaderboard = catchAsync(async (req, res) => {
  const { period, limit } = req.query
  const data = await gamificationService.getLeaderboard(
    period || 'month',
    limit ? parseInt(limit) : 20
  )
  res.json({ success: true, data })
})

const getMyPoints = catchAsync(async (req, res) => {
  const { page, limit } = req.query
  const result = await gamificationService.getMyPoints(
    req.user.id,
    page ? parseInt(page) : 1,
    limit ? parseInt(limit) : 20
  )
  res.json({ success: true, ...result })
})

const getMyBadges = catchAsync(async (req, res) => {
  const data = await gamificationService.getMyBadges(req.user.id)
  res.json({ success: true, data })
})

const getAllBadges = catchAsync(async (req, res) => {
  const data = await gamificationService.getAllBadges()
  res.json({ success: true, data })
})

const awardPoints = catchAsync(async (req, res) => {
  const { userId, points, reason, category } = req.body
  if (!userId || !points || !reason || !category) {
    return res.status(400).json({ success: false, message: 'userId, points, reason, and category are required' })
  }
  const data = await gamificationService.awardPoints(userId, parseInt(points), reason, category)
  res.status(201).json({ success: true, data })
})

export default { getLeaderboard, getMyPoints, getMyBadges, getAllBadges, awardPoints }
