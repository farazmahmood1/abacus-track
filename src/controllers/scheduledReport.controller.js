import * as scheduledReportService from '../services/scheduledReport.service.js'
import catchAsync from '../utils/catchAsync.js'

const create = catchAsync(async (req, res) => {
  const data = await scheduledReportService.createScheduledReport(req.user.id, req.body)
  res.status(201).json({ success: true, data })
})

const getAll = catchAsync(async (req, res) => {
  const { page, limit } = req.query
  const result = await scheduledReportService.getScheduledReports(
    page ? parseInt(page) : undefined,
    limit ? parseInt(limit) : undefined,
  )
  res.json({ success: true, ...result })
})

const getOne = catchAsync(async (req, res) => {
  const data = await scheduledReportService.getScheduledReport(req.params.id)
  res.json({ success: true, data })
})

const update = catchAsync(async (req, res) => {
  const data = await scheduledReportService.updateScheduledReport(req.params.id, req.body)
  res.json({ success: true, data })
})

const remove = catchAsync(async (req, res) => {
  await scheduledReportService.deleteScheduledReport(req.params.id)
  res.json({ success: true, message: 'Scheduled report deleted' })
})

const toggle = catchAsync(async (req, res) => {
  const data = await scheduledReportService.toggleActive(req.params.id)
  res.json({ success: true, data })
})

export default { create, getAll, getOne, update, remove, toggle }
