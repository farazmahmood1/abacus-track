import * as compensationService from '../services/compensation.service.js'
import catchAsync from '../utils/catchAsync.js'

const getAll = catchAsync(async (req, res) => {
  const { type, status, search, page, limit } = req.query
  const data = await compensationService.getAll({
    type,
    status,
    search,
    page: page ? parseInt(page) : undefined,
    limit: limit ? parseInt(limit) : undefined,
  })
  res.json({ success: true, ...data })
})

const getMyCompensations = catchAsync(async (req, res) => {
  const { page, limit } = req.query
  const data = await compensationService.getMyCompensations(req.user.id, {
    page: page ? parseInt(page) : undefined,
    limit: limit ? parseInt(limit) : undefined,
  })
  res.json({ success: true, ...data })
})

const getSummary = catchAsync(async (req, res) => {
  const data = await compensationService.getSummary()
  res.json({ success: true, data })
})

const getMySummary = catchAsync(async (req, res) => {
  const data = await compensationService.getSummary(req.user.id)
  res.json({ success: true, data })
})

const create = catchAsync(async (req, res) => {
  const data = await compensationService.create(req.body)
  res.status(201).json({ success: true, data })
})

const updateStatus = catchAsync(async (req, res) => {
  const data = await compensationService.updateStatus(req.params.id, req.body.status, req.user.id)
  res.json({ success: true, data })
})

const remove = catchAsync(async (req, res) => {
  await compensationService.deleteCompensation(req.params.id)
  res.json({ success: true, data: { message: 'Compensation record deleted' } })
})

export default { getAll, getMyCompensations, getSummary, getMySummary, create, updateStatus, remove }
