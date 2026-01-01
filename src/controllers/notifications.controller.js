import prisma from '../config/prisma.js'
import catchAsync from '../utils/catchAsync.js'

// Get all notifications (announcement, leave, check-in/out) for the current user
export const getNotifications = catchAsync(async (req, res) => {
  const userId = req.user.id
  const userRole = req.user.role

  // Get user department
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { departmentId: true },
  })

  // Announcement notifications - filtered by department logic
  // Show all announcements where:
  // 1. departmentId is null (company-wide announcements)
  // 2. OR departmentId matches user's department
  const announcementNotifications = await prisma.announcementNotification.findMany({
    where: { employeeId: userId },
    include: {
      announcement: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  // Filter announcements by department logic
  const filteredAnnouncementNotifications = announcementNotifications.filter(n => {
    // If announcement has no department (null), show to everyone
    if (n.announcement.departmentId === null) {
      return true
    }
    // If announcement has a department, only show to users in that department
    return n.announcement.departmentId === user?.departmentId
  })

  // Leave notifications
  const leaveNotifications = await prisma.leaveNotification.findMany({
    where: { userId },
    include: {
      leave: {
        include: {
          employee: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Check-in/out notifications
  // Admins see ALL employees' check-in/out notifications
  // Regular employees see their own check-in/out notifications
  const checkInOutNotifications = await prisma.checkInOutNotification.findMany({
    where: userRole === 'admin' ? {} : { userId },
    include: {
      user: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  // Transform to unified format
  const notifications = [
    ...filteredAnnouncementNotifications.map(n => ({
      id: n.id,
      type: 'announcement',
      title: n.announcement.title,
      message: n.announcement.description,
      isRead: n.isRead,
      createdAt: n.createdAt,
      data: {
        announcementId: n.announcementId,
        category: n.announcement.category,
        department: n.announcement.departmentId,
      },
    })),
    ...leaveNotifications.map(n => ({
      id: n.id,
      type: 'leave',
      title: n.leave.leaveType.replace(/_/g, ' '),
      message: n.message,
      isRead: n.isRead,
      createdAt: n.createdAt,
      data: {
        leaveId: n.leaveId,
        status: n.leave.status,
        employeeName: n.leave.employee.name,
        startDate: n.leave.startDate.toISOString(),
        endDate: n.leave.endDate.toISOString(),
      },
    })),
    ...checkInOutNotifications.map(n => ({
      id: n.id,
      type: n.type === 'check_in' ? 'check-in' : 'check-out',
      title: `${n.user.name} ${n.type === 'check_in' ? 'checked in' : 'checked out'}`,
      message: `at ${new Date(n.createdAt).toLocaleTimeString()}`,
      isRead: n.isRead,
      createdAt: n.createdAt,
      time: n.createdAt,
      user: {
        id: n.user.id,
        name: n.user.name,
        email: n.user.email,
      },
    })),
  ]

  // Sort all notifications by date descending
  notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  res.json({
    data: notifications,
    success: true,
  })
})

export const markAsRead = catchAsync(async (req, res) => {
  const userId = req.user.id
  const userRole = req.user.role
  const { notificationId } = req.params

  // Try leave notification first
  const leaveNotification = await prisma.leaveNotification.findUnique({
    where: { id: notificationId },
  })
  if (leaveNotification && leaveNotification.userId === userId) {
    await prisma.leaveNotification.update({
      where: { id: notificationId },
      data: { isRead: true, readAt: new Date() },
    })
    return res.json({ success: true })
  }

  // Try announcement notification
  const announcementNotification = await prisma.announcementNotification.findUnique({
    where: { id: notificationId },
  })
  if (announcementNotification && announcementNotification.employeeId === userId) {
    await prisma.announcementNotification.update({
      where: { id: notificationId },
      data: { isRead: true, readAt: new Date() },
    })
    return res.json({ success: true })
  }

  // Try check-in/out notification
  // Admins can mark any check-in/out notification, employees can only mark their own
  const checkInOutNotification = await prisma.checkInOutNotification.findUnique({
    where: { id: notificationId },
  })
  if (checkInOutNotification) {
    if (userRole === 'admin' || checkInOutNotification.userId === userId) {
      await prisma.checkInOutNotification.update({
        where: { id: notificationId },
        data: { isRead: true, readAt: new Date() },
      })
      return res.json({ success: true })
    }
  }

  return res.status(404).json({ success: false, message: 'Notification not found' })
})

export const markAllAsRead = catchAsync(async (req, res) => {
  const userId = req.user.id
  const userRole = req.user.role

  // Mark all leave notifications as read
  await prisma.leaveNotification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  })

  // Mark all announcement notifications as read
  await prisma.announcementNotification.updateMany({
    where: { employeeId: userId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  })

  // Mark all check-in/out notifications as read
  // Admins mark ALL check-in/out notifications as read
  // Employees mark only their own check-in/out notifications as read
  const checkInOutWhere =
    userRole === 'admin' ? { isRead: false } : { userId, isRead: false }
  await prisma.checkInOutNotification.updateMany({
    where: checkInOutWhere,
    data: { isRead: true, readAt: new Date() },
  })

  res.json({ success: true })
})

export const deleteNotification = catchAsync(async (req, res) => {
  const userId = req.user.id
  const userRole = req.user.role
  const { notificationId } = req.params

  // Try leave notification first
  const leaveNotification = await prisma.leaveNotification.findUnique({
    where: { id: notificationId },
  })
  if (leaveNotification && leaveNotification.userId === userId) {
    await prisma.leaveNotification.delete({ where: { id: notificationId } })
    return res.json({ success: true })
  }

  // Try announcement notification
  const announcementNotification = await prisma.announcementNotification.findUnique({
    where: { id: notificationId },
  })
  if (announcementNotification && announcementNotification.employeeId === userId) {
    await prisma.announcementNotification.delete({ where: { id: notificationId } })
    return res.json({ success: true })
  }

  // Try check-in/out notification
  // Admins can delete any check-in/out notification, employees can only delete their own
  const checkInOutNotification = await prisma.checkInOutNotification.findUnique({
    where: { id: notificationId },
  })
  if (checkInOutNotification) {
    if (userRole === 'admin' || checkInOutNotification.userId === userId) {
      await prisma.checkInOutNotification.delete({ where: { id: notificationId } })
      return res.json({ success: true })
    }
  }

  return res.status(404).json({ success: false, message: 'Notification not found' })
})
