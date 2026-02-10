import prisma from '../config/prisma.js'

export async function getUpcomingMilestones(days = 30) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const endDate = new Date(today)
  endDate.setDate(endDate.getDate() + days)

  // Get all users with dateOfBirth or joinDate
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { dateOfBirth: { not: null } },
        { joinDate: { not: null } },
      ],
    },
    select: {
      id: true,
      name: true,
      image: true,
      dateOfBirth: true,
      joinDate: true,
    },
  })

  const milestones = []
  const currentYear = today.getFullYear()

  for (const user of users) {
    // Check birthday
    if (user.dateOfBirth) {
      const dob = new Date(user.dateOfBirth)
      const birthdayThisYear = new Date(currentYear, dob.getMonth(), dob.getDate())
      birthdayThisYear.setHours(0, 0, 0, 0)

      // If birthday already passed this year, check next year
      let upcomingBirthday = birthdayThisYear
      if (birthdayThisYear < today) {
        upcomingBirthday = new Date(currentYear + 1, dob.getMonth(), dob.getDate())
        upcomingBirthday.setHours(0, 0, 0, 0)
      }

      if (upcomingBirthday >= today && upcomingBirthday <= endDate) {
        const age = upcomingBirthday.getFullYear() - dob.getFullYear()
        milestones.push({
          userId: user.id,
          userName: user.name,
          userImage: user.image,
          type: 'BIRTHDAY',
          eventDate: upcomingBirthday.toISOString(),
          detail: `Turning ${age}`,
          daysUntil: Math.ceil((upcomingBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
        })
      }
    }

    // Check work anniversary
    if (user.joinDate) {
      const jd = new Date(user.joinDate)
      const anniversaryThisYear = new Date(currentYear, jd.getMonth(), jd.getDate())
      anniversaryThisYear.setHours(0, 0, 0, 0)

      let upcomingAnniversary = anniversaryThisYear
      if (anniversaryThisYear < today) {
        upcomingAnniversary = new Date(currentYear + 1, jd.getMonth(), jd.getDate())
        upcomingAnniversary.setHours(0, 0, 0, 0)
      }

      // Only show if they have been at the company at least 1 year
      const years = upcomingAnniversary.getFullYear() - jd.getFullYear()
      if (years >= 1 && upcomingAnniversary >= today && upcomingAnniversary <= endDate) {
        milestones.push({
          userId: user.id,
          userName: user.name,
          userImage: user.image,
          type: 'WORK_ANNIVERSARY',
          eventDate: upcomingAnniversary.toISOString(),
          detail: `${years} year${years > 1 ? 's' : ''} at the company`,
          daysUntil: Math.ceil((upcomingAnniversary.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
        })
      }
    }
  }

  // Sort by daysUntil ascending
  milestones.sort((a, b) => a.daysUntil - b.daysUntil)

  return milestones
}

export async function getTodayMilestones() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { dateOfBirth: { not: null } },
        { joinDate: { not: null } },
      ],
    },
    select: {
      id: true,
      name: true,
      image: true,
      dateOfBirth: true,
      joinDate: true,
    },
  })

  const milestones = []
  const todayMonth = today.getMonth()
  const todayDate = today.getDate()

  for (const user of users) {
    if (user.dateOfBirth) {
      const dob = new Date(user.dateOfBirth)
      if (dob.getMonth() === todayMonth && dob.getDate() === todayDate) {
        const age = today.getFullYear() - dob.getFullYear()
        milestones.push({
          userId: user.id,
          userName: user.name,
          userImage: user.image,
          type: 'BIRTHDAY',
          eventDate: today.toISOString(),
          detail: `Turning ${age} today!`,
        })
      }
    }

    if (user.joinDate) {
      const jd = new Date(user.joinDate)
      if (jd.getMonth() === todayMonth && jd.getDate() === todayDate) {
        const years = today.getFullYear() - jd.getFullYear()
        if (years >= 1) {
          milestones.push({
            userId: user.id,
            userName: user.name,
            userImage: user.image,
            type: 'WORK_ANNIVERSARY',
            eventDate: today.toISOString(),
            detail: `${years} year${years > 1 ? 's' : ''} work anniversary!`,
          })
        }
      }
    }
  }

  return milestones
}

export async function updateUserDates(userId, { dateOfBirth, joinDate }) {
  const updateData = {}
  if (dateOfBirth !== undefined) {
    updateData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null
  }
  if (joinDate !== undefined) {
    updateData.joinDate = joinDate ? new Date(joinDate) : null
  }

  return prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      name: true,
      dateOfBirth: true,
      joinDate: true,
    },
  })
}

export async function createMilestoneEvent(userId, type, eventDate, year) {
  return prisma.milestoneEvent.upsert({
    where: {
      userId_type_year: { userId, type, year },
    },
    create: {
      userId,
      type,
      eventDate: new Date(eventDate),
      year,
    },
    update: {
      eventDate: new Date(eventDate),
    },
  })
}
