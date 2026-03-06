import * as announcementsService from '../services/announcements.service.js'
import prisma from '../config/prisma.js'
import ApiError from '../utils/ApiError.js'
import catchAsync from '../utils/catchAsync.js'

export const listAnnouncements = catchAsync(async (req, res) => {
  const { page, limit, category, departmentId } = req.query
  const result = await announcementsService.list({ page, limit, category, departmentId, companyId: req.user.companyId })
  res.json(result)
})

export const listEmployeeAnnouncements = catchAsync(async (req, res) => {
  const user = req.user
  const { page, limit, category } = req.query

  // Get announcements where:
  // 1. departmentId is null (company-wide announcements)
  // 2. OR departmentId matches user's department
  // 3. AND expiresAt is null OR expiresAt is in the future
  const pageNum = Number(page) || 1
  const limitNum = Math.min(Number(limit) || 10, 100)
  const now = new Date()

  const whereConditions = [
    { departmentId: null }, // Company-wide announcements
  ]

  if (user.departmentId) {
    whereConditions.push({ departmentId: user.departmentId }) // Department-specific announcements
  }

  const where = {
    AND: [
      { OR: whereConditions },
      // Filter out expired announcements
      {
        OR: [
          { expiresAt: null }, // Announcements that never expire
          { expiresAt: { gt: now } }, // Announcements that haven't expired yet
        ],
      },
      ...(category ? [{ category }] : []),
      ...(user.companyId ? [{ companyId: user.companyId }] : []),
    ],
  }

  const [items, total] = await Promise.all([
    prisma.announcement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        department: {
          select: { id: true, name: true },
        },
      },
    }),
    prisma.announcement.count({ where }),
  ])

  res.json({
    meta: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
    data: items,
  })
})

export const getAnnouncement = catchAsync(async (req, res) => {
  const announcement = await announcementsService.getById(req.params.id)
  if (!announcement) throw new ApiError(404, 'Announcement not found')
  res.json(announcement)
})

export const createAnnouncement = catchAsync(async (req, res) => {
  const user = req.user

  const payload = {
    ...req.body,
    createdById: user.id,
    companyId: user.companyId,
  }

  const announcement = await announcementsService.create(payload)
  res.status(201).json(announcement)
})

export const updateAnnouncement = catchAsync(async (req, res) => {
  const user = req.user

  const id = req.params.id
  const existing = await announcementsService.getById(id)

  if (!existing) throw new ApiError(404, 'Announcement not found')
  if (existing.createdById !== user.id) throw new ApiError(403, 'Forbidden')

  const updated = await announcementsService.update(id, req.body)
  res.json(updated)
})

export const deleteAnnouncement = catchAsync(async (req, res) => {
  const user = req.user

  const id = req.params.id
  const existing = await announcementsService.getById(id)

  if (!existing) throw new ApiError(404, 'Announcement not found')
  if (existing.createdById !== user.id) throw new ApiError(403, 'Forbidden')

  await announcementsService.remove(id)
  res.status(204).end()
})

export default {
  listAnnouncements,
  listEmployeeAnnouncements,
  getAnnouncement,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
}
