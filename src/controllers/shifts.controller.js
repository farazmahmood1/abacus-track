import * as shiftsService from '../services/shifts.service.js'
import catchAsync from '../utils/catchAsync.js'

/**
 * List all shifts
 */
export const listShifts = catchAsync(async (req, res) => {
  const shifts = await shiftsService.listShifts()

  res.json({
    success: true,
    data: shifts,
  })
})

/**
 * Get a single shift
 */
export const getShift = catchAsync(async (req, res) => {
  const shift = await shiftsService.getShiftById(req.params.id)

  res.json({
    success: true,
    data: shift,
  })
})

/**
 * Create a new shift
 */
export const createShift = catchAsync(async (req, res) => {
  const shift = await shiftsService.createShift(req.body)

  res.status(201).json({
    success: true,
    message: 'Shift created successfully',
    data: shift,
  })
})

/**
 * Update a shift
 */
export const updateShift = catchAsync(async (req, res) => {
  const shift = await shiftsService.updateShift(req.params.id, req.body)

  res.json({
    success: true,
    message: 'Shift updated successfully',
    data: shift,
  })
})

/**
 * Delete a shift
 */
export const deleteShift = catchAsync(async (req, res) => {
  await shiftsService.deleteShift(req.params.id)

  res.json({
    success: true,
    message: 'Shift deleted successfully',
  })
})

/**
 * Assign employee to shift
 */
export const assignEmployee = catchAsync(async (req, res) => {
  const assignment = await shiftsService.assignEmployeeToShift(req.body)

  res.status(201).json({
    success: true,
    message: 'Employee assigned to shift successfully',
    data: assignment,
  })
})

/**
 * Unassign employee from shift
 */
export const unassignEmployee = catchAsync(async (req, res) => {
  const result = await shiftsService.unassignEmployeeFromShift(req.body)

  res.json({
    success: true,
    message: 'Employee unassigned from shift successfully',
    data: result,
  })
})

/**
 * Get current user's active shift
 */
export const getMyShift = catchAsync(async (req, res) => {
  const shift = await shiftsService.getMyShift(req.user.id)

  res.json({
    success: true,
    data: shift,
  })
})

/**
 * Get employees in a shift
 */
export const getShiftEmployees = catchAsync(async (req, res) => {
  const employees = await shiftsService.getShiftEmployees(req.params.id)

  res.json({
    success: true,
    data: employees,
  })
})

export default {
  listShifts,
  getShift,
  createShift,
  updateShift,
  deleteShift,
  assignEmployee,
  unassignEmployee,
  getMyShift,
  getShiftEmployees,
}
