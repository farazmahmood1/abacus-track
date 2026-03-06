import * as expenseService from '../services/expense.service.js'
import catchAsync from '../utils/catchAsync.js'

const getAll = catchAsync(async (req, res) => {
  const { status, category, search, page, limit } = req.query
  const data = await expenseService.getAll({
    status,
    category,
    search,
    companyId: req.user.companyId,
    page: page ? parseInt(page) : undefined,
    limit: limit ? parseInt(limit) : undefined,
  })
  res.json({ success: true, ...data })
})

const getMyExpenses = catchAsync(async (req, res) => {
  const { status, category, page, limit } = req.query
  const data = await expenseService.getMyExpenses(req.user.id, {
    status,
    category,
    page: page ? parseInt(page) : undefined,
    limit: limit ? parseInt(limit) : undefined,
  })
  res.json({ success: true, ...data })
})

const getSummary = catchAsync(async (req, res) => {
  const data = await expenseService.getSummary()
  res.json({ success: true, data })
})

const getMySummary = catchAsync(async (req, res) => {
  const data = await expenseService.getSummary(req.user.id)
  res.json({ success: true, data })
})

const create = catchAsync(async (req, res) => {
  const receiptUrl = req.file ? `/uploads/${req.file.filename}` : req.body.receiptUrl
  const receiptFileName = req.file ? req.file.originalname : req.body.receiptFileName
  const data = await expenseService.create(req.user.id, {
    ...req.body,
    receiptUrl,
    receiptFileName,
  })
  res.status(201).json({ success: true, data })
})

const updateStatus = catchAsync(async (req, res) => {
  const data = await expenseService.updateStatus(req.params.id, req.body.status, {
    approvedBy: req.user.id,
    rejectionReason: req.body.rejectionReason,
  })
  res.json({ success: true, data })
})

const remove = catchAsync(async (req, res) => {
  await expenseService.deleteExpense(req.params.id, req.user.id)
  res.json({ success: true, data: { message: 'Expense deleted' } })
})

export default { getAll, getMyExpenses, getSummary, getMySummary, create, updateStatus, remove }
