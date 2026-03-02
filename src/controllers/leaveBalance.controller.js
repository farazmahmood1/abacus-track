import * as leaveBalanceService from '../services/leaveBalance.service.js'
import catchAsync from '../utils/catchAsync.js'

/**
 * Get leave policies
 */
export const listPolicies = catchAsync(async (req, res) => {
  const policies = await leaveBalanceService.listPolicies(req.user.companyId)

  res.json({
    success: true,
    data: policies,
  })
})

/**
 * Create or update a leave policy
 */
export const upsertPolicy = catchAsync(async (req, res) => {
  const policy = await leaveBalanceService.upsertPolicy({
    ...req.body,
    companyId: req.user.companyId,
  })

  res.json({
    success: true,
    message: 'Leave policy saved successfully',
    data: policy,
  })
})

/**
 * Get current user's leave balances
 */
export const getMyBalances = catchAsync(async (req, res) => {
  const year = req.query.year ? parseInt(req.query.year) : undefined
  const balances = await leaveBalanceService.getUserBalances(req.user.id, year)

  res.json({
    success: true,
    data: balances,
  })
})

/**
 * Get a specific user's leave balances (admin)
 */
export const getUserBalances = catchAsync(async (req, res) => {
  const year = req.query.year ? parseInt(req.query.year) : undefined
  const balances = await leaveBalanceService.getUserBalances(req.params.userId, year)

  res.json({
    success: true,
    data: balances,
  })
})

/**
 * Get all employees' balances (admin)
 */
export const getAllBalances = catchAsync(async (req, res) => {
  const year = req.query.year ? parseInt(req.query.year) : undefined
  const page = parseInt(req.query.page) || 1
  const limit = parseInt(req.query.limit) || 20

  const result = await leaveBalanceService.getAllBalances(year, { page, limit })

  res.json({
    success: true,
    ...result,
  })
})

/**
 * Initialize yearly balances for all employees
 */
export const initializeBalances = catchAsync(async (req, res) => {
  const { year } = req.body
  const result = await leaveBalanceService.initializeYearlyBalances(year)

  res.json({
    success: true,
    message: `Initialized ${result.initialized} balance records for ${result.employees} employees across ${result.policies} leave types`,
    data: result,
  })
})

/**
 * Manually adjust a leave balance
 */
export const adjustBalance = catchAsync(async (req, res) => {
  const balance = await leaveBalanceService.adjustBalance(req.params.id, req.body)

  res.json({
    success: true,
    message: 'Leave balance adjusted successfully',
    data: balance,
  })
})

export default {
  listPolicies,
  upsertPolicy,
  getMyBalances,
  getUserBalances,
  getAllBalances,
  initializeBalances,
  adjustBalance,
}
