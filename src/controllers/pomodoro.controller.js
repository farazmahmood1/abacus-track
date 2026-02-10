import * as pomodoroService from '../services/pomodoro.service.js'
import catchAsync from '../utils/catchAsync.js'

const saveSession = catchAsync(async (req, res) => {
  const data = await pomodoroService.saveSession(req.user.id, req.body)
  res.status(201).json({ success: true, data })
})

const getHistory = catchAsync(async (req, res) => {
  const { page, limit } = req.query
  const result = await pomodoroService.getHistory(req.user.id, page ? parseInt(page) : 1, limit ? parseInt(limit) : 10)
  res.json({ success: true, ...result })
})

const getStats = catchAsync(async (req, res) => {
  const data = await pomodoroService.getStats(req.user.id)
  res.json({ success: true, data })
})

const getSettings = catchAsync(async (req, res) => {
  const data = await pomodoroService.getSettings(req.user.id)
  res.json({ success: true, data })
})

const updateSettings = catchAsync(async (req, res) => {
  const data = await pomodoroService.updateSettings(req.user.id, req.body)
  res.json({ success: true, data })
})

export default { saveSession, getHistory, getStats, getSettings, updateSettings }
