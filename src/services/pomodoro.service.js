import prisma from '../config/prisma.js'

export async function saveSession(userId, data) {
  return prisma.pomodoroSession.create({
    data: {
      userId,
      taskDescription: data.taskDescription || null,
      focusDuration: data.focusDuration,
      breakDuration: data.breakDuration,
      longBreakDuration: data.longBreakDuration || 15,
      totalRounds: data.totalRounds,
      completedRounds: data.completedRounds,
      totalFocusMinutes: data.totalFocusMinutes,
      status: data.status || 'COMPLETED',
      startedAt: data.startedAt ? new Date(data.startedAt) : new Date(),
      endedAt: data.endedAt ? new Date(data.endedAt) : new Date(),
    },
  })
}

export async function getHistory(userId, page = 1, limit = 10) {
  const skip = (page - 1) * limit
  const [data, total] = await Promise.all([
    prisma.pomodoroSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.pomodoroSession.count({ where: { userId } }),
  ])
  return { data, meta: { page, total, totalPages: Math.ceil(total / limit) } }
}

export async function getStats(userId) {
  const sessions = await prisma.pomodoroSession.findMany({
    where: { userId, status: 'COMPLETED' },
    select: { totalFocusMinutes: true, completedRounds: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })

  const totalFocusMinutes = sessions.reduce((sum, s) => sum + s.totalFocusMinutes, 0)
  const sessionsCompleted = sessions.length

  // Calculate streak (consecutive days with at least one session)
  let currentStreak = 0
  if (sessions.length > 0) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dates = [
      ...new Set(
        sessions.map(s => {
          const d = new Date(s.createdAt)
          d.setHours(0, 0, 0, 0)
          return d.getTime()
        })
      ),
    ].sort((a, b) => b - a)

    let checkDate = today.getTime()
    for (const dateTime of dates) {
      if (dateTime === checkDate || dateTime === checkDate - 86400000) {
        currentStreak++
        checkDate = dateTime - 86400000
      } else {
        break
      }
    }
  }

  return { totalFocusMinutes, sessionsCompleted, currentStreak }
}

export async function getSettings(userId) {
  let settings = await prisma.pomodoroSettings.findUnique({ where: { userId } })
  if (!settings) {
    settings = { focusDuration: 25, breakDuration: 5, longBreakDuration: 15, roundsBeforeLongBreak: 4 }
  }
  return settings
}

export async function updateSettings(userId, data) {
  return prisma.pomodoroSettings.upsert({
    where: { userId },
    create: {
      userId,
      focusDuration: data.focusDuration || 25,
      breakDuration: data.breakDuration || 5,
      longBreakDuration: data.longBreakDuration || 15,
      roundsBeforeLongBreak: data.roundsBeforeLongBreak || 4,
    },
    update: {
      focusDuration: data.focusDuration,
      breakDuration: data.breakDuration,
      longBreakDuration: data.longBreakDuration,
      roundsBeforeLongBreak: data.roundsBeforeLongBreak,
    },
  })
}
