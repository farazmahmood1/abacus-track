import * as locationService from '../services/location.service.js'
import catchAsync from '../utils/catchAsync.js'

const getLocationLogs = catchAsync(async (req, res) => {
  const data = await locationService.getLocationLogs(req.params.sessionId)
  res.json({ success: true, data })
})

const getEmployeeLocations = catchAsync(async (req, res) => {
  const { date } = req.query
  const data = await locationService.getEmployeeLocations(req.params.employeeId, date || new Date())
  res.json({ success: true, data })
})

export default { getLocationLogs, getEmployeeLocations }
