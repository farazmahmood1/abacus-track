import express from 'express'
import departmentsController from '../controllers/departments.controller.js'
import { requirePermission } from '../middlewares/requirePermission.js'

const router = express.Router()

/**
 * POST /api/departments
 * Create a new department
 */
router.post(
  '/',
  requirePermission('department', 'create'),
  departmentsController.createDepartment
)

/**
 * GET /api/departments
 * Get all departments with filters
 */
router.get(
  '/',
  requirePermission('department', 'read'),
  departmentsController.listDepartments
)

/**
 * GET /api/departments/:id
 * Get a single department
 */
router.get(
  '/:id',
  requirePermission('department', 'read'),
  departmentsController.getDepartment
)

/**
 * PUT /api/departments/:id
 * Update a department
 */
router.put(
  '/:id',
  requirePermission('department', 'edit'),
  departmentsController.updateDepartment
)

/**
 * DELETE /api/departments/:id
 * Delete a department
 */
router.delete(
  '/:id',
  requirePermission('department', 'delete'),
  departmentsController.deleteDepartment
)

/**
 * GET /api/departments/:id/employees
 * Get employees in a department
 */
router.get(
  '/:id/employees',
  requirePermission('department', 'read'),
  departmentsController.getDepartmentEmployees
)

/**
 * POST /api/departments/assign
 * Assign employee to department
 */
router.post(
  '/assign',
  requirePermission('department', 'edit'),
  departmentsController.assignEmployeeToDepartment
)

/**
 * POST /api/departments/unassign
 * Remove employee from department
 */
router.post(
  '/unassign',
  requirePermission('department', 'edit'),
  departmentsController.removeEmployeeFromDepartment
)

export default router
