import * as reportsService from '../services/reports.service.js'
import catchAsync from '../utils/catchAsync.js'

// App Usage
const getAppUsageReport = catchAsync(async (req, res) => {
  const { userId, departmentId, startDate, endDate, limit } = req.query
  const data = await reportsService.getAppUsageReport({
    userId, departmentId, startDate, endDate,
    limit: limit ? parseInt(limit) : undefined,
  })
  res.json({ success: true, data })
})

const getAppUsageByCategory = catchAsync(async (req, res) => {
  const { userId, departmentId, startDate, endDate } = req.query
  const data = await reportsService.getAppUsageByCategory({ userId, departmentId, startDate, endDate })
  res.json({ success: true, data })
})

// App Categories
const listAppCategories = catchAsync(async (req, res) => {
  const data = await reportsService.listAppCategories()
  res.json({ success: true, data })
})

const upsertAppCategory = catchAsync(async (req, res) => {
  const { appName, category } = req.body
  const data = await reportsService.upsertAppCategory(appName, category)
  res.json({ success: true, data })
})

const deleteAppCategory = catchAsync(async (req, res) => {
  await reportsService.deleteAppCategory(req.params.id)
  res.json({ success: true, message: 'Category deleted' })
})

// Idle Time
const getIdleTimeReport = catchAsync(async (req, res) => {
  const { userId, departmentId, startDate, endDate } = req.query
  const data = await reportsService.getIdleTimeReport({ userId, departmentId, startDate, endDate })
  res.json({ success: true, data })
})

const getIdleTimeSummary = catchAsync(async (req, res) => {
  const { departmentId, startDate, endDate } = req.query
  const data = await reportsService.getIdleTimeSummary({ departmentId, startDate, endDate })
  res.json({ success: true, data })
})

// Attendance Heatmap
const getAttendanceHeatmap = catchAsync(async (req, res) => {
  const { userId, year, month } = req.query
  const data = await reportsService.getAttendanceHeatmap({
    userId: userId || req.user.id,
    year: parseInt(year) || new Date().getFullYear(),
    month: parseInt(month) || new Date().getMonth() + 1,
  })
  res.json({ success: true, data })
})

// Department Comparison
const getDepartmentComparison = catchAsync(async (req, res) => {
  const { startDate, endDate } = req.query
  const data = await reportsService.getDepartmentComparison({ startDate, endDate })
  res.json({ success: true, data })
})

// Employee Trends
const getEmployeeTrends = catchAsync(async (req, res) => {
  const { userId } = req.params
  const { weeks } = req.query
  const data = await reportsService.getEmployeeTrends({
    userId,
    weeks: weeks ? parseInt(weeks) : undefined,
  })
  res.json({ success: true, data })
})

// Cost Analysis
const getCostAnalysis = catchAsync(async (req, res) => {
  const { startDate, endDate } = req.query
  const data = await reportsService.getCostAnalysis({ startDate, endDate })
  res.json({ success: true, data })
})

const getCostByDepartment = catchAsync(async (req, res) => {
  const { startDate, endDate } = req.query
  const data = await reportsService.getCostByDepartment({ startDate, endDate })
  res.json({ success: true, data })
})

export default {
  getAppUsageReport,
  getAppUsageByCategory,
  listAppCategories,
  upsertAppCategory,
  deleteAppCategory,
  getIdleTimeReport,
  getIdleTimeSummary,
  getAttendanceHeatmap,
  getDepartmentComparison,
  getEmployeeTrends,
  getCostAnalysis,
  getCostByDepartment,
}
