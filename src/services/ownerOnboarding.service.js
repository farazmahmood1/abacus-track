import prisma from '../config/prisma.js'

/**
 * Get owner onboarding data (user profile + company details)
 */
export async function getOwnerOnboardingData(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      designation: true,
      isProfileCompleted: true,
      companyId: true,
      company: {
        select: {
          id: true,
          name: true,
          description: true,
          industry: true,
          teamSize: true,
          website: true,
          companyAddress: true,
          timezone: true,
          workingHours: true,
        },
      },
    },
  })

  if (!user) throw new Error('User not found')
  return user
}

/**
 * Update owner profile (phone, designation)
 */
export async function updateOwnerProfile(userId, data) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      phone: data.phone || null,
      designation: data.designation || null,
    },
    select: {
      id: true,
      phone: true,
      designation: true,
    },
  })
}

/**
 * Update company details (description, industry, teamSize, website, address)
 */
export async function updateCompanyDetails(companyId, data) {
  return prisma.company.update({
    where: { id: companyId },
    data: {
      description: data.description || null,
      industry: data.industry || null,
      teamSize: data.teamSize || null,
      website: data.website || null,
      companyAddress: data.companyAddress || null,
    },
  })
}

/**
 * Update work setup (timezone, workingHours)
 */
export async function updateWorkSetup(companyId, data) {
  return prisma.company.update({
    where: { id: companyId },
    data: {
      timezone: data.timezone || null,
      workingHours: data.workingHours || null,
    },
  })
}

/**
 * Complete owner onboarding
 */
export async function completeOwnerOnboarding(userId) {
  return prisma.user.update({
    where: { id: userId },
    data: { isProfileCompleted: true },
    select: { id: true, isProfileCompleted: true },
  })
}
