import * as overtimeService from '../services/overtime.service.js'
import catchAsync from '../utils/catchAsync.js'

export const getConfig = catchAsync(async (req, res) => {
  const config = await overtimeService.getConfig()
  res.json({ success: true, data: config })
})

export const updateConfig = catchAsync(async (req, res) => {
  const config = await overtimeService.updateConfig(req.body)
  res.json({ success: true, message: 'Overtime config updated', data: config })
})

export const getMyOvertime = catchAsync(async (req, res) => {
  const { startDate, endDate, page, limit } = req.query
  const result = await overtimeService.getMyOvertime(req.user.id, {
    startDate,
    endDate,
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20,
  })
  res.json({ success: true, ...result })
})

export const getAllOvertime = catchAsync(async (req, res) => {
  const { startDate, endDate, userId, page, limit } = req.query
  const result = await overtimeService.getAllOvertime({
    startDate,
    endDate,
    userId,
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20,
  })
  res.json({ success: true, ...result })
})

export const getAlerts = catchAsync(async (req, res) => {
  const alerts = await overtimeService.getAlerts()
  res.json({ success: true, data: alerts })
})

export const getSummary = catchAsync(async (req, res) => {
  const userId = req.query.userId || null
  const summary = await overtimeService.getSummary(userId)
  res.json({ success: true, data: summary })
})

export default {
  getConfig,
  updateConfig,
  getMyOvertime,
  getAllOvertime,
  getAlerts,
  getSummary,
}
