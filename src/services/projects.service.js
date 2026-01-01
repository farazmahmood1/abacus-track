import prisma from '../config/prisma.js'

const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 10

export async function list({
  page = DEFAULT_PAGE,
  limit = DEFAULT_LIMIT,
  status,
  departmentId,
  search,
}) {
  page = Number(page) || DEFAULT_PAGE
  limit = Math.min(Number(limit) || DEFAULT_LIMIT, 100)

  const whereConditions = []

  if (status) {
    whereConditions.push({ status })
  }

  if (departmentId) {
    whereConditions.push({ departmentId })
  }

  if (search) {
    whereConditions.push({
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ],
    })
  }

  const where = whereConditions.length > 0 ? { AND: whereConditions } : {}

  const [items, total] = await Promise.all([
    prisma.project.findMany({
      where,
      orderBy: [
        { status: 'asc' }, // ACTIVE comes before COMPLETED and INACTIVE (alphabetically)
        { createdAt: 'desc' }, // Then sort by creation date newest first
      ],
      skip: (page - 1) * limit,
      take: limit,
      include: {
        department: {
          select: { id: true, name: true },
        },
        members: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: {
            members: true,
            timerSessions: true,
            timesheets: true,
          },
        },
      },
    }),
    prisma.project.count({ where }),
  ])

  // Calculate total hours for each project
  const itemsWithHours = items.map(project => {
    return {
      ...project,
      totalHours: parseFloat((project.totalHoursWorked || 0).toFixed(2)),
      assignedUsers: project._count.members,
    }
  })

  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data: itemsWithHours,
  }
}

export async function getById(id) {
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      department: {
        select: { id: true, name: true },
      },
      members: {
        select: { id: true, name: true, email: true, role: true },
      },
      timerSessions: {
        include: {
          user: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      timesheets: {
        include: {
          user: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  })

  if (project) {
    project.totalHours = parseFloat((project.totalHoursWorked || 0).toFixed(2))
    project.assignedUsers = project.members.length
  }

  return project
}

export async function create({
  name,
  description,
  status,
  departmentId,
  memberIds = [],
}) {
  const project = await prisma.project.create({
    data: {
      name,
      description,
      status: status || 'ACTIVE',
      departmentId: departmentId || null,
      members: {
        connect: memberIds.map(id => ({ id })),
      },
    },
    include: {
      department: {
        select: { id: true, name: true },
      },
      members: {
        select: { id: true, name: true, email: true },
      },
    },
  })

  return project
}

export async function update(id, { name, description, status, departmentId, memberIds }) {
  const project = await prisma.project.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(description && { description }),
      ...(status && { status }),
      ...(departmentId !== undefined && { departmentId }),
      ...(memberIds && {
        members: {
          set: memberIds.map(id => ({ id })),
        },
      }),
    },
    include: {
      department: {
        select: { id: true, name: true },
      },
      members: {
        select: { id: true, name: true, email: true },
      },
    },
  })

  return project
}

export async function remove(id) {
  await prisma.project.delete({
    where: { id },
  })
}

export async function addMember(projectId, userId) {
  const project = await prisma.project.update({
    where: { id: projectId },
    data: {
      members: {
        connect: { id: userId },
      },
    },
    include: {
      members: {
        select: { id: true, name: true, email: true },
      },
    },
  })

  return project
}

export async function removeMember(projectId, userId) {
  const project = await prisma.project.update({
    where: { id: projectId },
    data: {
      members: {
        disconnect: { id: userId },
      },
    },
    include: {
      members: {
        select: { id: true, name: true, email: true },
      },
    },
  })

  return project
}

export async function getProjectHours(projectId) {
  const timerHours = await prisma.timerSession.aggregate({
    where: { projectId },
    _sum: { totalDuration: true },
  })

  const timesheetHours = await prisma.timesheet.aggregate({
    where: { projectId },
    _sum: { totalHours: true },
  })

  const timerTotalSeconds = timerHours._sum.totalDuration || 0
  const timesheetTotal = timesheetHours._sum.totalHours || 0
  const totalHours = timerTotalSeconds / 3600 + timesheetTotal

  return {
    timerHours: parseFloat((timerTotalSeconds / 3600).toFixed(2)),
    timesheetHours: parseFloat(timesheetTotal.toFixed(2)),
    totalHours: parseFloat(totalHours.toFixed(2)),
  }
}
