import prisma from '../config/prisma.js'

const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 10

export async function list({
  page = DEFAULT_PAGE,
  limit = DEFAULT_LIMIT,
  category,
  departmentId,
}) {
  page = Number(page) || DEFAULT_PAGE
  limit = Math.min(Number(limit) || DEFAULT_LIMIT, 100)

  const whereConditions = []

  if (category) {
    whereConditions.push({ category })
  }

  if (departmentId) {
    whereConditions.push({
      departmentId: departmentId,
    })
  }

  const where = whereConditions.length > 0 ? { AND: whereConditions } : {}

  const [items, total] = await Promise.all([
    prisma.announcement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        department: {
          select: { id: true, name: true },
        },
      },
    }),
    prisma.announcement.count({ where }),
  ])

  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data: items,
  }
}

export async function getById(id) {
  return prisma.announcement.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      department: { select: { id: true, name: true } },
    },
  })
}

export async function create(payload) {
  const announcement = await prisma.announcement.create({ data: payload })

  // Create announcements notifications for relevant employees (async, don't wait)
  createAnnouncementNotifications(announcement).catch(error => {
    console.error('Error creating announcement notifications:', error)
  })

  return announcement
}

/**
 * Create announcement notifications for employees based on department targeting
 * If departmentId is null, notify all employees (company-wide announcement)
 * Otherwise, notify only employees in that department
 */
async function createAnnouncementNotifications(announcement) {
  try {
    console.log(
      'Creating notifications for announcement:',
      announcement.id,
      'departmentId:',
      announcement.departmentId
    )

    let employees = []

    if (announcement.departmentId === null) {
      // Get all employees (company-wide announcement) - include those without a department
      employees = await prisma.user.findMany({
        where: {
          role: { not: 'ADMIN' },
        },
        select: { id: true },
      })
      console.log(`Found ${employees.length} employees for all-department announcement`)
    } else {
      // Get employees in specific department
      employees = await prisma.user.findMany({
        where: {
          departmentId: announcement.departmentId,
          role: { not: 'ADMIN' },
        },
        select: { id: true },
      })
      console.log(
        `Found ${employees.length} employees in department ${announcement.departmentId}`
      )
    }

    if (employees.length === 0) {
      console.log('No employees found for this announcement')
      return
    }

    // Create announcement notifications for all target employees
    const notificationData = employees.map(emp => ({
      announcementId: announcement.id,
      employeeId: emp.id,
    }))

    const result = await prisma.announcementNotification.createMany({
      data: notificationData,
    })
    console.log(`Successfully created ${result.count} announcement notifications`)
  } catch (error) {
    console.error('Error creating announcement notifications:', error.message)
    // Don't throw - announcement is already created
  }
}

export async function update(id, payload) {
  return prisma.announcement.update({ where: { id }, data: payload })
}

export async function remove(id) {
  return prisma.announcement.delete({ where: { id } })
}
