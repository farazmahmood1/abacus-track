import prisma from '../config/prisma.js'
import ApiError from '../utils/ApiError.js'

export async function getAll({ status, category, search, companyId, page = 1, limit = 15 }) {
  const where = {}
  if (companyId) where.user = { companyId }
  if (status) where.status = status
  if (category) where.category = category
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { user: { name: { contains: search, mode: 'insensitive' } } },
    ]
  }

  const [records, total] = await Promise.all([
    prisma.expense.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
        approver: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.expense.count({ where }),
  ])
  return { data: records, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } }
}

export async function getMyExpenses(userId, { status, category, page = 1, limit = 15 }) {
  const where = { userId }
  if (status) where.status = status
  if (category) where.category = category

  const [records, total] = await Promise.all([
    prisma.expense.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.expense.count({ where }),
  ])
  return { data: records, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } }
}

export async function getSummary(userId) {
  const where = userId ? { userId } : {}
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [totalSubmitted, pending, reimbursedThisMonth, rejected] = await Promise.all([
    prisma.expense.aggregate({
      where,
      _sum: { amount: true },
    }),
    prisma.expense.aggregate({
      where: { ...where, status: 'SUBMITTED' },
      _sum: { amount: true },
    }),
    prisma.expense.aggregate({
      where: { ...where, status: 'REIMBURSED', reimbursedAt: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    prisma.expense.count({
      where: { ...where, status: 'REJECTED' },
    }),
  ])

  return {
    totalSubmitted: totalSubmitted._sum.amount || 0,
    pendingApproval: pending._sum.amount || 0,
    reimbursedThisMonth: reimbursedThisMonth._sum.amount || 0,
    rejectedCount: rejected,
  }
}

export async function create(userId, data) {
  return prisma.expense.create({
    data: {
      userId,
      title: data.title,
      description: data.description,
      amount: parseFloat(data.amount),
      currency: data.currency || 'USD',
      category: data.category,
      receiptUrl: data.receiptUrl,
      receiptFileName: data.receiptFileName,
    },
  })
}

export async function updateStatus(id, status, data) {
  const record = await prisma.expense.findUnique({ where: { id } })
  if (!record) throw new ApiError(404, 'Expense not found')

  const updateData = { status }
  if (status === 'APPROVED') {
    updateData.approvedBy = data.approvedBy
    updateData.approvedAt = new Date()
  }
  if (status === 'REJECTED') {
    updateData.rejectionReason = data.rejectionReason
    updateData.approvedBy = data.approvedBy
    updateData.approvedAt = new Date()
  }
  if (status === 'REIMBURSED') {
    updateData.reimbursedAt = new Date()
    if (!record.approvedBy) {
      updateData.approvedBy = data.approvedBy
      updateData.approvedAt = new Date()
    }
  }

  return prisma.expense.update({
    where: { id },
    data: updateData,
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
  })
}

export async function deleteExpense(id, userId) {
  const record = await prisma.expense.findUnique({ where: { id } })
  if (!record) throw new ApiError(404, 'Expense not found')
  if (record.userId !== userId) throw new ApiError(403, 'You can only delete your own expenses')
  if (record.status !== 'SUBMITTED') throw new ApiError(400, 'Can only delete pending expenses')
  return prisma.expense.delete({ where: { id } })
}
