import * as chatService from '../services/chat.service.js'
import catchAsync from '../utils/catchAsync.js'
import { emitToUser } from '../lib/socket.js'

const createConversation = catchAsync(async (req, res) => {
  const data = await chatService.createConversation(req.user.id, req.body)
  res.status(201).json({ success: true, data })
})

const listConversations = catchAsync(async (req, res) => {
  const data = await chatService.listConversations(req.user.id)
  res.json({ success: true, data })
})

const getMessages = catchAsync(async (req, res) => {
  const { page, limit } = req.query
  const result = await chatService.getMessages(req.user.id, req.params.id, {
    page: page ? parseInt(page) : undefined,
    limit: limit ? parseInt(limit) : undefined,
  })
  res.json({ success: true, ...result })
})

const sendMessage = catchAsync(async (req, res) => {
  const conversationId = req.params.id
  const message = await chatService.sendMessage(req.user.id, conversationId, req.body.content)

  // Broadcast message to all participants via socket
  const participantIds = await chatService.getConversationParticipantIds(conversationId)
  participantIds.forEach(uid => {
    if (uid !== req.user.id) {
      emitToUser(uid, 'chat:message', { conversationId, message })
    }
  })

  res.status(201).json({ success: true, data: message })
})

const markAsRead = catchAsync(async (req, res) => {
  await chatService.markAsRead(req.user.id, req.params.id)
  res.json({ success: true, message: 'Marked as read' })
})

export default { createConversation, listConversations, getMessages, sendMessage, markAsRead }
