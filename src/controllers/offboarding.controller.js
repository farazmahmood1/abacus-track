import * as offboardingService from '../services/offboarding.service.js'
import catchAsync from '../utils/catchAsync.js'

const getAll = catchAsync(async (req, res) => {
  const { status, search, page, limit } = req.query
  const data = await offboardingService.getAll({
    status,
    search,
    page: page ? parseInt(page) : undefined,
    limit: limit ? parseInt(limit) : undefined,
  })
  res.json({ success: true, ...data })
})

const getById = catchAsync(async (req, res) => {
  const data = await offboardingService.getById(req.params.id)
  res.json({ success: true, data })
})

const initiate = catchAsync(async (req, res) => {
  const data = await offboardingService.initiate({
    ...req.body,
    initiatedBy: req.user.id,
  })
  res.status(201).json({ success: true, data })
})

const toggleTask = catchAsync(async (req, res) => {
  const data = await offboardingService.toggleTask(req.params.processId, req.params.taskId, {
    completedBy: req.user.id,
  })
  res.json({ success: true, data })
})

const updateTask = catchAsync(async (req, res) => {
  const data = await offboardingService.updateTask(req.params.processId, req.params.taskId, req.body)
  res.json({ success: true, data })
})

const cancel = catchAsync(async (req, res) => {
  const data = await offboardingService.cancel(req.params.id)
  res.json({ success: true, data })
})

export default { getAll, getById, initiate, toggleTask, updateTask, cancel }
