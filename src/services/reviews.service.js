import prisma from '../config/prisma.js'
import ApiError from '../utils/ApiError.js'

export async function createCycle(data) {
  return prisma.reviewCycle.create({ data: {
    name: data.name,
    startDate: new Date(data.startDate),
    endDate: new Date(data.endDate),
  }})
}

export async function listCycles() {
  return prisma.reviewCycle.findMany({
    include: { reviews: { select: { id: true, status: true } } },
    orderBy: { startDate: 'desc' },
  })
}

export async function activateCycle(id) {
  return prisma.reviewCycle.update({ where: { id }, data: { status: 'ACTIVE' } })
}

export async function completeCycle(id) {
  return prisma.reviewCycle.update({ where: { id }, data: { status: 'COMPLETED' } })
}

export async function createReview(data) {
  const review = await prisma.review.create({
    data: {
      cycleId: data.cycleId,
      employeeId: data.employeeId,
      reviewerId: data.reviewerId,
      goals: data.goals?.length ? {
        create: data.goals.map(g => ({ title: g.title, description: g.description, weight: g.weight || 1 })),
      } : undefined,
    },
    include: { employee: { select: { id: true, name: true } }, reviewer: { select: { id: true, name: true } }, goals: true },
  })
  return review
}

export async function getMyReviews(userId) {
  return prisma.review.findMany({
    where: { employeeId: userId },
    include: {
      cycle: true,
      reviewer: { select: { id: true, name: true } },
      goals: true,
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getReviewsToReview(userId) {
  return prisma.review.findMany({
    where: { reviewerId: userId },
    include: {
      cycle: true,
      employee: { select: { id: true, name: true, email: true, image: true } },
      goals: true,
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getReview(id) {
  const review = await prisma.review.findUnique({
    where: { id },
    include: {
      cycle: true,
      employee: { select: { id: true, name: true, email: true, image: true } },
      reviewer: { select: { id: true, name: true } },
      goals: true,
    },
  })
  if (!review) throw new ApiError(404, 'Review not found')
  return review
}

export async function submitReview(id, data) {
  const existing = await prisma.review.findUnique({ where: { id }, include: { goals: true } })
  if (!existing) throw new ApiError(404, 'Review not found')

  // Update goals ratings if provided
  if (data.goals) {
    for (const goal of data.goals) {
      if (goal.id) {
        await prisma.reviewGoal.update({
          where: { id: goal.id },
          data: { rating: goal.rating },
        })
      }
    }
  }

  return prisma.review.update({
    where: { id },
    data: {
      overallRating: data.overallRating,
      strengths: data.strengths,
      improvements: data.improvements,
      comments: data.comments,
      status: 'SUBMITTED',
      submittedAt: new Date(),
    },
    include: { goals: true, employee: { select: { id: true, name: true } } },
  })
}

export async function acknowledgeReview(id) {
  return prisma.review.update({
    where: { id },
    data: { status: 'ACKNOWLEDGED' },
  })
}
