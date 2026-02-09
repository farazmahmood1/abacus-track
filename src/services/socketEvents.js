import { emitToUser, emitToAdmins, emitToAll } from '../lib/socket.js'

/**
 * Emit when an employee checks in
 */
export function emitCheckIn(userId, userName, session) {
  // Notify admins about the check-in
  emitToAdmins('timer:checkin', {
    userId,
    userName,
    session: {
      id: session.id,
      startTime: session.startTime,
      projectId: session.projectId,
    },
    timestamp: new Date().toISOString(),
  })

  // Update dashboard stats for all admins
  emitToAdmins('dashboard:statsUpdate', {
    type: 'checkin',
    userId,
    timestamp: new Date().toISOString(),
  })

  // Update attendance for all admins
  emitToAdmins('attendance:update', {
    type: 'checkin',
    userId,
    timestamp: new Date().toISOString(),
  })
}

/**
 * Emit when an employee checks out
 */
export function emitCheckOut(userId, userName, session) {
  emitToAdmins('timer:checkout', {
    userId,
    userName,
    session: {
      id: session.id,
      startTime: session.startTime,
      endTime: session.endTime,
      totalDuration: session.totalDuration,
    },
    timestamp: new Date().toISOString(),
  })

  emitToAdmins('dashboard:statsUpdate', {
    type: 'checkout',
    userId,
    timestamp: new Date().toISOString(),
  })

  emitToAdmins('attendance:update', {
    type: 'checkout',
    userId,
    timestamp: new Date().toISOString(),
  })
}

/**
 * Emit when a timer is paused
 */
export function emitTimerPause(userId, userName) {
  emitToAdmins('timer:pause', {
    userId,
    userName,
    timestamp: new Date().toISOString(),
  })

  emitToAdmins('attendance:update', {
    type: 'pause',
    userId,
    timestamp: new Date().toISOString(),
  })
}

/**
 * Emit when a timer is resumed
 */
export function emitTimerResume(userId, userName) {
  emitToAdmins('timer:resume', {
    userId,
    userName,
    timestamp: new Date().toISOString(),
  })

  emitToAdmins('attendance:update', {
    type: 'resume',
    userId,
    timestamp: new Date().toISOString(),
  })
}

/**
 * Emit when a break starts
 */
export function emitBreakStart(userId, userName) {
  emitToAdmins('timer:break', {
    userId,
    userName,
    action: 'start',
    timestamp: new Date().toISOString(),
  })

  emitToAdmins('attendance:update', {
    type: 'break_start',
    userId,
    timestamp: new Date().toISOString(),
  })
}

/**
 * Emit when a break ends
 */
export function emitBreakEnd(userId, userName) {
  emitToAdmins('timer:break', {
    userId,
    userName,
    action: 'end',
    timestamp: new Date().toISOString(),
  })

  emitToAdmins('attendance:update', {
    type: 'break_end',
    userId,
    timestamp: new Date().toISOString(),
  })
}

/**
 * Emit a new notification to a specific user
 */
export function emitNotification(userId, notification) {
  emitToUser(userId, 'notification:new', notification)
}

/**
 * Emit a new notification to all admins
 */
export function emitAdminNotification(notification) {
  emitToAdmins('notification:new', notification)
}

/**
 * Emit when a new announcement is created
 */
export function emitNewAnnouncement(announcement, targetUserIds = null) {
  const payload = {
    id: announcement.id,
    title: announcement.title,
    category: announcement.category,
    createdAt: announcement.createdAt,
    timestamp: new Date().toISOString(),
  }

  if (targetUserIds) {
    // Send to specific users (department-targeted)
    targetUserIds.forEach(uid => {
      emitToUser(uid, 'announcement:new', payload)
    })
  } else {
    // Company-wide announcement
    emitToAll('announcement:new', payload)
  }
}

/**
 * Emit when a leave status changes (approved/rejected)
 */
export function emitLeaveStatusChanged(userId, leave) {
  emitToUser(userId, 'leave:statusChanged', {
    leaveId: leave.id,
    status: leave.status,
    leaveType: leave.leaveType,
    timestamp: new Date().toISOString(),
  })

  // Also update dashboard stats for admins
  emitToAdmins('dashboard:statsUpdate', {
    type: 'leave_update',
    userId,
    timestamp: new Date().toISOString(),
  })
}
