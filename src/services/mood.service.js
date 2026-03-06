import prisma from '../config/prisma.js'

export async function submitMood(userId, data) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return prisma.moodEntry.upsert({
    where: { userId_date: { userId, date: today } },
    create: { userId, mood: data.mood, note: data.note || null, date: today },
    update: { mood: data.mood, note: data.note || null },
  })
}

export async function getMyMoods(userId, page = 1, limit = 30) {
  const skip = (page - 1) * limit
  const [data, total] = await Promise.all([
    prisma.moodEntry.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      skip,
      take: limit,
    }),
    prisma.moodEntry.count({ where: { userId } }),
  ])
  return { data, meta: { page, total, totalPages: Math.ceil(total / limit) } }
}

export async function getTeamMoods(date, companyId) {
  const targetDate = date ? new Date(date) : new Date()
  targetDate.setHours(0, 0, 0, 0)

  const where = { date: targetDate }
  if (companyId) where.user = { companyId }

  const entries = await prisma.moodEntry.findMany({
    where,
    include: { user: { select: { id: true, name: true, image: true } } },
    orderBy: { createdAt: 'desc' },
  })

  const total = entries.length
  const avgMood = total > 0 ? entries.reduce((sum, e) => sum + e.mood, 0) / total : 0

  return { entries, avgMood: Math.round(avgMood * 10) / 10, total }
}

export async function getMoodAnalytics(days = 30, companyId) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  startDate.setHours(0, 0, 0, 0)

  const where = { date: { gte: startDate } }
  if (companyId) where.user = { companyId }

  const entries = await prisma.moodEntry.findMany({
    where,
    orderBy: { date: 'asc' },
  })

  // Group by date and calculate average
  const byDate = {}
  entries.forEach(e => {
    const key = e.date.toISOString().split('T')[0]
    if (!byDate[key]) byDate[key] = { total: 0, count: 0 }
    byDate[key].total += e.mood
    byDate[key].count++
  })

  const trend = Object.entries(byDate).map(([date, v]) => ({
    date,
    avgMood: Math.round((v.total / v.count) * 10) / 10,
    responses: v.count,
  }))

  // Distribution
  const distribution = [0, 0, 0, 0, 0]
  entries.forEach(e => distribution[e.mood - 1]++)

  return { trend, distribution, totalEntries: entries.length }
}
