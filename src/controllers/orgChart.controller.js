import * as orgChartService from '../services/orgChart.service.js'
import catchAsync from '../utils/catchAsync.js'

const getOrgChart = catchAsync(async (req, res) => {
  const data = await orgChartService.getOrgChart()
  res.json({ success: true, data })
})

const setManager = catchAsync(async (req, res) => {
  const data = await orgChartService.setManager(req.params.userId, req.body.managerId)
  res.json({ success: true, data })
})

export default { getOrgChart, setManager }
