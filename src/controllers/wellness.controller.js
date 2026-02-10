import * as wellnessService from '../services/wellness.service.js'
import catchAsync from '../utils/catchAsync.js'

const create = catchAsync(async (req, res) => {
  const data = await wellnessService.createChallenge(req.user.id, req.body)
  res.status(201).json({ success: true, data })
})

const getAll = catchAsync(async (req, res) => {
  const { status } = req.query
  const data = await wellnessService.getChallenges({ status })
  res.json({ success: true, data })
})

const getOne = catchAsync(async (req, res) => {
  const data = await wellnessService.getChallenge(req.params.id)
  res.json({ success: true, data })
})

const update = catchAsync(async (req, res) => {
  const data = await wellnessService.updateChallenge(req.params.id, req.body)
  res.json({ success: true, data })
})

const remove = catchAsync(async (req, res) => {
  await wellnessService.deleteChallenge(req.params.id)
  res.json({ success: true, data: null })
})

const join = catchAsync(async (req, res) => {
  const data = await wellnessService.joinChallenge(req.params.id, req.user.id)
  res.status(201).json({ success: true, data })
})

const updateProgress = catchAsync(async (req, res) => {
  const data = await wellnessService.updateProgress(req.params.id, req.user.id, req.body.progress)
  res.json({ success: true, data })
})

const getLeaderboard = catchAsync(async (req, res) => {
  const data = await wellnessService.getChallengeLeaderboard(req.params.id)
  res.json({ success: true, data })
})

const getActive = catchAsync(async (req, res) => {
  const data = await wellnessService.getActiveChallenges()
  res.json({ success: true, data })
})

const getMyChallenges = catchAsync(async (req, res) => {
  const data = await wellnessService.getMyChallenges(req.user.id)
  res.json({ success: true, data })
})

export default { create, getAll, getOne, update, remove, join, updateProgress, getLeaderboard, getActive, getMyChallenges }
