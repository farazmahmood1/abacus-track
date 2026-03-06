import prisma from '../config/prisma.js'

/**
 * List employees scoped to a company
 */
export async function listEmployees(companyId, { page = 1, limit = 8, search, departmentId, role, sortBy = 'createdAt', sortDirection = 'desc' }) {
  const where = {
    companyId,
    role: { not: 'super_admin' },
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ]
  }

  if (departmentId) {
    where.departmentId = departmentId
  }

  if (role) {
    where.role = role
  }

  const orderBy = { [sortBy]: sortDirection }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        uniqueId: true,
        name: true,
        email: true,
        image: true,
        role: true,
        departmentId: true,
        department: { select: { id: true, name: true } },
        createdAt: true,
        salary: true,
        githubUrl: true,
        linkedinUrl: true,
        banned: true,
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ])

  return {
    users,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}
