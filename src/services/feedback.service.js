import prisma from '../config/prisma.js'
import ApiError from '../utils/ApiError.js'

export async function submitFeedback(userId, data) {
  return prisma.feedback.create({
    data: {
      userId: data.isAnonymous ? null : userId,
      category: data.category,
      title: data.title,
      message: data.message,
      isAnonymous: data.isAnonymous || false,
    },
  })
}

export async function getMyFeedback(userId, { page = 1, limit = 10 }) {
  const where = { userId, isAnonymous: false }
  const [records, total] = await Promise.all([
    prisma.feedback.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.feedback.count({ where }),
  ])
  return { data: records, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } }
}

export async function listFeedback({ status, category, companyId, page = 1, limit = 15 }) {
  const where = {}
  if (companyId) where.user = { companyId }
  if (status) where.status = status
  if (category) where.category = category

  const [records, total] = await Promise.all([
    prisma.feedback.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.feedback.count({ where }),
  ])
  return { data: records, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } }
}

export async function updateFeedbackStatus(id, status) {
  return prisma.feedback.update({ where: { id }, data: { status } })
}

export async function replyToFeedback(id, repliedBy, adminReply) {
  return prisma.feedback.update({
    where: { id },
    data: { adminReply, repliedBy, repliedAt: new Date(), status: 'REVIEWED' },
  })
}
