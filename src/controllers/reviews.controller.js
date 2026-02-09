import * as reviewsService from '../services/reviews.service.js'
import catchAsync from '../utils/catchAsync.js'

const createCycle = catchAsync(async (req, res) => {
  const data = await reviewsService.createCycle(req.body)
  res.status(201).json({ success: true, data })
})

const listCycles = catchAsync(async (req, res) => {
  const data = await reviewsService.listCycles()
  res.json({ success: true, data })
})

const activateCycle = catchAsync(async (req, res) => {
  const data = await reviewsService.activateCycle(req.params.id)
  res.json({ success: true, data })
})

const completeCycle = catchAsync(async (req, res) => {
  const data = await reviewsService.completeCycle(req.params.id)
  res.json({ success: true, data })
})

const createReview = catchAsync(async (req, res) => {
  const data = await reviewsService.createReview(req.body)
  res.status(201).json({ success: true, data })
})

const getMyReviews = catchAsync(async (req, res) => {
  const data = await reviewsService.getMyReviews(req.user.id)
  res.json({ success: true, data })
})

const getReviewsToReview = catchAsync(async (req, res) => {
  const data = await reviewsService.getReviewsToReview(req.user.id)
  res.json({ success: true, data })
})

const getReview = catchAsync(async (req, res) => {
  const data = await reviewsService.getReview(req.params.id)
  res.json({ success: true, data })
})

const submitReview = catchAsync(async (req, res) => {
  const data = await reviewsService.submitReview(req.params.id, req.body)
  res.json({ success: true, message: 'Review submitted', data })
})

const acknowledgeReview = catchAsync(async (req, res) => {
  const data = await reviewsService.acknowledgeReview(req.params.id)
  res.json({ success: true, data })
})

export default { createCycle, listCycles, activateCycle, completeCycle, createReview, getMyReviews, getReviewsToReview, getReview, submitReview, acknowledgeReview }
