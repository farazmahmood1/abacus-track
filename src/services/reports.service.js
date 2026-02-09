import prisma from '../config/prisma.js'

// ===== APP USAGE REPORTS =====

/**
 * Get app usage report with time breakdown
 */
export async function getAppUsageReport({ userId, departmentId, startDate, endDate, limit = 20 }) {
  const where = {}
  if (userId) where.userId = userId
  if (startDate || endDate) {
    where.timestamp = {}
    if (startDate) where.timestamp.gte = new Date(startDate)
    if (endDate) where.timestamp.lte = new Date(endDate)
  }
  if (departmentId) {
    where.user = { departmentId }
  }

  // Get all activity logs grouped by appName
  const logs = await prisma.activityLog.groupBy({
    by: ['appName'],
    where: { ...where, appName: { not: null } },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: limit,
  })

  // Get category mappings
  const categories = await prisma.appCategory.findMany()
  const categoryMap = Object.fromEntries(categories.map((c) => [c.appName.toLowerCase(), c.category]))

  return logs.map((log) => ({
    appName: log.appName,
    count: log._count.id,
    // Each log entry is ~1 minute of activity
    estimatedMinutes: log._count.id,
    category: categoryMap[log.appName?.toLowerCase()] || 'UNCATEGORIZED',
  }))
}

/**
 * Get time per productivity category
 */
export async function getAppUsageByCategory({ userId, departmentId, startDate, endDate }) {
  const where = { appName: { not: null } }
  if (userId) where.userId = userId
  if (startDate || endDate) {
    where.timestamp = {}
    if (startDate) where.timestamp.gte = new Date(startDate)
    if (endDate) where.timestamp.lte = new Date(endDate)
  }
  if (departmentId) {
    where.user = { departmentId }
  }

  const logs = await prisma.activityLog.groupBy({
    by: ['appName'],
    where,
    _count: { id: true },
  })

  const categories = await prisma.appCategory.findMany()
  const categoryMap = Object.fromEntries(categories.map((c) => [c.appName.toLowerCase(), c.category]))

  const result = { PRODUCTIVE: 0, NEUTRAL: 0, UNPRODUCTIVE: 0, UNCATEGORIZED: 0 }

  for (const log of logs) {
    const cat = categoryMap[log.appName?.toLowerCase()] || 'UNCATEGORIZED'
    result[cat] += log._count.id
  }

  return result
}

// ===== APP CATEGORIES CRUD =====

export async function listAppCategories() {
  return prisma.appCategory.findMany({ orderBy: { appName: 'asc' } })
}

export async function upsertAppCategory(appName, category) {
  return prisma.appCategory.upsert({
    where: { appName: appName.toLowerCase() },
    create: { appName: appName.toLowerCase(), category },
    update: { category },
  })
}

export async function deleteAppCategory(id) {
  return prisma.appCategory.delete({ where: { id } })
}

// ===== IDLE TIME REPORTS =====

/**
 * Get idle time report
 */
export async function getIdleTimeReport({ userId, departmentId, startDate, endDate }) {
  const where = {}
  if (userId) where.userId = userId
  if (startDate || endDate) {
    where.timestamp = {}
    if (startDate) where.timestamp.gte = new Date(startDate)
    if (endDate) where.timestamp.lte = new Date(endDate)
  }
  if (departmentId) {
    where.user = { departmentId }
  }

  const [totalLogs, idleLogs] = await Promise.all([
    prisma.activityLog.count({ where }),
    prisma.activityLog.count({ where: { ...where, isIdle: true } }),
  ])

  const idlePercentage = totalLogs > 0 ? ((idleLogs / totalLogs) * 100).toFixed(1) : 0

  return {
    totalLogs,
    idleLogs,
    activeLogs: totalLogs - idleLogs,
    idlePercentage: parseFloat(idlePercentage),
    idleMinutes: idleLogs,
    activeMinutes: totalLogs - idleLogs,
  }
}

/**
 * Get idle time summary per employee
 */
export async function getIdleTimeSummary({ departmentId, startDate, endDate }) {
  const where = {}
  if (startDate || endDate) {
    where.timestamp = {}
    if (startDate) where.timestamp.gte = new Date(startDate)
    if (endDate) where.timestamp.lte = new Date(endDate)
  }
  if (departmentId) {
    where.user = { departmentId }
  }

  const allLogs = await prisma.activityLog.groupBy({
    by: ['userId'],
    where,
    _count: { id: true },
  })

  const idleLogs = await prisma.activityLog.groupBy({
    by: ['userId'],
    where: { ...where, isIdle: true },
    _count: { id: true },
  })

  const idleMap = Object.fromEntries(idleLogs.map((l) => [l.userId, l._count.id]))

  // Get user info
  const userIds = allLogs.map((l) => l.userId)
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true, image: true, departmentId: true },
  })
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]))

  return allLogs.map((log) => {
    const idle = idleMap[log.userId] || 0
    const total = log._count.id
    return {
      user: userMap[log.userId],
      totalMinutes: total,
      idleMinutes: idle,
      activeMinutes: total - idle,
      idlePercentage: total > 0 ? parseFloat(((idle / total) * 100).toFixed(1)) : 0,
    }
  }).sort((a, b) => b.idlePercentage - a.idlePercentage)
}

