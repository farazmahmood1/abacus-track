import * as assetsService from '../services/assets.service.js'
import catchAsync from '../utils/catchAsync.js'

const listAssets = catchAsync(async (req, res) => {
  const { type, condition, available, page, limit } = req.query
  const data = await assetsService.listAssets({
    type, condition, available,
    page: page ? parseInt(page) : undefined,
    limit: limit ? parseInt(limit) : undefined,
  })
  res.json({ success: true, ...data })
})

const createAsset = catchAsync(async (req, res) => {
  const data = await assetsService.createAsset(req.body)
  res.status(201).json({ success: true, data })
})

const updateAsset = catchAsync(async (req, res) => {
  const data = await assetsService.updateAsset(req.params.id, req.body)
  res.json({ success: true, data })
})

const deleteAsset = catchAsync(async (req, res) => {
  await assetsService.deleteAsset(req.params.id)
  res.json({ success: true, message: 'Asset deleted' })
})

const assignAsset = catchAsync(async (req, res) => {
  const { userId, notes } = req.body
  const data = await assetsService.assignAsset(req.params.id, userId, notes)
  res.json({ success: true, data })
})

const returnAsset = catchAsync(async (req, res) => {
  const data = await assetsService.returnAsset(req.params.id)
  res.json({ success: true, ...data })
})

const getMyAssets = catchAsync(async (req, res) => {
  const data = await assetsService.getMyAssets(req.user.id)
  res.json({ success: true, data })
})

const getAssetSummary = catchAsync(async (req, res) => {
  const data = await assetsService.getAssetSummary()
  res.json({ success: true, data })
})

export default { listAssets, createAsset, updateAsset, deleteAsset, assignAsset, returnAsset, getMyAssets, getAssetSummary }
