import * as departmentsService from '../services/departments.service.js'
import catchAsync from '../utils/catchAsync.js'

/**
 * Create a new department
 */
export const createDepartment = catchAsync(async (req, res) => {
  const department = await departmentsService.create({
    ...req.body,
    companyId: req.user.companyId,
  })

  res.status(201).json({
    success: true,
    message: 'Department created successfully',
    data: department,
  })
})

/**
 * Get all departments
 */
export const listDepartments = catchAsync(async (req, res) => {
  const { search, page = '1', limit = '10' } = req.query

  const result = await departmentsService.list({
    search,
    page: parseInt(page),
    limit: parseInt(limit),
    companyId: req.user.companyId,
  })

  res.json(result)
})

/**
 * Get a single department
 */
export const getDepartment = catchAsync(async (req, res) => {
  const { id } = req.params
  const department = await departmentsService.getById(id)

  res.json({
    success: true,
    data: department,
  })
})

/**
 * Update a department
 */
export const updateDepartment = catchAsync(async (req, res) => {
  const { id } = req.params
  const department = await departmentsService.update(id, req.body)

  res.json({
    success: true,
    message: 'Department updated successfully',
    data: department,
  })
})

/**
 * Delete a department
 */
export const deleteDepartment = catchAsync(async (req, res) => {
  const { id } = req.params
  await departmentsService.remove(id)

  res.json({
    success: true,
    message: 'Department deleted successfully',
  })
})

/**
 * Assign employee to department
 */
export const assignEmployeeToDepartment = catchAsync(async (req, res) => {
  const { employeeId, departmentId } = req.body
  const user = await departmentsService.assignEmployee(employeeId, departmentId)

  res.json({
    success: true,
    message: 'Employee assigned to department',
    data: user,
  })
})

/**
 * Remove employee from department
 */
export const removeEmployeeFromDepartment = catchAsync(async (req, res) => {
  const { employeeId } = req.body
  const user = await departmentsService.unassignEmployee(employeeId)

  res.json({
    success: true,
    message: 'Employee removed from department',
    data: user,
  })
})

/**
 * Get department employees
 */
export const getDepartmentEmployees = catchAsync(async (req, res) => {
  const { id } = req.params
  const result = await departmentsService.getDepartmentEmployees(id)

  res.json({
    success: true,
    data: result,
  })
})

export default {
  createDepartment,
  listDepartments,
  getDepartment,
  updateDepartment,
  deleteDepartment,
  assignEmployeeToDepartment,
  removeEmployeeFromDepartment,
  getDepartmentEmployees,
}
