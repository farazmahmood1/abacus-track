import prisma from '../config/prisma.js'

/**
 * Get user profile and onboarding data
 */
export async function getOnboardingData(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      uniqueId: true,
      image: true,
      name: true,
      email: true,
      phone: true,
      address: true,
      salary: true,
      role: true,
      createdAt: true,
      isProfileCompleted: true,
      departmentId: true,
      githubUrl: true,
      linkedinUrl: true,
      department: {
        select: {
          id: true,
          name: true,
        },
      },
      profile: true,
      experiences: {
        orderBy: { createdAt: 'desc' },
      },
      educations: {
        orderBy: { createdAt: 'desc' },
      },
      skills: {
        orderBy: { createdAt: 'desc' },
      },
      timerSessions: {
        where: {
          isActive: true,
        },
        orderBy: { startTime: 'desc' },
        take: 1,
        select: {
          isActive: true,
          isPaused: true,
          pauseLogs: {
            where: { resumedAt: null },
            orderBy: { pausedAt: 'desc' },
            take: 1,
          },
        },
      },
    },
  })

  if (!user) {
    throw new Error('User not found')
  }

  // Determine status based on active session
  let status = 'Offline'
  let isOnline = false

  const activeSession = user.timerSessions?.[0]
  if (activeSession?.isActive && !activeSession?.isPaused) {
    // Check if user is on break
    if (activeSession.pauseLogs && activeSession.pauseLogs.length > 0) {
      status = 'Break'
    } else {
      status = 'Online'
      isOnline = true
    }
  }

  return {
    ...user,
    status,
    isOnline,
  }
}

/**
 * Update or create user profile (About tab)
 */
export async function updateProfile(userId, data) {
  const profile = await prisma.profile.upsert({
    where: { userId },
    update: {
      about: data.about,
    },
    create: {
      userId,
      about: data.about,
    },
  })

  return profile
}

/**
 * Add user experience
 */
export async function addExperience(userId, data) {
  const experience = await prisma.userExperience.create({
    data: {
      userId,
      position: data.position,
      company: data.company,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
      description: data.description || null,
    },
  })

  return experience
}

/**
 * Update user experience
 */
export async function updateExperience(experienceId, data) {
  const experience = await prisma.userExperience.update({
    where: { id: experienceId },
    data: {
      position: data.position,
      company: data.company,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
      description: data.description || null,
    },
  })

  return experience
}

/**
 * Delete user experience
 */
export async function deleteExperience(experienceId) {
  await prisma.userExperience.delete({
    where: { id: experienceId },
  })
}

/**
 * Add user education
 */
export async function addEducation(userId, data) {
  const education = await prisma.userEducation.create({
    data: {
      userId,
      educationName: data.educationName,
      institute: data.institute,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
      description: data.description || null,
    },
  })

  return education
}

/**
 * Update user education
 */
export async function updateEducation(educationId, data) {
  const education = await prisma.userEducation.update({
    where: { id: educationId },
    data: {
      educationName: data.educationName,
      institute: data.institute,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
      description: data.description || null,
    },
  })

  return education
}

/**
 * Delete user education
 */
export async function deleteEducation(educationId) {
  await prisma.userEducation.delete({
    where: { id: educationId },
  })
}

/**
 * Add user skill
 */
export async function addSkill(userId, skillName) {
  const skill = await prisma.userSkill.create({
    data: {
      userId,
      skillName,
    },
  })

  return skill
}

/**
 * Delete user skill
 */
export async function deleteSkill(skillId) {
  await prisma.userSkill.delete({
    where: { id: skillId },
  })
}

/**
 * Complete onboarding - mark profile as completed
 */
export async function completeOnboarding(userId) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      isProfileCompleted: true,
    },
    select: {
      id: true,
      isProfileCompleted: true,
    },
  })

  return user
}