// ===== ATTENDANCE HEATMAP =====

/**
 * Get attendance heatmap data for a user/month
 */
export async function getAttendanceHeatmap({ userId, year, month }) {
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0) // Last day of month

  // Get timesheets for the period
  const timesheets = await prisma.timesheet.findMany({
    where: {
      userId,
      workDate: { gte: startDate, lte: endDate },
    },
    orderBy: { workDate: 'asc' },
  })

  // Get leaves for the period
  const leaves = await prisma.leave.findMany({
    where: {
      employeeId: userId,
      status: 'APPROVED',
      startDate: { lte: endDate },
      endDate: { gte: startDate },
    },
  })

  // Get deviations
  const deviations = await prisma.attendanceDeviation.findMany({
    where: {
      userId,
      date: { gte: startDate, lte: endDate },
    },
  })

  // Build day-by-day map
  const days = []
  const current = new Date(startDate)
  while (current <= endDate) {
    const dateStr = current.toISOString().split('T')[0]
    const timesheet = timesheets.find(
      (t) => t.workDate.toISOString().split('T')[0] === dateStr
    )
    const hasLeave = leaves.some(
      (l) => l.startDate <= current && l.endDate >= current
    )
    const deviation = deviations.find(
      (d) => d.date.toISOString().split('T')[0] === dateStr
    )

    let status = 'absent'
    if (hasLeave) status = 'leave'
    else if (timesheet) {
      if (deviation?.lateMinutes > 0) status = 'late'
      else if (timesheet.totalHours && timesheet.totalHours < 4) status = 'half-day'
      else status = 'present'
    }

    days.push({
      date: dateStr,
      status,
      hours: timesheet?.totalHours || 0,
      isWeekend: current.getDay() === 0 || current.getDay() === 6,
    })

    current.setDate(current.getDate() + 1)
  }

  return days
}

// ===== DEPARTMENT COMPARISON =====

/**
 * Get department comparison data
 */
export async function getDepartmentComparison({ startDate, endDate }) {
  const departments = await prisma.department.findMany({
    include: { employees: { select: { id: true } } },
  })

  const dateWhere = {}
  if (startDate || endDate) {
    dateWhere.gte = startDate ? new Date(startDate) : undefined
    dateWhere.lte = endDate ? new Date(endDate) : undefined
  }

  const result = await Promise.all(
    departments.map(async (dept) => {
      const userIds = dept.employees.map((e) => e.id)
      if (userIds.length === 0) {
        return {
          department: { id: dept.id, name: dept.name },
          headcount: 0,
          avgHours: 0,
          overtimeCount: 0,
          leaveCount: 0,
          lateArrivals: 0,
        }
      }

      const [timesheets, overtime, leaves, deviations] = await Promise.all([
        prisma.timesheet.aggregate({
          where: {
            userId: { in: userIds },
            ...(Object.keys(dateWhere).length ? { workDate: dateWhere } : {}),
          },
          _avg: { totalHours: true },
        }),
        prisma.overtimeRecord.count({
          where: {
            userId: { in: userIds },
            overtimeHours: { gt: 0 },
            ...(Object.keys(dateWhere).length ? { date: dateWhere } : {}),
          },
        }),
        prisma.leave.count({
          where: {
            employeeId: { in: userIds },
            status: 'APPROVED',
            ...(Object.keys(dateWhere).length ? { startDate: dateWhere } : {}),
          },
        }),
        prisma.attendanceDeviation.count({
          where: {
            userId: { in: userIds },
            lateMinutes: { gt: 0 },
            ...(Object.keys(dateWhere).length ? { date: dateWhere } : {}),
          },
        }),
      ])

      return {
        department: { id: dept.id, name: dept.name },
        headcount: userIds.length,
        avgHours: parseFloat((timesheets._avg.totalHours || 0).toFixed(1)),
        overtimeCount: overtime,
        leaveCount: leaves,
        lateArrivals: deviations,
      }
    })
  )

  return result
}

// ===== EMPLOYEE TRENDS =====

/**
 * Get individual employee trends over weeks
 */
