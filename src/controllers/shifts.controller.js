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

// ============================================
// Schedule (Drag-and-Drop)
// ============================================

export const getSchedule = catchAsync(async (req, res) => {
  const data = await shiftsService.getSchedule(req.query.weekStart, req.query.departmentId)
  res.json({ success: true, data })
})

export const createScheduleEntry = catchAsync(async (req, res) => {
  const data = await shiftsService.createScheduleEntry({ ...req.body, createdBy: req.user.id })
  res.status(201).json({ success: true, data })
})

export const bulkCreateScheduleEntries = catchAsync(async (req, res) => {
  const data = await shiftsService.bulkCreateScheduleEntries(req.body.entries, req.user.id)
  res.status(201).json({ success: true, data })
})

export const moveScheduleEntry = catchAsync(async (req, res) => {
  const data = await shiftsService.moveScheduleEntry(req.params.id, req.body)
  res.json({ success: true, data })
})

export const deleteScheduleEntry = catchAsync(async (req, res) => {
  await shiftsService.deleteScheduleEntry(req.params.id)
  res.json({ success: true, message: 'Schedule entry deleted' })
})

// ============================================
// Swap Requests
// ============================================

export const createSwapRequest = catchAsync(async (req, res) => {
  const data = await shiftsService.createSwapRequest({ ...req.body, requesterId: req.user.id })
  res.status(201).json({ success: true, data })
})

export const getSwapRequests = catchAsync(async (req, res) => {
  const result = await shiftsService.getSwapRequests(req.query)
  res.json({ success: true, ...result })
})

export const getMySwapRequests = catchAsync(async (req, res) => {
  const data = await shiftsService.getMySwapRequests(req.user.id)
  res.json({ success: true, data })
})

export const respondToSwapRequest = catchAsync(async (req, res) => {
  const data = await shiftsService.respondToSwapRequest(req.params.id, req.body.status, req.user.id, req.body.adminNote)
  res.json({ success: true, data })
})

// ============================================
// Conflict Detection
// ============================================

export const checkConflicts = catchAsync(async (req, res) => {
  const data = await shiftsService.checkConflicts(req.query.weekStart)
  res.json({ success: true, data })
})

// ============================================
// Availability
// ============================================

export const getMyAvailability = catchAsync(async (req, res) => {
  const data = await shiftsService.getMyAvailability(req.user.id)
  res.json({ success: true, data })
})

export const updateMyAvailability = catchAsync(async (req, res) => {
  const data = await shiftsService.updateMyAvailability(req.user.id, req.body.slots)
  res.json({ success: true, data })
})

export const getEmployeeAvailability = catchAsync(async (req, res) => {
  const data = await shiftsService.getEmployeeAvailability(req.params.employeeId)
  res.json({ success: true, data })
})

export const getDepartmentAvailability = catchAsync(async (req, res) => {
  const data = await shiftsService.getDepartmentAvailability(req.params.departmentId)
  res.json({ success: true, data })
})

// ============================================
// Shift Settings
// ============================================

export const getShiftSettings = catchAsync(async (req, res) => {
  const data = await shiftsService.getShiftSettings()
  res.json({ success: true, data })
})

export const updateShiftSettings = catchAsync(async (req, res) => {
  const data = await shiftsService.updateShiftSettings(req.body)
  res.json({ success: true, data })
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
  getSchedule,
  createScheduleEntry,
  bulkCreateScheduleEntries,
  moveScheduleEntry,
  deleteScheduleEntry,
  createSwapRequest,
  getSwapRequests,
  getMySwapRequests,
  respondToSwapRequest,
  checkConflicts,
  getMyAvailability,
  updateMyAvailability,
  getEmployeeAvailability,
  getDepartmentAvailability,
  getShiftSettings,
  updateShiftSettings,
}
