import prisma from '../config/prisma.js'
import ApiError from '../utils/ApiError.js'

export async function submitStandup(userId, data) {
  const dateOnly = new Date(new Date(data.date).toISOString().split('T')[0])

  return prisma.standupReport.upsert({
    where: { userId_date: { userId, date: dateOnly } },
    create: {
      userId,
      date: dateOnly,
      yesterday: data.yesterday,
      today: data.today,
      blockers: data.blockers || null,
    },
    update: {
      yesterday: data.yesterday,
      today: data.today,
      blockers: data.blockers || null,
    },
    include: { user: { select: { id: true, name: true, image: true } } },
  })
}

export async function getMyStandups(userId, { page = 1, limit = 14 }) {
  const [records, total] = await Promise.all([
    prisma.standupReport.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.standupReport.count({ where: { userId } }),
  ])
  return { data: records, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } }
}

export async function getTodayStandup(userId) {
  const today = new Date(new Date().toISOString().split('T')[0])
  return prisma.standupReport.findUnique({
    where: { userId_date: { userId, date: today } },
  })
}

export async function listStandups({ date, userId, departmentId, companyId, page = 1, limit = 20 }) {
  const where = {}
  if (date) where.date = new Date(new Date(date).toISOString().split('T')[0])
  if (userId) where.userId = userId

  // Scope to company and exclude super_admin
  const userFilter = { role: { not: 'super_admin' } }
  if (companyId) userFilter.companyId = companyId
  if (departmentId) userFilter.departmentId = departmentId
  where.user = userFilter

  const [records, total] = await Promise.all([
    prisma.standupReport.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true, image: true, departmentId: true } } },
      orderBy: { date: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.standupReport.count({ where }),
  ])
  return { data: records, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } }
}

export async function getMissingStandups(companyId) {
  const today = new Date(new Date().toISOString().split('T')[0])

  const allUsers = await prisma.user.findMany({
    where: { role: 'employee', banned: { not: true }, ...(companyId ? { companyId } : {}) },
    select: { id: true, name: true, email: true, image: true, departmentId: true },
  })

  const submitted = await prisma.standupReport.findMany({
    where: { date: today },
    select: { userId: true },
  })

  const submittedIds = new Set(submitted.map(s => s.userId))
  return allUsers.filter(u => !submittedIds.has(u.id))
}
