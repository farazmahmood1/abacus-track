import * as employeesService from '../services/employees.service.js'
import catchAsync from '../utils/catchAsync.js'

export const listEmployees = catchAsync(async (req, res) => {
  const { page, limit, search, departmentId, role, sortBy, sortDirection } = req.query

  const result = await employeesService.listEmployees(req.user.companyId, {
    page: page ? parseInt(page) : undefined,
    limit: limit ? parseInt(limit) : undefined,
    search,
    departmentId,
    role,
    sortBy,
    sortDirection,
  })

  res.json({ success: true, ...result })
})

export default { listEmployees }
