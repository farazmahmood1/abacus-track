import prisma from '../config/prisma.js'
import ApiError from '../utils/ApiError.js'

/**
 * Get or create a direct conversation between two users
 */
export async function getOrCreateDirectConversation(userId, otherUserId) {
  // Find existing direct conversation between these two users
  const existing = await prisma.conversation.findFirst({
    where: {
      type: 'DIRECT',
      AND: [
        { participants: { some: { userId } } },
        { participants: { some: { userId: otherUserId } } },
      ],
    },
    include: {
      participants: {
        include: { user: { select: { id: true, name: true, email: true, image: true } } },
      },
    },
  })

  if (existing) return existing

  // Create new direct conversation
  return prisma.conversation.create({
    data: {
      type: 'DIRECT',
      participants: {
        createMany: {
          data: [{ userId }, { userId: otherUserId }],
        },
      },
    },
    include: {
      participants: {
        include: { user: { select: { id: true, name: true, email: true, image: true } } },
      },
    },
  })
}

/**
 * Create a group conversation
 */
export async function createGroupConversation(userId, { name, participantIds }) {
  const allIds = [...new Set([userId, ...participantIds])]

  return prisma.conversation.create({
    data: {
      type: 'GROUP',
      name: name || null,
      participants: {
        createMany: {
          data: allIds.map(id => ({ userId: id })),
        },
      },
    },
    include: {
      participants: {
        include: { user: { select: { id: true, name: true, email: true, image: true } } },
      },
    },
  })
}

/**
 * Create conversation — routes to direct or group based on input
 */
export async function createConversation(userId, data) {
  const { participantIds, name, type } = data

  if (type === 'GROUP' || participantIds.length > 1) {
    return createGroupConversation(userId, { name, participantIds })
  }

  // Direct conversation
  return getOrCreateDirectConversation(userId, participantIds[0])
}

/**
 * List conversations for a user
 */
export async function listConversations(userId) {
  const conversations = await prisma.conversation.findMany({
    where: {
      participants: { some: { userId } },
    },
    include: {
      participants: {
        include: { user: { select: { id: true, name: true, email: true, image: true } } },
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: {
          sender: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  })

  // Attach unread count for each conversation
  const result = await Promise.all(
    conversations.map(async conv => {
      const participant = conv.participants.find(p => p.userId === userId)
      const unreadCount = await prisma.message.count({
        where: {
          conversationId: conv.id,
          senderId: { not: userId },
          createdAt: participant?.lastReadAt ? { gt: participant.lastReadAt } : undefined,
        },
      })
      return { ...conv, unreadCount }
    })
  )

  return result
}

/**
 * Get messages for a conversation (paginated)
 */
export async function getMessages(userId, conversationId, { page = 1, limit = 50 }) {
  // Verify user is a participant
  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  })
  if (!participant) throw new ApiError(403, 'Not a participant in this conversation')

  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: { select: { id: true, name: true, email: true, image: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.message.count({ where: { conversationId } }),
  ])

  return {
    data: messages.reverse(), // Return in chronological order
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  }
}

/**
 * Send a message in a conversation
 */
export async function sendMessage(userId, conversationId, content) {
  // Verify user is a participant
  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  })
  if (!participant) throw new ApiError(403, 'Not a participant in this conversation')

  const [message] = await prisma.$transaction([
    prisma.message.create({
      data: { conversationId, senderId: userId, content },
      include: {
        sender: { select: { id: true, name: true, email: true, image: true } },
      },
    }),
    // Update conversation updatedAt so it sorts to top
    prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    }),
  ])

  return message
}

/**
 * Mark conversation as read for user
 */
export async function markAsRead(userId, conversationId) {
  return prisma.conversationParticipant.update({
    where: { conversationId_userId: { conversationId, userId } },
    data: { lastReadAt: new Date() },
  })
}

/**
 * Get conversation participants (for socket broadcasting)
 */
export async function getConversationParticipantIds(conversationId) {
  const participants = await prisma.conversationParticipant.findMany({
    where: { conversationId },
    select: { userId: true },
  })
  return participants.map(p => p.userId)
}
