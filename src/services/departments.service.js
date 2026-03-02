import prisma from '../config/prisma.js'
import ApiError from '../utils/ApiError.js'

const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 10

/**
 * Create a new department
 */
export async function create({ name, description, companyId }) {
  // Check if department already exists within this company
  const existingDept = await prisma.department.findFirst({
    where: { name, companyId },
  })

  if (existingDept) {
    throw new ApiError(400, 'Department with this name already exists')
  }

  return prisma.department.create({
    data: {
      name,
      description,
      companyId,
    },
  })
}

/**
 * Get all departments with optional filters
 */
export async function list({ search, page = DEFAULT_PAGE, limit = DEFAULT_LIMIT, companyId }) {
  page = Number(page) || DEFAULT_PAGE
  limit = Math.min(Number(limit) || DEFAULT_LIMIT, 100)

  const where = {}

  if (companyId) {
    where.companyId = companyId
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ]
  }

  const skip = (page - 1) * limit

  const [departments, total] = await Promise.all([
    prisma.department.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { employees: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.department.count({ where }),
  ])

  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data: departments.map(dept => ({
      id: dept.id,
      name: dept.name,
      description: dept.description,
      createdAt: dept.createdAt,
      updatedAt: dept.updatedAt,
      userCount: dept._count.employees,
    })),
  }
}

/**
 * Get a single department by ID
 */
export async function getById(departmentId) {
  const department = await prisma.department.findUnique({
    where: { id: departmentId },
    select: {
      id: true,
      name: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      employees: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      announcements: {
        select: {
          id: true,
          title: true,
          createdAt: true,
        },
      },
      _count: {
        select: {
          employees: true,
          announcements: true,
        },
      },
    },
  })

  if (!department) {
    throw new ApiError(404, 'Department not found')
  }

  return {
    id: department.id,
    name: department.name,
    description: department.description,
    createdAt: department.createdAt,
    updatedAt: department.updatedAt,
    employees: department.employees,
    announcements: department.announcements,
    userCount: department._count.employees,
    employeeCount: department._count.employees,
    announcementsCount: department._count.announcements,
  }
}

/**
 * Update a department
 */
export async function update(departmentId, { name, description }) {
  const department = await prisma.department.findUnique({
    where: { id: departmentId },
  })

  if (!department) {
    throw new ApiError(404, 'Department not found')
  }

  // Check if new name is unique (if name is being changed)
  if (name && name !== department.name) {
    const existing = await prisma.department.findUnique({
      where: { name },
    })
    if (existing) {
      throw new ApiError(400, 'Department with this name already exists')
    }
  }

  return prisma.department.update({
    where: { id: departmentId },
    data: {
      ...(name && { name }),
      ...(description !== undefined && { description }),
    },
    select: {
      id: true,
      name: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: { employees: true },
      },
    },
  })
}

/**
 * Delete a department
 */
export async function remove(departmentId) {
  const department = await prisma.department.findUnique({
    where: { id: departmentId },
    include: { employees: true },
  })

  if (!department) {
    throw new ApiError(404, 'Department not found')
  }

  if (department.employees.length > 0) {
    throw new ApiError(400, 'Cannot delete department with assigned employees')
  }

  return prisma.department.delete({
    where: { id: departmentId },
  })
}

/**
 * Assign employee to department
 */
export async function assignEmployee(employeeId, departmentId) {
  const employee = await prisma.user.findUnique({
    where: { id: employeeId },
  })

  if (!employee) {
    throw new ApiError(404, 'Employee not found')
  }

  const department = await prisma.department.findUnique({
    where: { id: departmentId },
  })

  if (!department) {
    throw new ApiError(404, 'Department not found')
  }

  return prisma.user.update({
    where: { id: employeeId },
    data: { departmentId },
  })
}

/**
 * Remove employee from department
 */
export async function unassignEmployee(employeeId) {
  const employee = await prisma.user.findUnique({
    where: { id: employeeId },
  })

  if (!employee) {
    throw new ApiError(404, 'Employee not found')
  }

  return prisma.user.update({
    where: { id: employeeId },
    data: { departmentId: null },
  })
}

/**
 * Get department with employees
 */
export async function getDepartmentEmployees(departmentId) {
  const department = await prisma.department.findUnique({
    where: { id: departmentId },
    include: {
      employees: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          image: true,
        },
      },
    },
  })

  if (!department) {
    throw new ApiError(404, 'Department not found')
  }

  return {
    id: department.id,
    name: department.name,
    description: department.description,
    employees: department.employees,
    employeeCount: department.employees.length,
  }
}
