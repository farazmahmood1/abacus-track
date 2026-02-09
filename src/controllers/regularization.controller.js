import * as regularizationService from '../services/regularization.service.js'
import catchAsync from '../utils/catchAsync.js'
import { createRegularization as createSchema, approveRegularization as approveSchema } from '../validations/regularization.js'

const submitRequest = catchAsync(async (req, res) => {
  const data = createSchema.parse(req.body)
  const result = await regularizationService.createRegularization(req.user.id, data)
  res.status(201).json({ success: true, message: 'Regularization request submitted', data: result })
})

const getMyRequests = catchAsync(async (req, res) => {
  const { page, limit, status } = req.query
  const result = await regularizationService.getMyRequests(req.user.id, {
    page: page ? parseInt(page) : undefined,
    limit: limit ? parseInt(limit) : undefined,
    status,
  })
  res.json({ success: true, ...result })
})

const listRegularizations = catchAsync(async (req, res) => {
  const { userId, status, startDate, endDate, page, limit } = req.query
  const result = await regularizationService.listRegularizations({
    userId,
    status,
    startDate,
    endDate,
    page: page ? parseInt(page) : undefined,
    limit: limit ? parseInt(limit) : undefined,
  })
  res.json({ success: true, ...result })
})

const approveRegularization = catchAsync(async (req, res) => {
  const data = approveSchema.parse(req.body)
  const result = await regularizationService.approveRegularization(req.params.id, req.user.id, data)
  res.json({ success: true, message: `Regularization ${data.status.toLowerCase()}`, data: result })
})

export default { submitRequest, getMyRequests, listRegularizations, approveRegularization }
