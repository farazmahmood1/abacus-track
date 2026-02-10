import prisma from '../config/prisma.js'

export async function getOrgChart() {
  const users = await prisma.user.findMany({
    where: { banned: { not: true } },
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

export async function setManager(userId, managerId) {
  return prisma.user.update({
    where: { id: userId },
    data: { managerId: managerId || null },
    select: { id: true, name: true, managerId: true },
  })
}
