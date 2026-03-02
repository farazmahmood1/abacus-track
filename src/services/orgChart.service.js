import prisma from '../config/prisma.js'

export async function getOrgChart(companyId) {
  const users = await prisma.user.findMany({
    where: {
      banned: { not: true },
      role: { not: 'super_admin' },
      ...(companyId ? { companyId } : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      managerId: true,
      departmentId: true,
      department: { select: { id: true, name: true } },
    },
    orderBy: { name: 'asc' },
  })

  // Build tree structure
  const userMap = new Map()
  users.forEach(u => userMap.set(u.id, { ...u, children: [] }))

  const roots = []
  users.forEach(u => {
    const node = userMap.get(u.id)
    if (u.managerId && userMap.has(u.managerId)) {
      userMap.get(u.managerId).children.push(node)
    } else {
      roots.push(node)
    }
  })

  return roots
}

export async function setManager(userId, managerId, companyId) {
  return prisma.user.update({
    where: { id: userId, ...(companyId ? { companyId } : {}) },
    data: { managerId: managerId || null },
    select: { id: true, name: true, managerId: true },
  })
}
