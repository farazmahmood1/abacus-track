import prisma from '../config/prisma.js'

/**
 * Get comprehensive dashboard data with filters
 * Supports filtering by department, project, and date range
 */
export const getDashboardData = async (filters = {}) => {
  const { departmentId, projectId, startDate, endDate } = filters

  // Build where clauses for date range filters
  const dateFilter = {}
  if (startDate || endDate) {
    if (startDate && endDate) {
      // For timesheets and timer sessions
      dateFilter.workDate = {
        gte: startDate,
        lte: endDate,
      }
    } else if (startDate) {
      dateFilter.workDate = { gte: startDate }
    } else if (endDate) {
      dateFilter.workDate = { lte: endDate }
    }
  }

  // Build department/project filter for users
  const userFilter = {
    role: { not: 'admin' },
  }
  if (departmentId && departmentId !== 'all') {
    userFilter.departmentId = departmentId
  }

  // Get all employees (non-admin)
  const allEmployees = await prisma.user.findMany({
    where: userFilter,
    select: {
      id: true,
      banned: true,
    },
  })

  const employeeIds = allEmployees.map(e => e.id)

  // Active employees = non-banned accounts
  const activeEmployees = allEmployees.filter(e => !e.banned).length
  // Inactive employees = banned/deactivated accounts
  const inactiveEmployees = allEmployees.filter(e => e.banned).length

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)

  // Build filter for timesheets
  const timesheetFilter = {
    ...dateFilter,
    user: userFilter,
  }
  if (projectId && projectId !== 'all') {
    timesheetFilter.projectId = projectId
  }

  // Get total hours logged
  const timesheets = await prisma.timesheet.findMany({
    where: timesheetFilter,
  })
  const totalHoursLogged = timesheets.reduce((sum, ts) => sum + (ts.totalHours || 0), 0)

  // Build filter for timer sessions
  const timerSessionFilter = {
    user: userFilter,
  }

  // For timer sessions with time-based date range
  const timerDateFilter = {}
  if (startDate || endDate) {
    if (startDate && endDate) {
      timerDateFilter.startTime = {
        gte: startDate,
        lte: endDate,
      }
    } else if (startDate) {
      timerDateFilter.startTime = { gte: startDate }
    } else if (endDate) {
      timerDateFilter.startTime = { lte: endDate }
    }
  }
  Object.assign(timerSessionFilter, timerDateFilter)

  if (projectId && projectId !== 'all') {
    timerSessionFilter.projectId = projectId
  }

  // Get check-ins and check-outs
  const checkInSessions = await prisma.timerSession.findMany({
    where: timerSessionFilter,
    distinct: ['userId'],
    select: { userId: true },
  })
  const checkInToday = checkInSessions.length

  const checkOutSessions = await prisma.timerSession.findMany({
    where: {
      ...timerSessionFilter,
      endTime: { not: null },
    },
    distinct: ['userId'],
    select: { userId: true },
  })
  const checkOutToday = checkOutSessions.length

  // Get on leave count
  const leaveFilter = {
    status: 'APPROVED',
    employee: userFilter,
  }

  if (startDate || endDate) {
    const rangeFilter = {}
    if (startDate && endDate) {
      // Leaves that overlap with the date range
      rangeFilter.AND = [{ startDate: { lte: endDate } }, { endDate: { gte: startDate } }]
    } else if (startDate) {
      rangeFilter.endDate = { gte: startDate }
    } else if (endDate) {
      rangeFilter.startDate = { lte: endDate }
    }
    Object.assign(leaveFilter, rangeFilter)
  }

  if (projectId && projectId !== 'all') {
    // For now, leaves don't have direct project association
    // This filter is for consistency
  }

  const onLeaveCount = await prisma.leave.count({
    where: leaveFilter,
  })

  // Calculate weekly hours
  const weeklyHours = await calculateWeeklyHours(timesheetFilter)

  return {
    stats: {
      activeEmployees,
      inactiveEmployees,
      totalHoursLogged: parseFloat(totalHoursLogged.toFixed(2)),
      checkInToday,
      checkOutToday,
      onLeave: onLeaveCount,
    },
    weeklyHours,
  }
}

/**
 * Calculate weekly breakdown of hours
 */
const calculateWeeklyHours = async timesheetFilter => {
  const timesheets = await prisma.timesheet.findMany({
    where: timesheetFilter,
    select: {
      workDate: true,
      totalHours: true,
    },
  })

  // Group by week
  const weekMap = new Map()
  timesheets.forEach(ts => {
    const date = new Date(ts.workDate)
    const weekStart = getWeekStart(date)
    const weekLabel = formatWeekLabel(weekStart)

    if (!weekMap.has(weekLabel)) {
      weekMap.set(weekLabel, 0)
    }
    weekMap.set(weekLabel, weekMap.get(weekLabel) + (ts.totalHours || 0))
  })

  // Convert to array format
  const weeks = Array.from(weekMap.entries())
    .map(([week, hours]) => ({
      week,
      hours: parseFloat(hours.toFixed(2)),
      percentage: `${parseFloat((hours || 0).toFixed(1))}%`,
    }))
    .sort((a, b) => a.week.localeCompare(b.week))

  // Return last 5 weeks or available weeks
  return weeks.slice(-5)
}

/**
 * Get the start date of the week (Monday)
 */
const getWeekStart = date => {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // adjust when day is Sunday
  return new Date(d.setDate(diff))
}

/**
 * Format week label as "Week of Dec 16"
 */
const formatWeekLabel = date => {
  const options = { month: 'short', day: 'numeric' }
  return `Week of ${date.toLocaleDateString('en-US', options)}`
}
