import * as employeeDashboardService from '../services/employeeDashboard.service.js'
import catchAsync from '../utils/catchAsync.js'

export const getDashboardStats = catchAsync(async (req, res) => {
  const userId = req.user.id
  const stats = await employeeDashboardService.getEmployeeDashboardStats(userId)
  res.json(stats)
})

export const getWeeklyHours = catchAsync(async (req, res) => {
  const userId = req.user.id
  const weeklyHours = await employeeDashboardService.getWeeklyHours(userId)
  res.json(weeklyHours)
})
