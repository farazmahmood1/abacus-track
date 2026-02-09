import * as standupsService from '../services/standups.service.js'
import catchAsync from '../utils/catchAsync.js'

const submitStandup = catchAsync(async (req, res) => {
  const data = await standupsService.submitStandup(req.user.id, req.body)
  res.status(201).json({ success: true, data })
})

const getMyStandups = catchAsync(async (req, res) => {
  const { page, limit } = req.query
  const data = await standupsService.getMyStandups(req.user.id, {
    page: page ? parseInt(page) : undefined,
    limit: limit ? parseInt(limit) : undefined,
  })
  res.json({ success: true, ...data })
})

const getTodayStandup = catchAsync(async (req, res) => {
  const data = await standupsService.getTodayStandup(req.user.id)
  res.json({ success: true, data })
})

const listStandups = catchAsync(async (req, res) => {
  const { date, userId, departmentId, page, limit } = req.query
  const data = await standupsService.listStandups({
    date, userId, departmentId,
    page: page ? parseInt(page) : undefined,
    limit: limit ? parseInt(limit) : undefined,
  })
  res.json({ success: true, ...data })
})

const getMissingStandups = catchAsync(async (req, res) => {
  const data = await standupsService.getMissingStandups()
  res.json({ success: true, data })
})

export default { submitStandup, getMyStandups, getTodayStandup, listStandups, getMissingStandups }
