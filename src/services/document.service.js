import prisma from '../config/prisma.js'
import ApiError from '../utils/ApiError.js'

export async function getAll(filters = {}) {
  const { category, search, page = 1, limit = 10 } = filters
  const skip = (Number(page) - 1) * Number(limit)
  const take = Number(limit)
  const where = { isActive: true }

  if (category) where.category = category
  if (search) where.title = { contains: search, mode: 'insensitive' }

  const [data, total] = await Promise.all([
    prisma.document.findMany({
      where,
      include: {
        uploader: { select: { id: true, name: true, image: true } },
        acknowledgments: { select: { userId: true, acknowledgedAt: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.document.count({ where }),
  ])

  return { data, meta: { page: Number(page), total, totalPages: Math.ceil(total / take) } }
}

export async function getById(id) {
  const doc = await prisma.document.findUnique({
    where: { id },
    include: {
      uploader: { select: { id: true, name: true, image: true } },
      acknowledgments: {
        include: { user: { select: { id: true, name: true, image: true } } },
        orderBy: { acknowledgedAt: 'desc' },
      },
    },
  })
  if (!doc) throw new ApiError(404, 'Document not found')
  return doc
}

export async function create(data) {
  return prisma.document.create({
    data: {
      title: data.title,
      description: data.description || null,
      category: data.category,
      filePath: data.filePath,
      fileName: data.fileName,
      fileSize: data.fileSize,
      mimeType: data.mimeType,
      requiresAcknowledgment: data.requiresAcknowledgment || false,
      uploadedBy: data.uploadedBy,
    },
  })
}

export async function updateDocument(id, data) {
  const doc = await prisma.document.findUnique({ where: { id } })
  if (!doc) throw new ApiError(404, 'Document not found')

  const updateData = {}
  if (data.title) updateData.title = data.title
  if (data.description !== undefined) updateData.description = data.description
  if (data.category) updateData.category = data.category
  if (data.requiresAcknowledgment !== undefined)
    updateData.requiresAcknowledgment = data.requiresAcknowledgment
  if (data.filePath) {
    updateData.filePath = data.filePath
    updateData.fileName = data.fileName
    updateData.fileSize = data.fileSize
    updateData.mimeType = data.mimeType
    updateData.version = doc.version + 1
  }

  return prisma.document.update({ where: { id }, data: updateData })
}

export async function deleteDocument(id) {
  return prisma.document.update({ where: { id }, data: { isActive: false } })
}

export async function acknowledge(documentId, userId) {
  return prisma.documentAcknowledgment.upsert({
    where: { documentId_userId: { documentId, userId } },
    create: { documentId, userId },
    update: { acknowledgedAt: new Date() },
  })
}

export async function getAcknowledgments(documentId) {
  return prisma.documentAcknowledgment.findMany({
    where: { documentId },
    include: { user: { select: { id: true, name: true, image: true } } },
    orderBy: { acknowledgedAt: 'desc' },
  })
}
