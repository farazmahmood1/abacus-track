import prisma from '../config/prisma.js'
import ApiError from '../utils/ApiError.js'

export async function getAll({ type, status, search, page = 1, limit = 15 }) {
  const where = {}
  if (type) where.type = type
  if (status) where.status = status
  if (search) {
    where.user = {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ],
    }
  }

  const [records, total] = await Promise.all([
    prisma.bonusCommission.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
        approver: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.bonusCommission.count({ where }),
  ])
  return { data: records, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } }
}

export async function getMyCompensations(userId, { page = 1, limit = 15 }) {
  const where = { userId }
  const [records, total] = await Promise.all([
    prisma.bonusCommission.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.bonusCommission.count({ where }),
  ])
  return { data: records, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } }
}

export async function getSummary(userId) {
  const where = userId ? { userId } : {}
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [bonuses, commissions, pending, paidThisMonth] = await Promise.all([
    prisma.bonusCommission.aggregate({
      where: { ...where, type: 'BONUS', status: 'PAID' },
      _sum: { amount: true },
    }),
    prisma.bonusCommission.aggregate({
      where: { ...where, type: 'COMMISSION', status: 'PAID' },
      _sum: { amount: true },
    }),
    prisma.bonusCommission.aggregate({
      where: { ...where, status: 'PENDING' },
      _sum: { amount: true },
    }),
    prisma.bonusCommission.aggregate({
      where: { ...where, status: 'PAID', paidAt: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
  ])

  return {
    totalBonuses: bonuses._sum.amount || 0,
    totalCommissions: commissions._sum.amount || 0,
    pendingAmount: pending._sum.amount || 0,
    paidThisMonth: paidThisMonth._sum.amount || 0,
  }
}

export async function create(data) {
  return prisma.bonusCommission.create({
    data: {
      userId: data.userId,
      type: data.type,
      category: data.category,
      amount: parseFloat(data.amount),
      currency: data.currency || 'USD',
      description: data.description,
      payPeriod: data.payPeriod,
    },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
  })
}

export async function updateStatus(id, status, approvedBy) {
  const record = await prisma.bonusCommission.findUnique({ where: { id } })
  if (!record) throw new ApiError(404, 'Compensation record not found')

  const updateData = { status }
  if (status === 'APPROVED') {
    updateData.approvedBy = approvedBy
    updateData.approvedAt = new Date()
  }
  if (status === 'PAID') {
    updateData.paidAt = new Date()
    if (!record.approvedBy) {
      updateData.approvedBy = approvedBy
      updateData.approvedAt = new Date()
    }
  }

  return prisma.bonusCommission.update({
    where: { id },
    data: updateData,
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
  })
}

export async function deleteCompensation(id) {
  const record = await prisma.bonusCommission.findUnique({ where: { id } })
  if (!record) throw new ApiError(404, 'Compensation record not found')
  return prisma.bonusCommission.delete({ where: { id } })
}
