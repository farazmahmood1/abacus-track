import httpStatus from 'http-status'
import prisma from '../config/prisma.js'
import catchAsync from '../utils/catchAsync.js'
import ApiError from '../utils/ApiError.js'

/**
 * Get all active important links
 */
export const getImportantLinks = catchAsync(async (req, res) => {
  const links = await prisma.importantLink.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' },
  })
  res.status(httpStatus.OK).json(links)
})

/**
 * Create important link (Admin only)
 */
export const createImportantLink = catchAsync(async (req, res) => {
  const { title, url } = req.body

  if (!title || !url) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Title and URL are required')
  }

  const link = await prisma.importantLink.create({
    data: {
      title,
      url,
    },
  })

  res.status(httpStatus.CREATED).json(link)
})

/**
 * Update important link (Admin only)
 */
export const updateImportantLink = catchAsync(async (req, res) => {
  const { id } = req.params
  const { title, url, order, isActive } = req.body

  const link = await prisma.importantLink.findUnique({
    where: { id },
  })

  if (!link) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Link not found')
  }

  const updated = await prisma.importantLink.update({
    where: { id },
    data: {
      title: title || link.title,
      url: url || link.url,
      order: order !== undefined ? order : link.order,
      isActive: isActive !== undefined ? isActive : link.isActive,
    },
  })

  res.status(httpStatus.OK).json(updated)
})

/**
 * Delete important link (Admin only)
 */
export const deleteImportantLink = catchAsync(async (req, res) => {
  const { id } = req.params

  const link = await prisma.importantLink.findUnique({
    where: { id },
  })

  if (!link) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Link not found')
  }

  await prisma.importantLink.delete({
    where: { id },
  })

  res.status(httpStatus.NO_CONTENT).send()
})

/**
 * Get active terms and conditions
 */
export const getTermsConditions = catchAsync(async (req, res) => {
  const terms = await prisma.termsCondition.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
    take: 1, // Get the latest active version
  })

  res.status(httpStatus.OK).json(terms)
})

/**
 * Get all terms and conditions versions (Admin only)
 */
export const getAllTermsConditions = catchAsync(async (req, res) => {
  const terms = await prisma.termsCondition.findMany({
    orderBy: { createdAt: 'desc' },
  })

  res.status(httpStatus.OK).json(terms)
})

/**
 * Create terms and conditions (Admin only)
 */
export const createTermsCondition = catchAsync(async (req, res) => {
  const { title, content } = req.body

  if (!title || !content) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Title and content are required')
  }

  // Get the latest version number
  const latest = await prisma.termsCondition.findFirst({
    orderBy: { version: 'desc' },
    take: 1,
  })

  const newVersion = (latest?.version ?? 0) + 1

  const terms = await prisma.termsCondition.create({
    data: {
      title,
      content,
      version: newVersion,
      isActive: true,
    },
  })

  // Deactivate previous versions
  await prisma.termsCondition.updateMany({
    where: {
      id: { not: terms.id },
      isActive: true,
    },
    data: { isActive: false },
  })

  res.status(httpStatus.CREATED).json(terms)
})

/**
 * Update terms and conditions (Admin only)
 */
export const updateTermsCondition = catchAsync(async (req, res) => {
  const { id } = req.params
  const { title, content } = req.body

  const terms = await prisma.termsCondition.findUnique({
    where: { id },
  })

  if (!terms) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Terms and conditions not found')
  }

  const updated = await prisma.termsCondition.update({
    where: { id },
    data: {
      title: title || terms.title,
      content: content || terms.content,
    },
  })

  res.status(httpStatus.OK).json(updated)
})

/**
 * Delete terms and conditions (Admin only)
 */
export const deleteTermsCondition = catchAsync(async (req, res) => {
  const { id } = req.params

  const terms = await prisma.termsCondition.findUnique({
    where: { id },
  })

  if (!terms) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Terms and conditions not found')
  }

  await prisma.termsCondition.delete({
    where: { id },
  })

  res.status(httpStatus.NO_CONTENT).send()
})

export default {
  getImportantLinks,
  createImportantLink,
  updateImportantLink,
  deleteImportantLink,
  getTermsConditions,
  getAllTermsConditions,
  createTermsCondition,
  updateTermsCondition,
  deleteTermsCondition,
}
