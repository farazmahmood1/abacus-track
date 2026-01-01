import prisma from '../config/prisma.js'

const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 10

/**
 * Get announcements for a user based on their department
 * Smart query: Only returns announcements they're eligible for
 * Also includes their read status
 */
export async function getAnnouncementNotifications(
  userId,
  { page = DEFAULT_PAGE, limit = DEFAULT_LIMIT } = {}
) {
  page = Number(page) || DEFAULT_PAGE
  limit = Math.min(Number(limit) || DEFAULT_LIMIT, 100)

  // Get user's department
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { departmentId: true },
  })

  if (!user) {
    return {
      meta: { page, limit, total: 0, totalPages: 0 },
      data: [],
    }
  }

  // Find announcements they're eligible for:
  // 1. Announcements with no department (sent to all)
  // 2. Announcements for their specific department
  const announcementWhere = {
    OR: [{ departmentId: null }, { departmentId: user.departmentId }],
  }

  const [announcementNotifications, total] = await Promise.all([
    prisma.announcementNotification.findMany({
      where: {
        employeeId: userId,
        announcement: announcementWhere,
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        announcement: {
          include: {
            createdBy: {
              select: { id: true, name: true },
            },
          },
        },
      },
    }),
    prisma.announcementNotification.count({
      where: {
        employeeId: userId,
        announcement: announcementWhere,
      },
    }),
  ])

  // Format response
  const data = announcementNotifications.map(notif => ({
    id: notif.announcement.id,
    title: notif.announcement.title,
    message: notif.announcement.description,
    type: 'announcement',
    category: notif.announcement.category,
    department: notif.announcement.department,
    createdBy: notif.announcement.createdBy,
    isRead: notif.isRead,
    readAt: notif.readAt,
    createdAt: notif.announcement.createdAt,
    data: {
      announcementId: notif.announcement.id,
      category: notif.announcement.category,
    },
  }))

  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data,
  }
}

/**
 * Mark announcement as read for a user
 */
export async function markAnnouncementAsRead(announcementId, userId) {
  return prisma.announcementNotification.update({
    where: {
      announcementId_employeeId: {
        announcementId,
        employeeId: userId,
      },
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  })
}

/**
 * Get unread announcement count for a user
 */
export async function getUnreadAnnouncementCount(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { departmentId: true },
  })

  if (!user) {
    return 0
  }

  // Count unread announcement notifications for this user
  const unreadCount = await prisma.announcementNotification.count({
    where: {
      employeeId: userId,
      isRead: false,
      announcement: {
        OR: [{ departmentId: null }, { departmentId: user.departmentId }],
      },
    },
  })

  return unreadCount
}

/**
 * Mark all announcements as read for a user
 */
export async function markAllAnnouncementsAsRead(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { departmentId: true },
  })

  if (!user) {
    return { count: 0 }
  }

  const result = await prisma.announcementNotification.updateMany({
    where: {
      employeeId: userId,
      isRead: false,
      announcement: {
        OR: [{ departmentId: null }, { departmentId: user.departmentId }],
      },
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  })

  return { count: result.count }
}

/**
 * Delete a notification for a user
 */
export async function deleteNotification(announcementId, userId) {
  return prisma.announcementNotification.delete({
    where: {
      announcementId_employeeId: {
        announcementId,
        employeeId: userId,
      },
    },
  })
}
