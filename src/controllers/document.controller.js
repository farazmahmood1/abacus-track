import * as documentService from '../services/document.service.js'
import catchAsync from '../utils/catchAsync.js'

const getAll = catchAsync(async (req, res) => {
  const result = await documentService.getAll(req.query)
  res.json({ success: true, ...result })
})

const getById = catchAsync(async (req, res) => {
  const data = await documentService.getById(req.params.id)
  res.json({ success: true, data })
})

const create = catchAsync(async (req, res) => {
  const file = req.file
  if (!file) return res.status(400).json({ success: false, message: 'File is required' })

  const data = await documentService.create({
    ...req.body,
    filePath: file.path || file.location,
    fileName: file.originalname,
    fileSize: file.size,
    mimeType: file.mimetype,
    uploadedBy: req.user.id,
    requiresAcknowledgment: req.body.requiresAcknowledgment === 'true',
  })
  res.status(201).json({ success: true, data })
})

const update = catchAsync(async (req, res) => {
  const updateData = { ...req.body }
  if (req.file) {
    updateData.filePath = req.file.path || req.file.location
    updateData.fileName = req.file.originalname
    updateData.fileSize = req.file.size
    updateData.mimeType = req.file.mimetype
  }
  if (updateData.requiresAcknowledgment !== undefined) {
    updateData.requiresAcknowledgment = updateData.requiresAcknowledgment === 'true'
  }
  const data = await documentService.updateDocument(req.params.id, updateData)
  res.json({ success: true, data })
})

const remove = catchAsync(async (req, res) => {
  await documentService.deleteDocument(req.params.id)
  res.json({ success: true, message: 'Document deleted' })
})

const acknowledge = catchAsync(async (req, res) => {
  const data = await documentService.acknowledge(req.params.id, req.user.id)
  res.json({ success: true, data })
})

const getAcknowledgments = catchAsync(async (req, res) => {
  const data = await documentService.getAcknowledgments(req.params.id)
  res.json({ success: true, data })
})

export default { getAll, getById, create, update, remove, acknowledge, getAcknowledgments }
