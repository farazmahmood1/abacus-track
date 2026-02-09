import * as timesheetSubmissionService from '../services/timesheetSubmission.service.js'
import catchAsync from '../utils/catchAsync.js'
import { submitTimesheet as submitSchema, approveTimesheet as approveSchema } from '../validations/timesheetSubmission.js'

const getCurrentWeekData = catchAsync(async (req, res) => {
  const { weekStart } = req.query
  if (!weekStart) {
    return res.status(400).json({ success: false, message: 'weekStart query parameter is required' })
  }
  const result = await timesheetSubmissionService.getCurrentWeekData(req.user.id, weekStart)
  res.json({ success: true, data: result })
})

const submitTimesheet = catchAsync(async (req, res) => {
  const data = submitSchema.parse(req.body)
  const result = await timesheetSubmissionService.submitTimesheet(req.user.id, data)
  res.status(201).json({ success: true, message: 'Timesheet submitted for approval', data: result })
})

const getMySubmissions = catchAsync(async (req, res) => {
  const { page, limit, status } = req.query
  const result = await timesheetSubmissionService.getMySubmissions(req.user.id, {
    page: page ? parseInt(page) : undefined,
    limit: limit ? parseInt(limit) : undefined,
    status,
  })
  res.json({ success: true, ...result })
})

const listSubmissions = catchAsync(async (req, res) => {
  const { userId, status, startDate, endDate, page, limit } = req.query
  const result = await timesheetSubmissionService.listSubmissions({
    userId,
    status,
    startDate,
    endDate,
    page: page ? parseInt(page) : undefined,
    limit: limit ? parseInt(limit) : undefined,
  })
  res.json({ success: true, ...result })
})

const getSubmission = catchAsync(async (req, res) => {
  const result = await timesheetSubmissionService.getSubmission(req.params.id)
  res.json({ success: true, data: result })
})

const approveSubmission = catchAsync(async (req, res) => {
  const data = approveSchema.parse(req.body)
  const result = await timesheetSubmissionService.approveSubmission(req.params.id, req.user.id, data)
  res.json({ success: true, message: `Timesheet ${data.status.toLowerCase()}`, data: result })
})

export default {
  getCurrentWeekData,
  submitTimesheet,
  getMySubmissions,
  listSubmissions,
  getSubmission,
  approveSubmission,
}
