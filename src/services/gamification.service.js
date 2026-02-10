import prisma from '../config/prisma.js'

export async function getLeaderboard(period = 'month', limit = 20) {
  let startDate = null

  if (period === 'week') {
    startDate = new Date()
    startDate.setDate(startDate.getDate() - 7)
    startDate.setHours(0, 0, 0, 0)
  } else if (period === 'month') {
    startDate = new Date()
    startDate.setDate(1)
    startDate.setHours(0, 0, 0, 0)
  }
  // 'all' => no startDate filter

  const whereClause = startDate ? { earnedAt: { gte: startDate } } : {}

  // Get all points grouped by user
  const pointsData = await prisma.gamificationPoints.groupBy({
    by: ['userId'],
    where: whereClause,
    _sum: { points: true },
    orderBy: { _sum: { points: 'desc' } },
    take: limit,
  })

  if (pointsData.length === 0) return []

  const userIds = pointsData.map(p => p.userId)

  // Get user details
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, image: true },
  })

  // Get badge counts per user
  const badgeCounts = await prisma.userBadge.groupBy({
    by: ['userId'],
    where: { userId: { in: userIds } },
    _count: { id: true },
  })

  const userMap = new Map(users.map(u => [u.id, u]))
  const badgeMap = new Map(badgeCounts.map(b => [b.userId, b._count.id]))

  return pointsData.map((p, index) => {
    const user = userMap.get(p.userId)
    return {
      rank: index + 1,
      userId: p.userId,
      userName: user?.name || 'Unknown',
      userImage: user?.image || null,
      totalPoints: p._sum.points || 0,
      badgeCount: badgeMap.get(p.userId) || 0,
    }
  })
}

export async function getMyPoints(userId, page = 1, limit = 20) {
  const skip = (page - 1) * limit
  const [data, total] = await Promise.all([
    prisma.gamificationPoints.findMany({
      where: { userId },
      orderBy: { earnedAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.gamificationPoints.count({ where: { userId } }),
  ])
  return { data, meta: { page, total, totalPages: Math.ceil(total / limit) } }
}

export async function getMyBadges(userId) {
  const userBadges = await prisma.userBadge.findMany({
    where: { userId },
    include: {
      badge: true,
    },
    orderBy: { earnedAt: 'desc' },
  })
  return userBadges.map(ub => ({
    id: ub.badge.id,
    name: ub.badge.name,
    description: ub.badge.description,
    icon: ub.badge.icon,
    criteria: ub.badge.criteria,
    earnedAt: ub.earnedAt,
  }))
}

export async function getAllBadges() {
  return prisma.badge.findMany({
    orderBy: { name: 'asc' },
  })
}

export async function awardPoints(userId, points, reason, category) {
  const entry = await prisma.gamificationPoints.create({
    data: {
      userId,
      points,
      reason,
      category,
    },
  })

  // Check for badge eligibility after awarding points
  await checkAndAwardBadges(userId)

  return entry
}

export async function getUserTotalPoints(userId) {
  const result = await prisma.gamificationPoints.aggregate({
    where: { userId },
    _sum: { points: true },
  })
  return result._sum.points || 0
}

export async function seedDefaultBadges() {
  const existingCount = await prisma.badge.count()
  if (existingCount > 0) return { message: 'Badges already exist', count: existingCount }

  const defaultBadges = [
    { name: 'Early Bird', description: 'Maintained perfect attendance for 30 days', icon: 'sunrise', criteria: 'ATTENDANCE', threshold: 30 },
    { name: 'Punctuality Pro', description: 'No late arrivals for 60 days', icon: 'clock', criteria: 'ATTENDANCE', threshold: 60 },
    { name: 'Iron Streak', description: '90 consecutive days of attendance', icon: 'flame', criteria: 'ATTENDANCE', threshold: 90 },
    { name: 'Productivity Star', description: 'Earned 500 productivity points', icon: 'star', criteria: 'PRODUCTIVITY', threshold: 500 },
    { name: 'Task Master', description: 'Earned 1000 productivity points', icon: 'trophy', criteria: 'PRODUCTIVITY', threshold: 1000 },
    { name: 'Team Player', description: 'Received 10 recognition awards', icon: 'users', criteria: 'RECOGNITION', threshold: 10 },
    { name: 'Mentor', description: 'Received 25 recognition awards', icon: 'award', criteria: 'RECOGNITION', threshold: 25 },
    { name: 'Quick Learner', description: 'Completed 5 training modules', icon: 'book-open', criteria: 'TRAINING', threshold: 5 },
    { name: 'Knowledge Guru', description: 'Completed 20 training modules', icon: 'graduation-cap', criteria: 'TRAINING', threshold: 20 },
    { name: 'Wellness Champion', description: 'Logged 30 wellness activities', icon: 'heart', criteria: 'WELLNESS', threshold: 30 },
    { name: 'Century Club', description: 'Earned 100 total points', icon: 'medal', criteria: 'TOTAL_POINTS', threshold: 100 },
    { name: 'Point Collector', description: 'Earned 500 total points', icon: 'coins', criteria: 'TOTAL_POINTS', threshold: 500 },
  ]

  const created = await prisma.badge.createMany({ data: defaultBadges })
  return { message: 'Default badges seeded', count: created.count }
}

async function checkAndAwardBadges(userId) {
  // Get all badges and user's current badges
  const [allBadges, userBadges, totalPoints, categoryCounts] = await Promise.all([
    prisma.badge.findMany(),
    prisma.userBadge.findMany({ where: { userId }, select: { badgeId: true } }),
    getUserTotalPoints(userId),
    prisma.gamificationPoints.groupBy({
      by: ['category'],
      where: { userId },
      _sum: { points: true },
    }),
  ])

  const earnedBadgeIds = new Set(userBadges.map(ub => ub.badgeId))
  const categoryPointsMap = new Map(categoryCounts.map(c => [c.category, c._sum.points || 0]))

  const newBadges = []

  for (const badge of allBadges) {
    if (earnedBadgeIds.has(badge.id)) continue

    let earned = false

    if (badge.criteria === 'TOTAL_POINTS') {
      earned = totalPoints >= badge.threshold
    } else {
      // Map criteria to category
      const categoryPoints = categoryPointsMap.get(badge.criteria) || 0
      earned = categoryPoints >= badge.threshold
    }

    if (earned) {
      newBadges.push({ userId, badgeId: badge.id })
    }
  }

  if (newBadges.length > 0) {
    await prisma.userBadge.createMany({
      data: newBadges,
      skipDuplicates: true,
    })
  }
}
