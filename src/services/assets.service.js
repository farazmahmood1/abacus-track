import prisma from '../config/prisma.js'
import ApiError from '../utils/ApiError.js'

export async function listAssets({ type, condition, available, page = 1, limit = 20 }) {
  const where = {}
  if (type) where.type = type
  if (condition) where.condition = condition
  if (available !== undefined) where.isAvailable = available === 'true'

  const [records, total] = await Promise.all([
    prisma.asset.findMany({
      where,
      include: {
        assignments: {
          where: { returnedAt: null },
          include: { user: { select: { id: true, name: true, email: true, image: true } } },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.asset.count({ where }),
  ])

  return { data: records, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } }
}

export async function createAsset(data) {
  return prisma.asset.create({ data })
}

export async function updateAsset(id, data) {
  return prisma.asset.update({ where: { id }, data })
}

export async function deleteAsset(id) {
  return prisma.asset.delete({ where: { id } })
}

export async function assignAsset(assetId, userId, notes) {
  const asset = await prisma.asset.findUnique({ where: { id: assetId } })
  if (!asset) throw new ApiError(404, 'Asset not found')
  if (!asset.isAvailable) throw new ApiError(400, 'Asset is not available')

  const [assignment] = await prisma.$transaction([
    prisma.assetAssignment.create({
      data: { assetId, userId, notes },
      include: { user: { select: { id: true, name: true } }, asset: true },
    }),
    prisma.asset.update({ where: { id: assetId }, data: { isAvailable: false } }),
  ])

  return assignment
}

export async function returnAsset(assetId) {
  const assignment = await prisma.assetAssignment.findFirst({
    where: { assetId, returnedAt: null },
  })
  if (!assignment) throw new ApiError(400, 'No active assignment for this asset')

  await prisma.$transaction([
    prisma.assetAssignment.update({
      where: { id: assignment.id },
      data: { returnedAt: new Date() },
    }),
    prisma.asset.update({ where: { id: assetId }, data: { isAvailable: true } }),
  ])

  return { message: 'Asset returned' }
}

export async function getMyAssets(userId) {
  return prisma.assetAssignment.findMany({
    where: { userId, returnedAt: null },
    include: { asset: true },
    orderBy: { assignedAt: 'desc' },
  })
}

export async function getAssetSummary() {
  const [total, available, assigned] = await Promise.all([
    prisma.asset.count(),
    prisma.asset.count({ where: { isAvailable: true } }),
    prisma.asset.count({ where: { isAvailable: false } }),
  ])
  return { total, available, assigned }
}
