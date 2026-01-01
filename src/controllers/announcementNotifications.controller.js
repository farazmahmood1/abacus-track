import * as announcementNotificationsService from '../services/announcementNotifications.service.js'
import catchAsync from '../utils/catchAsync.js'

export const getAnnouncementNotifications = catchAsync(async (req, res) => {
  const userId = req.user.id
  const { page, limit } = req.query

  const result = await announcementNotificationsService.getAnnouncementNotifications(
    userId,
    { page, limit }
  )
  res.json(result)
})

export const getUnreadCount = catchAsync(async (req, res) => {
  const userId = req.user.id
  const count = await announcementNotificationsService.getUnreadAnnouncementCount(userId)
  res.json({ count })
})

export const markAsRead = catchAsync(async (req, res) => {
  const userId = req.user.id
  const { announcementId } = req.params

  const result = await announcementNotificationsService.markAnnouncementAsRead(
    announcementId,
    userId
  )
  res.json(result)
})

export const markAllAsRead = catchAsync(async (req, res) => {
  const userId = req.user.id
  const result = await announcementNotificationsService.markAllAnnouncementsAsRead(userId)
  res.json(result)
})

export const deleteNotification = catchAsync(async (req, res) => {
  const userId = req.user.id
  const { announcementId } = req.params

  const result = await announcementNotificationsService.deleteNotification(
    announcementId,
    userId
  )
  res.json(result)
})
