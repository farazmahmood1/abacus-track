import * as deviationsService from '../services/deviations.service.js'
import catchAsync from '../utils/catchAsync.js'

export const listDeviations = catchAsync(async (req, res) => {
  const { userId, startDate, endDate, page, limit } = req.query
  const result = await deviationsService.listDeviations({
    userId,
    startDate,
    endDate,
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20,
  })
  res.json({ success: true, ...result })
})

export const getMyDeviations = catchAsync(async (req, res) => {
  const { startDate, endDate, page, limit } = req.query
  const result = await deviationsService.getMyDeviations(req.user.id, {
    startDate,
    endDate,
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20,
  })
  res.json({ success: true, ...result })
})

export const excuseDeviation = catchAsync(async (req, res) => {
  const { excuseReason } = req.body
  const deviation = await deviationsService.excuseDeviation(req.params.id, excuseReason)
  res.json({ success: true, message: 'Deviation marked as excused', data: deviation })
})

export const getSummary = catchAsync(async (req, res) => {
  const { startDate, endDate } = req.query
  const summary = await deviationsService.getDeviationSummary({ startDate, endDate })
  res.json({ success: true, data: summary })
})

export default {
  listDeviations,
  getMyDeviations,
  excuseDeviation,
  getSummary,
}
