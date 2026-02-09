import * as feedbackService from '../services/feedback.service.js'
import catchAsync from '../utils/catchAsync.js'

const submitFeedback = catchAsync(async (req, res) => {
  const data = await feedbackService.submitFeedback(req.user.id, req.body)
  res.status(201).json({ success: true, data })
})

const getMyFeedback = catchAsync(async (req, res) => {
  const { page, limit } = req.query
  const data = await feedbackService.getMyFeedback(req.user.id, {
    page: page ? parseInt(page) : undefined,
    limit: limit ? parseInt(limit) : undefined,
  })
  res.json({ success: true, ...data })
})

const listFeedback = catchAsync(async (req, res) => {
  const { status, category, page, limit } = req.query
  const data = await feedbackService.listFeedback({
    status, category,
    page: page ? parseInt(page) : undefined,
    limit: limit ? parseInt(limit) : undefined,
  })
  res.json({ success: true, ...data })
})

const updateStatus = catchAsync(async (req, res) => {
  const data = await feedbackService.updateFeedbackStatus(req.params.id, req.body.status)
  res.json({ success: true, data })
})

const reply = catchAsync(async (req, res) => {
  const data = await feedbackService.replyToFeedback(req.params.id, req.user.id, req.body.adminReply)
  res.json({ success: true, data })
})

export default { submitFeedback, getMyFeedback, listFeedback, updateStatus, reply }
