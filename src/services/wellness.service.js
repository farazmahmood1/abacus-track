import prisma from '../config/prisma.js'

export async function createChallenge(userId, data) {
  return prisma.wellnessChallenge.create({
    data: {
      title: data.title,
      description: data.description || null,
      type: data.type,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      goal: data.goal,
      unit: data.unit,
      createdBy: userId,
    },
    include: {
      creator: { select: { id: true, name: true, image: true } },
      _count: { select: { participants: true } },
    },
  })
}

export async function getChallenges(filters = {}) {
  const where = {}
  const now = new Date()

  if (filters.status === 'active') {
    where.isActive = true
    where.endDate = { gte: now }
  } else if (filters.status === 'completed') {
    where.OR = [{ isActive: false }, { endDate: { lt: now } }]
  }

  const challenges = await prisma.wellnessChallenge.findMany({
    where,
    include: {
      creator: { select: { id: true, name: true, image: true } },
      _count: { select: { participants: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return challenges
}

export async function getChallenge(id) {
  return prisma.wellnessChallenge.findUniqueOrThrow({
    where: { id },
    include: {
      creator: { select: { id: true, name: true, image: true } },
      participants: {
        include: {
          user: { select: { id: true, name: true, image: true } },
        },
        orderBy: { progress: 'desc' },
      },
      _count: { select: { participants: true } },
    },
  })
}

export async function updateChallenge(id, data) {
  const updateData = {}
  if (data.title !== undefined) updateData.title = data.title
  if (data.description !== undefined) updateData.description = data.description
  if (data.type !== undefined) updateData.type = data.type
  if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate)
  if (data.endDate !== undefined) updateData.endDate = new Date(data.endDate)
  if (data.goal !== undefined) updateData.goal = data.goal
  if (data.unit !== undefined) updateData.unit = data.unit
  if (data.isActive !== undefined) updateData.isActive = data.isActive

  return prisma.wellnessChallenge.update({
    where: { id },
    data: updateData,
    include: {
      creator: { select: { id: true, name: true, image: true } },
      _count: { select: { participants: true } },
    },
  })
}

export async function deleteChallenge(id) {
  return prisma.wellnessChallenge.delete({ where: { id } })
}

export async function joinChallenge(challengeId, userId) {
  return prisma.wellnessChallengeParticipant.create({
    data: { challengeId, userId },
    include: {
      user: { select: { id: true, name: true, image: true } },
      challenge: { select: { id: true, title: true, goal: true, unit: true } },
    },
  })
}

export async function updateProgress(challengeId, userId, progress) {
  const participant = await prisma.wellnessChallengeParticipant.findUniqueOrThrow({
    where: { challengeId_userId: { challengeId, userId } },
    include: { challenge: { select: { goal: true } } },
  })

  const newProgress = participant.progress + progress
  const goalReached = newProgress >= participant.challenge.goal

  return prisma.wellnessChallengeParticipant.update({
    where: { challengeId_userId: { challengeId, userId } },
    data: {
      progress: newProgress,
      completedAt: goalReached && !participant.completedAt ? new Date() : participant.completedAt,
    },
    include: {
      user: { select: { id: true, name: true, image: true } },
      challenge: { select: { id: true, title: true, goal: true, unit: true } },
    },
  })
}

export async function getChallengeLeaderboard(challengeId) {
  return prisma.wellnessChallengeParticipant.findMany({
    where: { challengeId },
    include: {
      user: { select: { id: true, name: true, image: true } },
    },
    orderBy: { progress: 'desc' },
  })
}

export async function getActiveChallenges() {
  const now = new Date()
  return prisma.wellnessChallenge.findMany({
    where: {
      isActive: true,
      endDate: { gte: now },
    },
    include: {
      creator: { select: { id: true, name: true, image: true } },
      _count: { select: { participants: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getMyChallenges(userId) {
  const participations = await prisma.wellnessChallengeParticipant.findMany({
    where: { userId },
    include: {
      challenge: {
        include: {
          creator: { select: { id: true, name: true, image: true } },
          _count: { select: { participants: true } },
        },
      },
    },
    orderBy: { joinedAt: 'desc' },
  })

  return participations.map(p => ({
    ...p.challenge,
    myProgress: p.progress,
    myCompletedAt: p.completedAt,
    joinedAt: p.joinedAt,
  }))
}
