import * as dashboardService from '../services/dashboard.service.js'
import catchAsync from '../utils/catchAsync.js'

/**
 * Get dashboard data with filters
 * Query params: departmentId, projectId, startDate, endDate
 */
export const getDashboardData = catchAsync(async (req, res) => {
  const { departmentId, projectId, startDate, endDate } = req.query

  // Parse dates if provided
  const filters = { companyId: req.user.companyId }
  if (departmentId) filters.departmentId = departmentId
  if (projectId) filters.projectId = projectId
  if (startDate) filters.startDate = new Date(startDate)
  if (endDate) filters.endDate = new Date(endDate)

  const data = await dashboardService.getDashboardData(filters)

  res.json({
    data,
    message: 'Dashboard data retrieved successfully',
  })
})
