import { Server } from 'socket.io'
import { auth } from './auth.js'
import logger from '../config/logger.js'

let io = null

// Track connected users: Map<userId, Set<socketId>>
const connectedUsers = new Map()

/**
 * Initialize Socket.IO server
 * @param {import('http').Server} httpServer
 */
export function initializeSocket(httpServer) {
  const allowedOrigins = [
    'https://forrof-tracker.vercel.app',
    'https://tracker.forrof.io',
    'https://www.tracker.forrof.io',
    'https://vs-code-time-duration.vercel.app',
  ]

  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (
          !origin ||
          allowedOrigins.includes(origin) ||
          /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
        ) {
          callback(null, true)
        } else {
          callback(new Error('CORS not allowed'))
        }
      },
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  })

  // Authentication middleware — validate session from cookies
  io.use(async (socket, next) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie
      if (!cookieHeader) {
        return next(new Error('Authentication required'))
      }

      const session = await auth.api.getSession({
        headers: { cookie: cookieHeader },
      })

      if (!session?.user) {
        return next(new Error('Invalid session'))
      }

      socket.userId = session.user.id
      socket.userRole = session.user.role
      socket.userName = session.user.name
      next()
    } catch (err) {
      logger.error('Socket auth error:', err.message)
      next(new Error('Authentication failed'))
    }
  })

  io.on('connection', socket => {
    const { userId, userRole, userName } = socket

    // Track connection
    if (!connectedUsers.has(userId)) {
      connectedUsers.set(userId, new Set())
    }
    connectedUsers.get(userId).add(socket.id)

    // Join user-specific room
    socket.join(`user:${userId}`)

    // Join role-based room
    socket.join(`role:${userRole}`)

    logger.info(`Socket connected: ${userName} (${userRole}) [${socket.id}]`)

    // Broadcast presence: send full online user list to admins
    if (connectedUsers.get(userId)?.size === 1) {
      // First socket for this user — they just came online
      io.to('role:admin').emit('presence:update', {
        onlineUserIds: Array.from(connectedUsers.keys()),
      })
    }

    // Send current online list to newly connected socket
    socket.emit('presence:update', {
      onlineUserIds: Array.from(connectedUsers.keys()),
    })

    // Chat: Join/leave conversation rooms
    socket.on('chat:join', conversationId => {
      socket.join(`conversation:${conversationId}`)
    })

    socket.on('chat:leave', conversationId => {
      socket.leave(`conversation:${conversationId}`)
    })

    // Chat: Typing indicators
    socket.on('chat:typing', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('chat:typing', {
        conversationId,
        userId,
        userName,
      })
    })

    socket.on('chat:stopTyping', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('chat:stopTyping', {
        conversationId,
        userId,
      })
    })

    socket.on('disconnect', reason => {
      const userSockets = connectedUsers.get(userId)
      if (userSockets) {
        userSockets.delete(socket.id)
        if (userSockets.size === 0) {
          connectedUsers.delete(userId)
        }
      }
      // If user has no more sockets, they went offline — broadcast update
      if (!connectedUsers.has(userId)) {
        io.to('role:admin').emit('presence:update', {
          onlineUserIds: Array.from(connectedUsers.keys()),
        })
      }

      logger.info(`Socket disconnected: ${userName} [${socket.id}] - ${reason}`)
    })
  })

  logger.info('Socket.IO initialized')
  return io
}

/**
 * Get the Socket.IO server instance
 */
export function getIO() {
  if (!io) {
    throw new Error('Socket.IO not initialized. Call initializeSocket first.')
  }
  return io
}

/**
 * Emit to a specific user (all their connected sockets)
 */
export function emitToUser(userId, event, data) {
  if (!io) return
  io.to(`user:${userId}`).emit(event, data)
}

/**
 * Emit to all admin users
 */
export function emitToAdmins(event, data) {
  if (!io) return
  io.to('role:admin').emit(event, data)
}

/**
 * Emit to all employee users
 */
export function emitToEmployees(event, data) {
  if (!io) return
  io.to('role:employee').emit(event, data)
}

/**
 * Emit to all connected clients
 */
export function emitToAll(event, data) {
  if (!io) return
  io.emit(event, data)
}

/**
 * Get count of connected users
 */
export function getConnectedUsersCount() {
  return connectedUsers.size
}