export async function getEmployeeTrends({ userId, weeks = 12 }) {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - weeks * 7)

  const [timesheets, overtime, deviations, activityLogs] = await Promise.all([
    prisma.timesheet.findMany({
      where: { userId, workDate: { gte: startDate, lte: endDate } },
      orderBy: { workDate: 'asc' },
    }),
    prisma.overtimeRecord.findMany({
      where: { userId, date: { gte: startDate, lte: endDate } },
    }),
    prisma.attendanceDeviation.findMany({
      where: { userId, date: { gte: startDate, lte: endDate } },
    }),
    prisma.activityLog.findMany({
      where: { userId, timestamp: { gte: startDate, lte: endDate } },
      select: { timestamp: true, isIdle: true },
    }),
  ])

  // Group by week
  const weeklyData = {}

  for (const ts of timesheets) {
    const weekKey = getWeekKey(ts.workDate)
    if (!weeklyData[weekKey]) weeklyData[weekKey] = { totalHours: 0, overtimeHours: 0, lateArrivals: 0, totalLogs: 0, idleLogs: 0 }
    weeklyData[weekKey].totalHours += ts.totalHours || 0
  }

  for (const ot of overtime) {
    const weekKey = getWeekKey(ot.date)
    if (!weeklyData[weekKey]) weeklyData[weekKey] = { totalHours: 0, overtimeHours: 0, lateArrivals: 0, totalLogs: 0, idleLogs: 0 }
    weeklyData[weekKey].overtimeHours += ot.overtimeHours
  }

  for (const d of deviations) {
    const weekKey = getWeekKey(d.date)
    if (!weeklyData[weekKey]) weeklyData[weekKey] = { totalHours: 0, overtimeHours: 0, lateArrivals: 0, totalLogs: 0, idleLogs: 0 }
    if (d.lateMinutes > 0) weeklyData[weekKey].lateArrivals++
  }

  for (const log of activityLogs) {
    const weekKey = getWeekKey(log.timestamp)
    if (!weeklyData[weekKey]) weeklyData[weekKey] = { totalHours: 0, overtimeHours: 0, lateArrivals: 0, totalLogs: 0, idleLogs: 0 }
    weeklyData[weekKey].totalLogs++
    if (log.isIdle) weeklyData[weekKey].idleLogs++
  }

  return Object.entries(weeklyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, data]) => ({
      period,
      totalHours: parseFloat(data.totalHours.toFixed(1)),
      overtimeHours: parseFloat(data.overtimeHours.toFixed(1)),
      lateArrivals: data.lateArrivals,
      idlePercentage: data.totalLogs > 0 ? parseFloat(((data.idleLogs / data.totalLogs) * 100).toFixed(1)) : 0,
    }))
}

// ===== COST ANALYSIS =====

/**
 * Get cost per project
 */
export async function getCostAnalysis({ startDate, endDate }) {
  const dateWhere = {}
  if (startDate) dateWhere.gte = new Date(startDate)
  if (endDate) dateWhere.lte = new Date(endDate)

  const projects = await prisma.project.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true, name: true },
  })

  const result = await Promise.all(
    projects.map(async (project) => {
      const timesheets = await prisma.timesheet.findMany({
        where: {
          projectId: project.id,
          ...(Object.keys(dateWhere).length ? { workDate: dateWhere } : {}),
        },
        include: {
          user: { select: { id: true, name: true, salary: true } },
        },
      })

      let totalHours = 0
      let totalCost = 0
      const teamMembers = new Set()

      for (const ts of timesheets) {
        totalHours += ts.totalHours || 0
        teamMembers.add(ts.userId)

        // Calculate hourly rate: monthly salary / (22 working days * 8 hours)
        if (ts.user?.salary) {
          const hourlyRate = ts.user.salary / (22 * 8)
          totalCost += hourlyRate * (ts.totalHours || 0)
        }
      }

      return {
        projectId: project.id,
        projectName: project.name,
        totalHours: parseFloat(totalHours.toFixed(1)),
        totalCost: parseFloat(totalCost.toFixed(0)),
        avgHourlyCost: totalHours > 0 ? parseFloat((totalCost / totalHours).toFixed(0)) : 0,
        teamSize: teamMembers.size,
      }
    })
  )

  return result.sort((a, b) => b.totalCost - a.totalCost)
}

/**
 * Get cost per department
 */
export async function getCostByDepartment({ startDate, endDate }) {
  const dateWhere = {}
  if (startDate) dateWhere.gte = new Date(startDate)
  if (endDate) dateWhere.lte = new Date(endDate)

  const departments = await prisma.department.findMany({
    include: { employees: { select: { id: true, name: true, salary: true } } },
  })

  return departments.map((dept) => {
    let totalSalary = 0
    for (const emp of dept.employees) {
      totalSalary += emp.salary || 0
    }

    return {
      departmentId: dept.id,
      departmentName: dept.name,
      headcount: dept.employees.length,
      totalMonthlySalary: totalSalary,
    }
  })
}

// ===== HELPERS =====

function getWeekKey(date) {
  const d = new Date(date)
  const dayOfWeek = d.getDay()
  const monday = new Date(d)
  monday.setDate(d.getDate() - ((dayOfWeek + 6) % 7))
  return monday.toISOString().split('T')[0]
}
