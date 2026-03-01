import prisma from '../config/prisma.js'

export async function createAuditLog({ actorId, actorRole, action, targetType, targetId, metadata, ipAddress }) {
  return prisma.auditLog.create({
    data: {
      actorId,
      actorRole,
      action,
      targetType,
      targetId,
      metadata,
      ipAddress,
    },
  })
}

export async function listAuditLogs({ page = 1, limit = 50, action, targetType, actorId, startDate, endDate }) {
  const where = {}

  if (action) where.action = { contains: action, mode: 'insensitive' }
  if (targetType) where.targetType = targetType
  if (actorId) where.actorId = actorId
  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate) where.createdAt.gte = new Date(startDate)
    if (endDate) where.createdAt.lte = new Date(endDate)
  }

  const [data, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        actor: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ])

  return { data, total, page, totalPages: Math.ceil(total / limit) }
}
