import prisma from '../src/config/prisma.js'
import { hashPassword } from 'better-auth/crypto'

// ─── Helpers ────────────────────────────────────────────────────
const pick = arr => arr[Math.floor(Math.random() * arr.length)]
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
const daysAgo = n => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}
const dateOnly = d => {
  const iso = new Date(d)
  iso.setUTCHours(0, 0, 0, 0)
  return iso
}

// ─── Static Data ────────────────────────────────────────────────
const departmentNames = ['HR', 'IT', 'SALES', 'MARKETING', 'FINANCE', 'OPERATIONS', 'ADMINISTRATION']

const firstNames = [
  'Muhammad', 'Ahmed', 'Ali', 'Hassan', 'Ibrahim', 'Omar', 'Khalid',
  'Fatima', 'Aisha', 'Zainab', 'Layla', 'Noor', 'Sara', 'Hana',
  'Leila', 'Rania', 'Abdullah', 'Mustafa', 'Yusuf', 'Karim',
  'Rashid', 'Tariq', 'Jamal', 'Nabil', 'Amina', 'Yasmine',
  'Dina', 'Sophia', 'Mariam', 'Hiba', 'Rana', 'Maha',
  'Hamza', 'Waleed', 'Samir', 'Basem', 'Farah', 'Lina', 'Nina', 'Yara',
]

const lastNames = [
  'Ahmed', 'Hassan', 'Khan', 'Ali', 'Ibrahim', 'Mohammed', 'Abdullah',
  'Salem', 'Rashid', 'Mansour', 'Malik', 'Rahman', 'Amin', 'Aziz',
  'Hani', 'Jamal', 'Karim', 'Kareem', 'Latif', 'Majid', 'Nasir',
  'Qadir', 'Saleh', 'Samir',
]

// ────────────────────────────────────────────────────────────────
async function main() {
  console.log('🌱 Starting comprehensive seed...\n')

  // ─── 0. Cleanup (prevent duplicates on re-run) ────────────────
  console.log('🧹 Cleaning existing seed data...')
  // Delete in reverse dependency order to avoid FK constraint errors
  await prisma.message.deleteMany()
  await prisma.conversationParticipant.deleteMany()
  await prisma.conversation.deleteMany()
  await prisma.chatNotification.deleteMany()
  await prisma.calendarEvent.deleteMany()
  await prisma.holiday.deleteMany()
  await prisma.wellnessEntry.deleteMany()
  await prisma.moodEntry.deleteMany()
  await prisma.userBadge.deleteMany()
  await prisma.gamificationPoints.deleteMany()
  await prisma.badge.deleteMany()
  await prisma.milestone.deleteMany()
  await prisma.scheduledReport.deleteMany()
  await prisma.integration.deleteMany()
  await prisma.offboardingChecklist.deleteMany()
  await prisma.bonusCommission.deleteMany()
  await prisma.expense.deleteMany()
  await prisma.document.deleteMany()
  await prisma.assetAssignment.deleteMany()
  await prisma.asset.deleteMany()
  await prisma.feedbackSubmission.deleteMany()
  await prisma.standupEntry.deleteMany()
  await prisma.reviewEntry.deleteMany()
  await prisma.reviewCycle.deleteMany()
  await prisma.shiftSwapRequest.deleteMany()
  await prisma.shiftScheduleEntry.deleteMany()
  await prisma.regularization.deleteMany()
  await prisma.deviationLog.deleteMany()
  await prisma.overtimeEntry.deleteMany()
  await prisma.activityLog.deleteMany()
  await prisma.timesheet.deleteMany()
  await prisma.timerSession.deleteMany()
  await prisma.announcement.deleteMany()
  await prisma.leaveRequest.deleteMany()
  await prisma.leaveBalance.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.userShift.deleteMany()
  await prisma.projectMember.deleteMany()
  await prisma.project.deleteMany()
  await prisma.account.deleteMany({ where: { userId: { startsWith: 'user_seed_' } } })
  await prisma.session.deleteMany({ where: { userId: { startsWith: 'user_seed_' } } })
  await prisma.user.deleteMany({ where: { id: { startsWith: 'user_seed_' } } })
  await prisma.shift.deleteMany()
  await prisma.leavePolicy.deleteMany()
  await prisma.overtimeConfig.deleteMany()
  await prisma.department.deleteMany()
  console.log('  ✅ Cleanup complete\n')

  // ─── 1. Departments ──────────────────────────────────────────
  console.log('📁 Creating departments...')
  const departments = []
  for (const name of departmentNames) {
    const dept = await prisma.department.upsert({
      where: { name },
      update: {},
      create: { name, description: `${name} Department` },
    })
    departments.push(dept)
    console.log(`  ✅ ${dept.name}`)
  }

  // ─── 2. Shifts ───────────────────────────────────────────────
  console.log('\n⏰ Creating shifts...')
  const shiftData = [
    { name: 'Morning Shift', startTime: '09:00', endTime: '18:00', graceMinutes: 15, breakMinutes: 60, isDefault: true },
    { name: 'Afternoon Shift', startTime: '13:00', endTime: '22:00', graceMinutes: 15, breakMinutes: 60, isDefault: false },
    { name: 'Night Shift', startTime: '22:00', endTime: '06:00', graceMinutes: 10, breakMinutes: 45, isDefault: false },
    { name: 'Flexible Shift', startTime: '10:00', endTime: '19:00', graceMinutes: 30, breakMinutes: 60, isDefault: false },
  ]
  const shifts = []
  for (const s of shiftData) {
    const shift = await prisma.shift.create({ data: s })
    shifts.push(shift)
    console.log(`  ✅ ${shift.name}`)
  }

  // ─── 3. Leave Policies ───────────────────────────────────────
  console.log('\n📋 Creating leave policies...')
  const policies = [
    { leaveType: 'ANNUAL_LEAVE', annualDays: 21, maxCarryOver: 5 },
    { leaveType: 'SICK_LEAVE', annualDays: 14, maxCarryOver: 0 },
    { leaveType: 'CASUAL_LEAVE', annualDays: 10, maxCarryOver: 0 },
    { leaveType: 'PERSONAL_LEAVE', annualDays: 5, maxCarryOver: 0 },
    { leaveType: 'MATERNITY_LEAVE', annualDays: 90, maxCarryOver: 0 },
    { leaveType: 'UNPAID_LEAVE', annualDays: 30, maxCarryOver: 0 },
  ]
  for (const p of policies) {
    await prisma.leavePolicy.upsert({
      where: { leaveType: p.leaveType },
      update: {},
      create: p,
    })
    console.log(`  ✅ ${p.leaveType} — ${p.annualDays} days`)
  }

  // ─── 4. Overtime Config ──────────────────────────────────────
  console.log('\n⚙️  Creating overtime config...')
  const existingOtConfig = await prisma.overtimeConfig.findFirst()
  if (!existingOtConfig) {
    await prisma.overtimeConfig.create({
      data: { dailyLimitHours: 9, weeklyLimitHours: 45, monthlyLimitHours: 180, alertThreshold: 0.9 },
    })
    console.log('  ✅ Overtime config created')
  } else {
    console.log('  ⏭️  Already exists')
  }

  // ─── 5. Users (Employees) ────────────────────────────────────
  console.log('\n👥 Creating 40 employees...')
  const users = []
  for (let i = 0; i < 40; i++) {
    const fn = firstNames[i % firstNames.length]
    const ln = lastNames[i % lastNames.length]
    const dept = departments[i % departments.length]
    const email = `${fn.toLowerCase()}.${ln.toLowerCase()}${i + 1}@forrof.com`
    const userId = `user_seed_${i}`

    const uniqueId = `E-${String(i + 1).padStart(3, '0')}`
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        id: userId,
        name: `${fn} ${ln}`,
        email,
        emailVerified: true,
        role: 'employee',
        departmentId: dept.id,
        isPasswordChanged: true,
        salary: rand(30000, 250000),
        phone: `+92 3${rand(10, 99)} ${rand(1000000, 9999999)}`,
        joinDate: daysAgo(rand(60, 730)),
        uniqueId,
      },
    })
    // Create Better Auth account so users can log in
    const hashedPw = await hashPassword('Test@1234')
    await prisma.account.upsert({
      where: { id: `account_seed_${i}` },
      update: {},
      create: {
        id: `account_seed_${i}`,
        accountId: user.id,
        providerId: 'credential',
        userId: user.id,
        password: hashedPw,
      },
    })

    users.push(user)
    if ((i + 1) % 10 === 0) console.log(`  ✅ Created ${i + 1}/40`)
  }

  // ─── 5b. Manager Relationships (Org Chart) ──────────────────
  console.log('\n🏢 Setting up org chart manager relationships...')
  // Group users by department, first user in each department is the department head
  const deptHeads = new Map()
  for (const user of users) {
    const deptId = departments[users.indexOf(user) % departments.length].id
    if (!deptHeads.has(deptId)) {
      deptHeads.set(deptId, user)
    }
  }
  // Assign department heads to report to the first user overall (acting as CEO/Director)
  const topManager = users[0]
  for (const [deptId, head] of deptHeads) {
    if (head.id !== topManager.id) {
      await prisma.user.update({
        where: { id: head.id },
        data: { managerId: topManager.id },
      })
    }
  }
  // Assign remaining users to their department head
  for (let i = 0; i < users.length; i++) {
    const user = users[i]
    const deptId = departments[i % departments.length].id
    const head = deptHeads.get(deptId)
    if (head && user.id !== head.id && user.id !== topManager.id) {
      await prisma.user.update({
        where: { id: user.id },
        data: { managerId: head.id },
      })
    }
  }
  console.log(`  ✅ Org chart: 1 top manager, ${deptHeads.size} department heads, ${users.length - deptHeads.size - 1} reports`)

  // ─── 5c. Assign admin user to Administration department ─────
  console.log('\n🔑 Assigning admin to Administration department...')
  const adminDept = departments.find(d => d.name === 'ADMINISTRATION')
  const adminUser = await prisma.user.findUnique({ where: { email: 'admin@forrof.io' } })
  if (adminUser && adminDept) {
    await prisma.user.update({
      where: { id: adminUser.id },
      data: { departmentId: adminDept.id },
    })
    console.log('  ✅ Admin assigned to ADMINISTRATION')
  } else {
    console.log('  ⏭️  Admin user not found (will be assigned on next login)')
  }

  // ─── 6. User Shifts ─────────────────────────────────────────
  console.log('\n📅 Assigning shifts to employees...')
  for (const user of users) {
    const shift = pick(shifts)
    try {
      await prisma.userShift.create({
        data: {
          userId: user.id,
          shiftId: shift.id,
          startDate: dateOnly(daysAgo(30)),
        },
      })
    } catch {
      // duplicate — skip
    }
  }
  console.log('  ✅ Shift assignments created')

  // ─── 7. Leave Balances ───────────────────────────────────────
  console.log('\n🏖️  Creating leave balances for 2026...')
  const leaveTypes = ['ANNUAL_LEAVE', 'SICK_LEAVE', 'CASUAL_LEAVE', 'PERSONAL_LEAVE']
  const daysMap = { ANNUAL_LEAVE: 21, SICK_LEAVE: 14, CASUAL_LEAVE: 10, PERSONAL_LEAVE: 5 }
  for (const user of users) {
    for (const lt of leaveTypes) {
      try {
        await prisma.leaveBalance.create({
          data: {
            userId: user.id,
            leaveType: lt,
            year: 2026,
            totalDays: daysMap[lt],
            usedDays: rand(0, Math.floor(daysMap[lt] / 2)),
          },
        })
      } catch {
        // duplicate
      }
    }
  }
  console.log('  ✅ Leave balances created')

  // ─── 8. Leave Requests ───────────────────────────────────────
  console.log('\n📝 Creating leave requests...')
  const leaveStatuses = ['PENDING', 'APPROVED', 'REJECTED']
  for (let i = 0; i < 30; i++) {
    const user = pick(users)
    const startDay = rand(1, 90)
    const duration = rand(1, 5)
    await prisma.leave.create({
      data: {
        employeeId: user.id,
        leaveType: pick(leaveTypes),
        startDate: daysAgo(startDay),
        endDate: daysAgo(startDay - duration),
        duration,
        reason: pick(['Family event', 'Medical appointment', 'Personal errands', 'Vacation', 'Sick', 'Emergency']),
        status: pick(leaveStatuses),
      },
    })
  }
  console.log('  ✅ 30 leave requests created')

  // ─── 9. Projects ─────────────────────────────────────────────
  console.log('\n🚀 Creating projects...')
  const projectData = [
    { name: 'Forrof Tracker v2', description: 'Next-gen employee tracking platform', status: 'ACTIVE' },
    { name: 'Mobile App Redesign', description: 'Redesign React Native mobile app', status: 'ACTIVE' },
    { name: 'Client Portal', description: 'Client-facing dashboard portal', status: 'ACTIVE' },
    { name: 'Analytics Dashboard', description: 'Business intelligence reporting dashboard', status: 'ACTIVE' },
    { name: 'API Gateway Migration', description: 'Migrate to API gateway architecture', status: 'COMPLETED' },
    { name: 'Security Audit 2026', description: 'Annual security audit and compliance', status: 'ACTIVE' },
    { name: 'Onboarding Automation', description: 'Automated employee onboarding flows', status: 'COMPLETED' },
    { name: 'Performance Tuning', description: 'Database and API performance optimization', status: 'INACTIVE' },
  ]
  const projects = []
  for (const p of projectData) {
    const project = await prisma.project.create({
      data: {
        ...p,
        departmentId: pick(departments).id,
        members: { connect: users.slice(0, rand(5, 15)).map(u => ({ id: u.id })) },
      },
    })
    projects.push(project)
    console.log(`  ✅ ${project.name}`)
  }

  // ─── 10. Announcements ───────────────────────────────────────
  console.log('\n📢 Creating announcements...')
  const announcementData = [
    { title: 'Eid ul-Fitr Holiday', description: 'Office will be closed from March 30 to April 2 for Eid ul-Fitr celebrations. Wishing everyone a blessed Eid!', category: 'holiday' },
    { title: 'New Leave Policy Update', description: 'Starting Q2 2026, annual leave has been increased to 21 days. Please review the updated policy in the documents section.', category: 'policy' },
    { title: 'System Maintenance Notice', description: 'The tracker will undergo maintenance this Saturday 10 PM - 2 AM. Please save your work before the scheduled downtime.', category: 'urgent' },
    { title: 'Welcome New Team Members', description: 'Please welcome our new colleagues joining the IT and Marketing departments this month. A welcome event will be held on Friday.', category: 'update' },
    { title: 'Q1 Performance Reviews', description: 'Q1 2026 performance review cycle starts next week. Managers, please complete all reviews by March 15.', category: 'update' },
    { title: 'Happy Birthday Celebrations', description: 'Join us in celebrating February birthdays! Cake and refreshments in the break room at 3 PM today.', category: 'birthday' },
  ]
  for (const a of announcementData) {
    await prisma.announcement.create({
      data: { ...a, createdById: users[0].id },
    })
  }
  console.log(`  ✅ ${announcementData.length} announcements created`)

  // ─── 11. Timer Sessions & Timesheets ────────────────────────
  console.log('\n⏱️  Creating timer sessions & timesheets...')
  // Store sessions keyed by `userId_dayIndex` for deviations later
  const timerSessionMap = {}
  for (const user of users.slice(0, 20)) {
    for (let d = 0; d < 7; d++) {
      const workDate = dateOnly(daysAgo(d))
      const startHour = rand(8, 10)
      const endHour = startHour + rand(7, 9)
      const startTime = new Date(workDate)
      startTime.setHours(startHour, rand(0, 30))
      const endTime = new Date(workDate)
      endTime.setHours(endHour, rand(0, 30))
      const totalDuration = Math.floor((endTime - startTime) / 1000)

      const session = await prisma.timerSession.create({
        data: {
          userId: user.id,
          projectId: pick(projects).id,
          startTime,
          endTime,
          totalDuration,
          isActive: false,
          status: 'checked_out',
          isPaused: false,
        },
      })
      timerSessionMap[`${user.id}_${d}`] = { session, startTime, endTime, workDate, totalDuration }

      try {
        await prisma.timesheet.create({
          data: {
            userId: user.id,
            projectId: pick(projects).id,
            workDate,
            checkInTime: startTime,
            checkOutTime: endTime,
            totalHours: parseFloat((totalDuration / 3600).toFixed(2)),
          },
        })
      } catch {
        // duplicate date
      }
    }
  }
  // Update totalHoursWorked for each project based on timer sessions
  for (const project of projects) {
    const aggregate = await prisma.timerSession.aggregate({
      where: { projectId: project.id },
      _sum: { totalDuration: true },
    })
    const totalSeconds = aggregate._sum.totalDuration || 0
    if (totalSeconds > 0) {
      await prisma.project.update({
        where: { id: project.id },
        data: { totalHoursWorked: parseFloat((totalSeconds / 3600).toFixed(2)) },
      })
    }
  }
  console.log('  ✅ Timer sessions & timesheets for 20 users × 7 days')

  // ─── 11a. Attendance Deviations (Late/Early) ──────────────
  console.log('\n⏰ Creating attendance deviations...')
  let deviationCount = 0
  for (const user of users.slice(0, 20)) {
    for (let d = 0; d < 7; d++) {
      const entry = timerSessionMap[`${user.id}_${d}`]
      if (!entry) continue

      // ~40% chance of having a deviation on any given day
      if (Math.random() > 0.4) continue

      const { session, startTime, endTime, workDate } = entry
      const expectedStart = new Date(workDate)
      expectedStart.setHours(9, 0, 0, 0)
      const expectedEnd = new Date(workDate)
      expectedEnd.setHours(18, 0, 0, 0)

      // Calculate late/early minutes
      const lateMinutes = startTime > expectedStart
        ? Math.round((startTime - expectedStart) / 60000)
        : 0
      const earlyMinutes = endTime && endTime < expectedEnd
        ? Math.round((expectedEnd - endTime) / 60000)
        : 0

      // Only create if there's actually a deviation
      if (lateMinutes === 0 && earlyMinutes === 0) continue

      const isExcused = Math.random() > 0.7
      try {
        await prisma.attendanceDeviation.create({
          data: {
            userId: user.id,
            date: workDate,
            timerSessionId: session.id,
            expectedStart,
            actualStart: startTime,
            expectedEnd,
            actualEnd: endTime,
            lateMinutes,
            earlyMinutes,
            isExcused,
            excuseReason: isExcused
              ? pick(['Doctor appointment', 'Traffic jam', 'Family emergency', 'Public transport delay', 'Car breakdown'])
              : null,
          },
        })
        deviationCount++
      } catch {
        // duplicate userId+date — skip
      }
    }
  }
  console.log(`  ✅ ${deviationCount} attendance deviations`)

  // ─── 11b. Attendance Regularizations ──────────────────────
  console.log('\n📝 Creating attendance regularizations...')
  const regularizationReasons = [
    'Forgot to check in, was working from desk since morning',
    'System was down, could not check out properly',
    'Checked in from wrong device, time not recorded',
    'Internet issue prevented check-in, was present in office',
    'App crashed during checkout, actual checkout was at 6 PM',
    'Was in client meeting, forgot to start timer',
    'VPN disconnected, check-in did not register',
    'Power outage caused system restart, missed check-in',
    'Checked out accidentally, continued working till 7 PM',
    'Working from home, forgot to log check-in on app',
  ]
  let regCount = 0
  for (const user of users.slice(0, 15)) {
    // Each user gets 1-3 regularization requests across the last 14 days
    const numRequests = rand(1, 3)
    const usedDates = new Set()
    for (let r = 0; r < numRequests; r++) {
      const dayOffset = rand(1, 14)
      if (usedDates.has(dayOffset)) continue
      usedDates.add(dayOffset)

      const regDate = dateOnly(daysAgo(dayOffset))
      const type = pick(['MISSED_CHECKIN', 'MISSED_CHECKOUT', 'WRONG_TIME'])
      const requestedTime = new Date(regDate)
      requestedTime.setHours(type === 'MISSED_CHECKIN' ? rand(8, 10) : rand(17, 19), rand(0, 59), 0, 0)

      const status = pick(['PENDING', 'PENDING', 'APPROVED', 'REJECTED'])
      try {
        await prisma.attendanceRegularization.create({
          data: {
            userId: user.id,
            date: regDate,
            type,
            requestedTime,
            reason: pick(regularizationReasons),
            status,
            approvedBy: status !== 'PENDING' ? users[0].id : null,
            adminNote: status === 'REJECTED'
              ? pick(['No evidence of presence', 'Please provide more details', 'Duplicate request'])
              : status === 'APPROVED'
                ? pick(['Verified with team lead', 'Confirmed via CCTV', 'Approved'])
                : null,
          },
        })
        regCount++
      } catch {
        // duplicate — skip
      }
    }
  }
  console.log(`  ✅ ${regCount} attendance regularizations`)

  // ─── 11c. Overtime Records ─────────────────────────────────
  console.log('\n⏳ Creating overtime records...')
  let otCount = 0
  for (const user of users.slice(0, 20)) {
    for (let d = 0; d < 7; d++) {
      const entry = timerSessionMap[`${user.id}_${d}`]
      if (!entry) continue

      const totalHrs = entry.totalDuration / 3600
      const regularHours = Math.min(totalHrs, 9)
      const overtimeHours = totalHrs > 9 ? parseFloat((totalHrs - 9).toFixed(2)) : 0

      // Only create record if there's overtime or ~30% chance for regular days (to show full data)
      if (overtimeHours === 0 && Math.random() > 0.3) continue

      try {
        await prisma.overtimeRecord.create({
          data: {
            userId: user.id,
            date: entry.workDate,
            regularHours: parseFloat(regularHours.toFixed(2)),
            overtimeHours,
            totalHours: parseFloat(totalHrs.toFixed(2)),
          },
        })
        otCount++
      } catch {
        // duplicate userId+date — skip
      }
    }
  }
  console.log(`  ✅ ${otCount} overtime records`)

  // ─── 11d. Timesheet Submissions ────────────────────────────
  console.log('\n📋 Creating timesheet submissions...')
  let subCount = 0
  // Create weekly submissions for last 4 weeks
  for (const user of users.slice(0, 15)) {
    for (let w = 0; w < 4; w++) {
      const weekStart = dateOnly(daysAgo(w * 7 + 6)) // Monday
      const weekEnd = dateOnly(daysAgo(w * 7))        // Sunday
      const weekTotalHours = parseFloat((rand(35, 50) + Math.random()).toFixed(2))
      const status = w === 0 ? 'PENDING' : pick(['APPROVED', 'APPROVED', 'APPROVED', 'REJECTED'])

      try {
        const submission = await prisma.timesheetSubmission.create({
          data: {
            userId: user.id,
            weekStart,
            weekEnd,
            totalHours: weekTotalHours,
            status,
            approvedBy: status !== 'PENDING' ? users[0].id : null,
            approvedAt: status !== 'PENDING' ? new Date() : null,
            adminNote: status === 'REJECTED'
              ? pick(['Hours mismatch with timer data', 'Please resubmit with correct project allocation', 'Missing project entries'])
              : null,
          },
        })

        // Create 5 daily entries per submission (Mon-Fri)
        for (let dayIdx = 0; dayIdx < 5; dayIdx++) {
          const entryDate = new Date(weekStart)
          entryDate.setDate(entryDate.getDate() + dayIdx)
          const dailyHours = parseFloat((rand(6, 10) + Math.random()).toFixed(2))
          const descriptions = [
            'Feature development and code review',
            'Bug fixes and testing',
            'Sprint planning and stand-up meetings',
            'API integration and documentation',
            'UI/UX implementation and testing',
            'Database optimization and queries',
            'Deployment and monitoring',
          ]
          await prisma.timesheetEntry.create({
            data: {
              submissionId: submission.id,
              date: dateOnly(entryDate),
              projectId: pick(projects).id,
              hours: dailyHours,
              description: pick(descriptions),
            },
          })
        }
        subCount++
      } catch {
        // duplicate weekStart — skip
      }
    }
  }
  console.log(`  ✅ ${subCount} timesheet submissions with entries`)

  // ─── 12. Standup Reports ─────────────────────────────────────
  console.log('\n🗣️  Creating standup reports...')
  const standupTasks = [
    { yesterday: 'Worked on API endpoints for leave module', today: 'Implementing leave approval workflow', blockers: null },
    { yesterday: 'Fixed UI bugs on dashboard', today: 'Adding charts for attendance reports', blockers: 'Waiting for design specs' },
    { yesterday: 'Code review for PR #45', today: 'Setting up CI/CD pipeline', blockers: null },
    { yesterday: 'Database migration for new fields', today: 'Writing unit tests for services', blockers: 'Need access to staging DB' },
    { yesterday: 'Meeting with client about requirements', today: 'Creating wireframes for new feature', blockers: null },
    { yesterday: 'Deployed hotfix to production', today: 'Monitoring error rates and performance', blockers: null },
  ]
  for (const user of users.slice(0, 15)) {
    for (let d = 0; d < 5; d++) {
      const task = pick(standupTasks)
      try {
        await prisma.standupReport.create({
          data: { userId: user.id, date: dateOnly(daysAgo(d)), ...task },
        })
      } catch {
        // duplicate
      }
    }
  }
  console.log('  ✅ Standup reports created')

  // ─── 13. Reviews & Review Cycle ──────────────────────────────
  console.log('\n⭐ Creating review cycles & reviews...')
  const cycle = await prisma.reviewCycle.create({
    data: {
      name: 'Q1 2026 Performance Review',
      startDate: dateOnly(new Date('2026-01-01')),
      endDate: dateOnly(new Date('2026-03-31')),
      status: 'ACTIVE',
    },
  })
  for (const user of users.slice(0, 20)) {
    const review = await prisma.review.create({
      data: {
        cycleId: cycle.id,
        employeeId: user.id,
        reviewerId: users[0].id,
        overallRating: parseFloat((rand(2, 4) + Math.random()).toFixed(1)),
        strengths: pick(['Great team player', 'Excellent communication', 'Strong technical skills', 'Reliable and punctual']),
        improvements: pick(['Time management', 'Documentation', 'Code quality', 'Proactive communication']),
        status: pick(['PENDING', 'IN_PROGRESS', 'SUBMITTED']),
      },
    })
    await prisma.reviewGoal.create({
      data: {
        reviewId: review.id,
        title: pick(['Complete AWS certification', 'Lead a sprint', 'Mentor a junior', 'Deliver feature X']),
        description: 'Target for Q1 2026',
        rating: rand(1, 5),
        weight: 1,
      },
    })
  }
  console.log('  ✅ Review cycle with 20 reviews')

  // ─── 14. Assets ──────────────────────────────────────────────
  console.log('\n💻 Creating assets...')
  const assetItems = [
    { name: 'MacBook Pro 16"', type: 'LAPTOP' },
    { name: 'Dell XPS 15', type: 'LAPTOP' },
    { name: 'ThinkPad X1 Carbon', type: 'LAPTOP' },
    { name: 'HP EliteBook', type: 'LAPTOP' },
    { name: 'LG 27" 4K Monitor', type: 'MONITOR' },
    { name: 'Dell U2723QE', type: 'MONITOR' },
    { name: 'Samsung Odyssey', type: 'MONITOR' },
    { name: 'Logitech MX Keys', type: 'KEYBOARD' },
    { name: 'Keychron K8', type: 'KEYBOARD' },
    { name: 'Apple Magic Keyboard', type: 'KEYBOARD' },
    { name: 'Logitech MX Master 3S', type: 'MOUSE' },
    { name: 'Apple Magic Mouse', type: 'MOUSE' },
    { name: 'Sony WH-1000XM5', type: 'HEADSET' },
    { name: 'AirPods Pro', type: 'HEADSET' },
    { name: 'Jabra Elite 85t', type: 'HEADSET' },
    { name: 'iPhone 15 Pro', type: 'PHONE' },
    { name: 'Samsung Galaxy S24', type: 'PHONE' },
  ]
  const assets = []
  for (let i = 0; i < assetItems.length; i++) {
    const asset = await prisma.asset.create({
      data: {
        name: assetItems[i].name,
        type: assetItems[i].type,
        serialNumber: `SN-${Date.now()}-${i}`,
        purchaseDate: dateOnly(daysAgo(rand(30, 365))),
        purchaseCost: rand(5000, 500000),
        condition: pick(['NEW', 'GOOD', 'FAIR']),
        isAvailable: i >= 10,
      },
    })
    assets.push(asset)
  }
  for (let i = 0; i < Math.min(10, assets.length); i++) {
    await prisma.assetAssignment.create({
      data: { assetId: assets[i].id, userId: users[i].id },
    })
  }
  console.log(`  ✅ ${assets.length} assets, ${Math.min(10, assets.length)} assigned`)

  // ─── 15. Feedback ────────────────────────────────────────────
  console.log('\n💬 Creating feedback...')
  const feedbackData = [
    { category: 'SUGGESTION', title: 'Dark mode support', message: 'Would love to have a dark mode option for the tracker.' },
    { category: 'APPRECIATION', title: 'Great new leave module', message: 'The new leave management system is very easy to use. Great work team!' },
    { category: 'BUG_REPORT', title: 'Timer not pausing correctly', message: 'When I pause the timer and resume, the duration seems off by a few seconds.' },
    { category: 'COMPLAINT', title: 'Slow loading on reports page', message: 'The reports page takes too long to load when selecting large date ranges.' },
    { category: 'SUGGESTION', title: 'Mobile push notifications', message: 'It would be helpful to get push notifications for leave approvals on mobile.' },
    { category: 'APPRECIATION', title: 'Helpful standup feature', message: 'The daily standup report feature saves our team a lot of meeting time.' },
    { category: 'OTHER', title: 'Keyboard shortcuts', message: 'Please add keyboard shortcuts for common actions like start/stop timer.' },
    { category: 'BUG_REPORT', title: 'Calendar event overlap', message: 'When two events have the same time, only one shows on the calendar view.' },
  ]
  for (const fb of feedbackData) {
    const user = pick(users)
    await prisma.feedback.create({
      data: {
        ...fb,
        userId: user.id,
        isAnonymous: Math.random() > 0.7,
        status: pick(['NEW', 'REVIEWED', 'IN_PROGRESS', 'RESOLVED']),
      },
    })
  }
  console.log(`  ✅ ${feedbackData.length} feedback entries`)

  // ─── 16. Holidays ────────────────────────────────────────────
  console.log('\n🎉 Creating holidays for 2026...')
  const holidays = [
    { name: 'Kashmir Day', date: '2026-02-05' },
    { name: 'Pakistan Day', date: '2026-03-23' },
    { name: 'Eid ul-Fitr (Day 1)', date: '2026-03-30' },
    { name: 'Eid ul-Fitr (Day 2)', date: '2026-03-31' },
    { name: 'Eid ul-Fitr (Day 3)', date: '2026-04-01' },
    { name: 'Labour Day', date: '2026-05-01' },
    { name: 'Eid ul-Adha (Day 1)', date: '2026-06-07' },
    { name: 'Eid ul-Adha (Day 2)', date: '2026-06-08' },
    { name: 'Eid ul-Adha (Day 3)', date: '2026-06-09' },
    { name: 'Independence Day', date: '2026-08-14' },
    { name: 'Iqbal Day', date: '2026-11-09' },
    { name: 'Quaid-e-Azam Day', date: '2026-12-25' },
  ]
  for (const h of holidays) {
    await prisma.holiday.create({
      data: { name: h.name, date: dateOnly(new Date(h.date)) },
    })
  }
  console.log(`  ✅ ${holidays.length} holidays`)

  // ─── 17. Badges ──────────────────────────────────────────────
  console.log('\n🏅 Creating badges...')
  const badgeData = [
    { name: 'Early Bird', description: 'Check in before 9 AM for 30 days', icon: '🌅', criteria: '30 early check-ins', threshold: 100 },
    { name: 'Team Player', description: 'Participate in 10 group chats', icon: '🤝', criteria: '10 group conversations', threshold: 50 },
    { name: 'Marathon Runner', description: 'Work 200+ hours in a month', icon: '🏃', criteria: '200 hours in one month', threshold: 200 },
    { name: 'Feedback Champion', description: 'Submit 5 feedback entries', icon: '💡', criteria: '5 feedback submissions', threshold: 30 },
    { name: 'Perfect Attendance', description: 'No absences for 60 days', icon: '🎯', criteria: '60 consecutive attendance days', threshold: 150 },
    { name: 'Standup Star', description: 'Submit standups for 30 consecutive days', icon: '⭐', criteria: '30 daily standups', threshold: 80 },
  ]
  const badges = []
  for (const b of badgeData) {
    const badge = await prisma.badge.upsert({
      where: { name: b.name },
      update: {},
      create: b,
    })
    badges.push(badge)
  }
  console.log(`  ✅ ${badges.length} badges`)

  // ─── 18. Gamification Points & User Badges ───────────────────
  console.log('\n🎮 Creating gamification points & user badges...')
  const gamCategories = ['ATTENDANCE', 'PRODUCTIVITY', 'RECOGNITION', 'WELLNESS']
  for (const user of users.slice(0, 25)) {
    for (let p = 0; p < rand(3, 8); p++) {
      await prisma.gamificationPoints.create({
        data: {
          userId: user.id,
          points: rand(5, 50),
          reason: pick(['On-time check-in', 'Completed standup', 'Full day attendance', 'Wellness challenge']),
          category: pick(gamCategories),
          earnedAt: daysAgo(rand(0, 60)),
        },
      })
    }
    const shuffledBadges = [...badges].sort(() => Math.random() - 0.5)
    for (const badge of shuffledBadges.slice(0, rand(1, 2))) {
      try {
        await prisma.userBadge.create({
          data: { userId: user.id, badgeId: badge.id },
        })
      } catch {
        // duplicate
      }
    }
  }
  console.log('  ✅ Points & badges assigned')

  // ─── 19. App Categories ──────────────────────────────────────
  console.log('\n📊 Creating app categories...')
  const appCategories = [
    { appName: 'Visual Studio Code', category: 'PRODUCTIVE' },
    { appName: 'Google Chrome', category: 'NEUTRAL' },
    { appName: 'Slack', category: 'PRODUCTIVE' },
    { appName: 'Microsoft Teams', category: 'PRODUCTIVE' },
    { appName: 'Figma', category: 'PRODUCTIVE' },
    { appName: 'YouTube', category: 'UNPRODUCTIVE' },
    { appName: 'Twitter', category: 'UNPRODUCTIVE' },
    { appName: 'Discord', category: 'NEUTRAL' },
    { appName: 'Notion', category: 'PRODUCTIVE' },
    { appName: 'Postman', category: 'PRODUCTIVE' },
    { appName: 'Terminal', category: 'PRODUCTIVE' },
    { appName: 'Spotify', category: 'NEUTRAL' },
    { appName: 'Netflix', category: 'UNPRODUCTIVE' },
    { appName: 'WhatsApp', category: 'NEUTRAL' },
  ]
  for (const ac of appCategories) {
    await prisma.appCategory.upsert({
      where: { appName: ac.appName },
      update: {},
      create: ac,
    })
  }
  console.log(`  ✅ ${appCategories.length} app categories`)

  // ─── 20. Mood Entries ────────────────────────────────────────
  console.log('\n😊 Creating mood entries...')
  for (const user of users.slice(0, 20)) {
    for (let d = 0; d < 14; d++) {
      try {
        await prisma.moodEntry.create({
          data: {
            userId: user.id,
            mood: rand(2, 5),
            note: pick([null, 'Great day!', 'Feeling productive', 'A bit tired', 'Stressed with deadline', 'Normal day']),
            date: dateOnly(daysAgo(d)),
          },
        })
      } catch {
        // duplicate
      }
    }
  }
  console.log('  ✅ Mood entries for 20 users × 14 days')

  // ─── 21. Shift Settings ──────────────────────────────────────
  console.log('\n⚙️  Creating shift settings...')
  const existingSS = await prisma.shiftSettings.findFirst()
  if (!existingSS) {
    await prisma.shiftSettings.create({
      data: { minRestPeriodHours: 11, maxShiftHours: 12 },
    })
    console.log('  ✅ Shift settings created')
  } else {
    console.log('  ⏭️  Already exists')
  }

  // ─── 22. Employee Availability ───────────────────────────────
  console.log('\n📆 Creating employee availability...')
  for (const user of users.slice(0, 20)) {
    for (let day = 1; day <= 5; day++) {
      try {
        await prisma.employeeAvailability.create({
          data: {
            userId: user.id,
            dayOfWeek: day,
            startTime: '09:00',
            endTime: '18:00',
            isAvailable: true,
          },
        })
      } catch {
        // duplicate
      }
    }
  }
  console.log('  ✅ Availability set for Mon-Fri')

  // ─── 23. Important Links ────────────────────────────────────
  console.log('\n🔗 Creating important links...')
  const links = [
    { title: 'Company Handbook', url: 'https://docs.forrof.io/handbook', order: 1 },
    { title: 'HR Portal', url: 'https://hr.forrof.io', order: 2 },
    { title: 'IT Support', url: 'https://support.forrof.io', order: 3 },
    { title: 'Benefits Guide', url: 'https://docs.forrof.io/benefits', order: 4 },
  ]
  for (const link of links) {
    await prisma.importantLink.create({ data: link })
  }
  console.log(`  ✅ ${links.length} links`)

  // ─── 24. Wellness Challenges ─────────────────────────────────
  console.log('\n🧘 Creating wellness challenges...')
  const challenges = [
    { title: '10K Steps Daily', description: 'Walk 10,000 steps every day for a week', type: 'STEPS', goal: 70000, unit: 'steps', days: 7 },
    { title: 'Hydration Challenge', description: 'Drink 8 glasses of water daily', type: 'HYDRATION', goal: 56, unit: 'glasses', days: 7 },
    { title: '5-Minute Meditation', description: 'Meditate for 5 minutes daily for 2 weeks', type: 'MINDFULNESS', goal: 70, unit: 'minutes', days: 14 },
  ]
  for (const c of challenges) {
    const wc = await prisma.wellnessChallenge.create({
      data: {
        title: c.title,
        description: c.description,
        type: c.type,
        startDate: dateOnly(daysAgo(c.days)),
        endDate: dateOnly(new Date()),
        goal: c.goal,
        unit: c.unit,
        createdBy: users[0].id,
      },
    })
    for (const user of users.slice(0, rand(5, 12))) {
      try {
        await prisma.wellnessChallengeParticipant.create({
          data: {
            challengeId: wc.id,
            userId: user.id,
            progress: rand(0, c.goal),
          },
        })
      } catch {
        // duplicate
      }
    }
  }
  console.log(`  ✅ ${challenges.length} challenges with participants`)

  // ─── 25. Expenses ────────────────────────────────────────────
  console.log('\n💰 Creating expenses...')
  const expenseData = [
    { title: 'Client lunch meeting', category: 'MEALS', amount: 3500 },
    { title: 'Uber to office', category: 'TRAVEL', amount: 800 },
    { title: 'JetBrains IDE License', category: 'SOFTWARE', amount: 15000 },
    { title: 'Office chair', category: 'EQUIPMENT', amount: 25000 },
    { title: 'React Training Course', category: 'TRAINING', amount: 12000 },
    { title: 'Printer paper & ink', category: 'OFFICE_SUPPLIES', amount: 2500 },
  ]
  const today = new Date()
  const currentDayOfMonth = today.getDate()
  for (const [idx, e] of expenseData.entries()) {
    // Ensure at least 2 expenses are REIMBURSED within current month
    const status = idx < 2 ? 'REIMBURSED' : pick(['SUBMITTED', 'APPROVED', 'REIMBURSED'])
    // Keep dates within current month to ensure reimbursed-this-month KPI works
    const maxDaysAgo = Math.min(currentDayOfMonth - 1, 15)
    const expenseDate = daysAgo(rand(0, Math.max(maxDaysAgo, 1)))
    await prisma.expense.create({
      data: {
        userId: pick(users).id,
        title: e.title,
        category: e.category,
        amount: e.amount,
        currency: 'PKR',
        status,
        approvedAt: status !== 'SUBMITTED' ? expenseDate : undefined,
        reimbursedAt: status === 'REIMBURSED' ? expenseDate : undefined,
      },
    })
  }
  console.log(`  ✅ ${expenseData.length} expenses`)

  // ─── 26. Bonus & Commissions ─────────────────────────────────
  console.log('\n🎁 Creating bonuses...')
  for (let i = 0; i < 10; i++) {
    await prisma.bonusCommission.create({
      data: {
        userId: pick(users).id,
        type: pick(['BONUS', 'COMMISSION']),
        category: pick(['PERFORMANCE', 'REFERRAL', 'HOLIDAY', 'RETENTION']),
        amount: rand(5000, 50000),
        currency: 'PKR',
        description: pick(['Q1 performance bonus', 'Employee referral reward', 'Eid bonus', 'Retention bonus']),
        status: pick(['PENDING', 'APPROVED', 'PAID']),
        payPeriod: '2026-02',
      },
    })
  }
  console.log('  ✅ 10 bonuses/commissions')

  // ─── 27. Offboarding Processes & Tasks ─────────────────────
  console.log('\n🚪 Creating offboarding processes...')
  const offboardingTaskTemplates = {
    IT_ACCESS: [
      { title: 'Revoke email access', description: 'Disable company email account and remove from distribution lists' },
      { title: 'Disable VPN access', description: 'Remove VPN credentials and certificates' },
      { title: 'Revoke GitHub/GitLab access', description: 'Remove from all repositories and organization' },
      { title: 'Disable Slack/Teams account', description: 'Deactivate messaging platform access' },
      { title: 'Remove from cloud services', description: 'Revoke AWS, GCP, Azure access and API keys' },
    ],
    EQUIPMENT: [
      { title: 'Collect laptop', description: 'Retrieve company-issued laptop and charger' },
      { title: 'Collect access card', description: 'Return office access card and parking pass' },
      { title: 'Return monitor/peripherals', description: 'Collect any company monitors, keyboard, mouse' },
      { title: 'Return company phone', description: 'Collect company-issued mobile device if applicable' },
    ],
    KNOWLEDGE_TRANSFER: [
      { title: 'Document ongoing projects', description: 'Create handover documentation for all active projects' },
      { title: 'Transfer project ownership', description: 'Reassign project leads and repository ownership' },
      { title: 'Share credentials/secrets', description: 'Transfer any service passwords to designated team member' },
      { title: 'Conduct knowledge transfer session', description: 'Schedule and complete KT sessions with team' },
    ],
    EXIT_INTERVIEW: [
      { title: 'Schedule exit interview', description: 'Book HR exit interview slot' },
      { title: 'Complete exit interview', description: 'Conduct exit interview and document feedback' },
      { title: 'Complete exit survey', description: 'Employee to fill out anonymous exit feedback form' },
    ],
    DOCUMENTATION: [
      { title: 'Update team documentation', description: 'Ensure all team wikis and runbooks are current' },
      { title: 'Sign NDA reminder', description: 'Remind employee of ongoing NDA obligations' },
      { title: 'Generate experience letter', description: 'Prepare and issue employment experience letter' },
      { title: 'Archive employee files', description: 'Archive all employee documents and records' },
    ],
    FINAL_PAY: [
      { title: 'Calculate final settlement', description: 'Compute remaining salary, leave encashment, and bonuses' },
      { title: 'Process pending reimbursements', description: 'Clear any outstanding expense claims' },
      { title: 'Issue final payslip', description: 'Generate and send final payslip with breakdown' },
      { title: 'Recover advances', description: 'Deduct any outstanding salary advances or loans' },
    ],
  }

  // Use employees 30-36 for offboarding (so they don't conflict with active user data)
  const offboardingEmployees = [
    { idx: 30, status: 'COMPLETED', daysAgoLwd: 5 },
    { idx: 31, status: 'IN_PROGRESS', daysAgoLwd: -7 },  // future last working date
    { idx: 32, status: 'IN_PROGRESS', daysAgoLwd: -3 },
    { idx: 33, status: 'COMPLETED', daysAgoLwd: 14 },
    { idx: 34, status: 'IN_PROGRESS', daysAgoLwd: -14 },
    { idx: 35, status: 'CANCELLED', daysAgoLwd: 10 },
    { idx: 36, status: 'IN_PROGRESS', daysAgoLwd: 0 },   // today is last day
  ]

  for (const ob of offboardingEmployees) {
    const employee = users[ob.idx]
    const lastWorkingDate = dateOnly(daysAgo(ob.daysAgoLwd))

    const process = await prisma.offboardingProcess.create({
      data: {
        employeeId: employee.id,
        initiatedBy: users[0].id, // first user as initiator (HR/admin)
        status: ob.status,
        lastWorkingDate,
        completedAt: ob.status === 'COMPLETED' ? daysAgo(ob.daysAgoLwd - 1) : null,
      },
    })

    // Create tasks for each category
    let sortOrder = 0
    for (const [category, templates] of Object.entries(offboardingTaskTemplates)) {
      for (const tmpl of templates) {
        let taskStatus = 'PENDING'
        let completedAt = null
        let completedBy = null
        let notes = null

        if (ob.status === 'COMPLETED') {
          // All tasks completed
          taskStatus = 'COMPLETED'
          completedAt = daysAgo(ob.daysAgoLwd)
          completedBy = pick(users.slice(0, 5)).id
          notes = pick([null, 'Done', 'Completed successfully', 'Verified'])
        } else if (ob.status === 'IN_PROGRESS') {
          // Random mix of statuses
          taskStatus = pick(['PENDING', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'COMPLETED'])
          if (taskStatus === 'COMPLETED') {
            completedAt = daysAgo(rand(1, 5))
            completedBy = pick(users.slice(0, 5)).id
          }
        }
        // CANCELLED: all stay PENDING

        await prisma.offboardingTask.create({
          data: {
            processId: process.id,
            title: tmpl.title,
            description: tmpl.description,
            category,
            assignedTo: pick(users.slice(0, 10)).id,
            status: taskStatus,
            dueDate: lastWorkingDate,
            completedAt,
            completedBy,
            notes,
            sortOrder: sortOrder++,
          },
        })
      }
    }
  }
  console.log(`  ✅ ${offboardingEmployees.length} offboarding processes with tasks`)

  // ─── 28. Pomodoro Sessions & Settings ──────────────────────
  console.log('\n🍅 Creating pomodoro sessions...')
  const pomodoroTasks = [
    'API endpoint development',
    'Bug fix: login redirect issue',
    'Code review for PR #132',
    'Database schema design',
    'Unit test writing',
    'Frontend component refactor',
    'Documentation update',
    'Sprint planning prep',
    'Performance optimization',
    'UI/UX design implementation',
    'Email template styling',
    'Debugging WebSocket connection',
    'Setting up CI/CD pipeline',
    'Writing integration tests',
    'Refactoring authentication flow',
    'Implementing search feature',
    'Fixing CSS layout issues',
    'Setting up monitoring alerts',
    'API documentation with Swagger',
    'Database query optimization',
  ]
  let pomCount = 0
  for (const user of users.slice(0, 25)) {
    // Each user gets 3-8 pomodoro sessions spread across the last 14 days
    const numSessions = rand(3, 8)
    for (let s = 0; s < numSessions; s++) {
      const dayOffset = rand(0, 13)
      const sessionDate = new Date(dateOnly(daysAgo(dayOffset)))
      sessionDate.setHours(rand(9, 17), rand(0, 59), 0, 0)

      const focusDuration = pick([25, 25, 25, 30, 45, 50])
      const breakDuration = pick([5, 5, 10])
      const longBreakDuration = pick([15, 20])
      const totalRounds = pick([2, 3, 4, 4, 4, 6])
      const status = pick(['COMPLETED', 'COMPLETED', 'COMPLETED', 'COMPLETED', 'CANCELLED'])
      const completedRounds = status === 'COMPLETED' ? totalRounds : rand(1, totalRounds - 1)
      const totalFocusMinutes = completedRounds * focusDuration

      const endDate = new Date(sessionDate)
      endDate.setMinutes(endDate.getMinutes() + totalFocusMinutes + (completedRounds - 1) * breakDuration)

      await prisma.pomodoroSession.create({
        data: {
          userId: user.id,
          taskDescription: pick(pomodoroTasks),
          focusDuration,
          breakDuration,
          longBreakDuration,
          totalRounds,
          completedRounds,
          totalFocusMinutes,
          status,
          startedAt: sessionDate,
          endedAt: endDate,
        },
      })
      pomCount++
    }

    // Create pomodoro settings for ~60% of users
    if (Math.random() > 0.4) {
      try {
        await prisma.pomodoroSettings.create({
          data: {
            userId: user.id,
            focusDuration: pick([25, 30, 45, 50]),
            breakDuration: pick([5, 10]),
            longBreakDuration: pick([15, 20, 30]),
            roundsBeforeLongBreak: pick([3, 4, 4, 6]),
          },
        })
      } catch {
        // duplicate userId — skip
      }
    }
  }
  console.log(`  ✅ ${pomCount} pomodoro sessions`)

  // ─── 28. Chat Conversations & Messages ──────────────────────
  console.log('\n💬 Creating chat conversations & messages...')

  // Helper to create a message at a certain minutes-ago offset
  const minutesAgo = m => {
    const d = new Date()
    d.setMinutes(d.getMinutes() - m)
    return d
  }

  // --- Direct conversations (1-on-1) ---
  const directConvos = [
    {
      between: [0, 1],
      messages: [
        { sender: 0, content: 'Hey Ahmed, did you finish the API integration?', ago: 320 },
        { sender: 1, content: 'Almost done! Just fixing some edge cases with the error handling', ago: 315 },
        { sender: 0, content: 'Great, let me know when its ready for review', ago: 310 },
        { sender: 1, content: 'Will do. Should be done by EOD', ago: 305 },
        { sender: 0, content: 'Perfect, thanks!', ago: 300 },
      ],
    },
    {
      between: [2, 3],
      messages: [
        { sender: 2, content: 'Hassan, are you free for a quick sync?', ago: 200 },
        { sender: 3, content: 'Sure, give me 5 minutes', ago: 195 },
        { sender: 2, content: 'No rush, ping me when ready', ago: 190 },
        { sender: 3, content: 'Ready now! Want to hop on a call?', ago: 180 },
        { sender: 2, content: 'Coming!', ago: 178 },
      ],
    },
    {
      between: [4, 7],
      messages: [
        { sender: 4, content: 'Fatima, I sent you the updated designs', ago: 500 },
        { sender: 7, content: 'Got them, these look amazing! Love the new color scheme', ago: 490 },
        { sender: 4, content: 'Thanks! Do you think we should add a dark mode variant?', ago: 485 },
        { sender: 7, content: 'Absolutely, dark mode is a must-have these days', ago: 480 },
        { sender: 4, content: 'Ill work on it this afternoon', ago: 475 },
        { sender: 7, content: 'Sounds good, let me know if you need the brand colors doc', ago: 470 },
      ],
    },
    {
      between: [5, 10],
      messages: [
        { sender: 5, content: 'Salam! Can you review my PR when you get a chance?', ago: 150 },
        { sender: 10, content: 'Salam! Sure, whats the PR number?', ago: 145 },
        { sender: 5, content: '#247 - the attendance module refactor', ago: 140 },
        { sender: 10, content: 'On it, Ill leave comments by lunch', ago: 135 },
      ],
    },
    {
      between: [6, 8],
      messages: [
        { sender: 6, content: 'The deployment went smoothly last night', ago: 1200 },
        { sender: 8, content: 'Alhamdulillah! Any issues reported this morning?', ago: 1150 },
        { sender: 6, content: 'None so far. Monitoring looks clean', ago: 1140 },
        { sender: 8, content: 'Perfect. Lets keep an eye on it for the next 24 hours', ago: 1130 },
      ],
    },
    {
      between: [9, 12],
      messages: [
        { sender: 9, content: 'Are you joining the team lunch today?', ago: 90 },
        { sender: 12, content: 'Yes! Where are we going?', ago: 85 },
        { sender: 9, content: 'Thinking of the new Pakistani place near the office', ago: 80 },
        { sender: 12, content: 'Great choice, Ive been wanting to try their biryani', ago: 75 },
        { sender: 9, content: 'Lets go at 1pm then?', ago: 70 },
        { sender: 12, content: 'Works for me!', ago: 65 },
      ],
    },
    {
      between: [1, 15],
      messages: [
        { sender: 15, content: 'Ahmed bhai, I need help with the Prisma migration', ago: 45 },
        { sender: 1, content: 'Sure, what error are you getting?', ago: 40 },
        { sender: 15, content: 'Its saying drift detected when I try migrate dev', ago: 35 },
        { sender: 1, content: 'Use db push instead of migrate dev, we had this issue before with Neon', ago: 30 },
        { sender: 15, content: 'That worked! Jazakallah', ago: 25 },
        { sender: 1, content: 'Anytime!', ago: 20 },
      ],
    },
    {
      between: [3, 16],
      messages: [
        { sender: 16, content: 'Can you share the Figma link for the dashboard redesign?', ago: 600 },
        { sender: 3, content: 'https://figma.com/file/forrof-dashboard-v2', ago: 595 },
        { sender: 16, content: 'Thanks! The new layout looks much cleaner', ago: 590 },
      ],
    },
  ]

  for (const dc of directConvos) {
    const conv = await prisma.conversation.create({
      data: {
        type: 'DIRECT',
        participants: {
          create: dc.between.map(idx => ({
            userId: users[idx].id,
            lastReadAt: minutesAgo(dc.messages[dc.messages.length - 1].ago - 5),
          })),
        },
      },
    })
    for (const msg of dc.messages) {
      await prisma.message.create({
        data: {
          conversationId: conv.id,
          senderId: users[msg.sender].id,
          content: msg.content,
          createdAt: minutesAgo(msg.ago),
        },
      })
    }
  }
  console.log(`  ✅ ${directConvos.length} direct conversations`)

  // --- Group conversations ---
  const groupConvos = [
    {
      name: 'IT Department',
      members: [0, 1, 2, 6, 8, 10, 14, 16, 20, 22],
      messages: [
        { sender: 0, content: 'Team, we need to finalize the sprint tasks by today', ago: 400 },
        { sender: 1, content: 'I can take the authentication refactor', ago: 395 },
        { sender: 6, content: 'Ill handle the CI/CD pipeline updates', ago: 390 },
        { sender: 10, content: 'Im already working on the database optimization', ago: 385 },
        { sender: 8, content: 'Can someone pick up the API documentation task?', ago: 380 },
        { sender: 14, content: 'I can do that, been meaning to clean up the Swagger docs', ago: 375 },
        { sender: 0, content: 'Great, lets sync again tomorrow morning at 10', ago: 370 },
        { sender: 22, content: 'Sounds good. Ill update the Jira board', ago: 365 },
        { sender: 16, content: 'Should we also address the security audit findings?', ago: 360 },
        { sender: 0, content: 'Good point, lets add that to next sprint', ago: 355 },
      ],
    },
    {
      name: 'Project Alpha',
      members: [0, 3, 5, 7, 11, 13],
      messages: [
        { sender: 0, content: 'Client meeting went well! They approved the new timeline', ago: 250 },
        { sender: 7, content: 'Thats great news! When is the next milestone?', ago: 245 },
        { sender: 0, content: 'March 15th for the beta release', ago: 240 },
        { sender: 5, content: 'That gives us about 4 weeks. Should be doable', ago: 235 },
        { sender: 3, content: 'Ill update the project plan and share it', ago: 230 },
        { sender: 11, content: 'Do we need to adjust the resource allocation?', ago: 225 },
        { sender: 13, content: 'I think we need one more frontend dev', ago: 220 },
        { sender: 0, content: 'Ill talk to HR about it tomorrow', ago: 215 },
      ],
    },
    {
      name: 'HR Updates',
      members: [4, 9, 12, 17, 18, 24, 25],
      messages: [
        { sender: 4, content: 'Reminder: Performance reviews are due by end of this month', ago: 700 },
        { sender: 9, content: 'Is the new review template ready?', ago: 695 },
        { sender: 4, content: 'Yes, its been uploaded to the HR portal', ago: 690 },
        { sender: 17, content: 'Can managers start filling them out now?', ago: 685 },
        { sender: 4, content: 'Yes, please share the link with your teams', ago: 680 },
        { sender: 24, content: 'Will do. Also, when is the town hall?', ago: 675 },
        { sender: 4, content: 'Next Friday at 3 PM. Calendar invites going out today', ago: 670 },
      ],
    },
    {
      name: 'Design Team',
      members: [7, 11, 13, 19, 25, 27],
      messages: [
        { sender: 7, content: 'New design system components are ready for review', ago: 120 },
        { sender: 11, content: 'The button variants look clean!', ago: 115 },
        { sender: 19, content: 'Should we add hover animations?', ago: 110 },
        { sender: 7, content: 'Good idea, subtle transitions would be nice', ago: 105 },
        { sender: 25, content: 'What about accessibility? Did we run the contrast checker?', ago: 100 },
        { sender: 7, content: 'Yes, all colors pass WCAG AA standards', ago: 95 },
        { sender: 27, content: 'Awesome work everyone!', ago: 90 },
        { sender: 13, content: 'Shall I export the tokens for the dev team?', ago: 85 },
        { sender: 7, content: 'Please do, and update the Storybook as well', ago: 80 },
      ],
    },
    {
      name: 'Office Social',
      members: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      messages: [
        { sender: 2, content: 'Anyone up for cricket this weekend?', ago: 60 },
        { sender: 5, content: 'Count me in!', ago: 55 },
        { sender: 8, content: 'What time and where?', ago: 50 },
        { sender: 2, content: 'Saturday 4 PM at the usual ground', ago: 45 },
        { sender: 0, content: 'Ill bring the equipment', ago: 40 },
        { sender: 11, content: 'Do we have enough players?', ago: 35 },
        { sender: 2, content: 'We need 3 more. Spread the word!', ago: 30 },
        { sender: 9, content: 'Ill ask the finance team', ago: 25 },
        { sender: 3, content: 'Im in too! Been a while since I played', ago: 20 },
        { sender: 6, content: 'Same here. Looking forward to it!', ago: 15 },
        { sender: 4, content: 'Ill bring chai and snacks for after the match', ago: 10 },
      ],
    },
  ]

  for (const gc of groupConvos) {
    const conv = await prisma.conversation.create({
      data: {
        type: 'GROUP',
        name: gc.name,
        participants: {
          create: gc.members.map(idx => ({
            userId: users[idx].id,
            lastReadAt: minutesAgo(gc.messages[gc.messages.length - 1].ago - 5),
          })),
        },
      },
    })
    for (const msg of gc.messages) {
      await prisma.message.create({
        data: {
          conversationId: conv.id,
          senderId: users[msg.sender].id,
          content: msg.content,
          createdAt: minutesAgo(msg.ago),
        },
      })
    }
  }
  console.log(`  ✅ ${groupConvos.length} group conversations`)

  console.log('\n\n🎉 Comprehensive seed complete!')
  console.log(`   📁 ${departments.length} departments`)
  console.log(`   👥 ${users.length} employees`)
  console.log(`   ⏰ ${shifts.length} shifts`)
  console.log(`   🚀 ${projects.length} projects`)
  console.log(`   📢 ${announcementData.length} announcements`)
  console.log(`   💻 ${assets.length} assets`)
  console.log(`   🏅 ${badges.length} badges`)
  console.log(`   🎉 ${holidays.length} holidays`)
  console.log(`   💬 ${directConvos.length + groupConvos.length} chat conversations`)
  console.log('   ...plus leaves, timesheets, standups, reviews, mood, feedback, expenses & more\n')
}

main()
  .then(async () => {
    await prisma.$disconnect()
    console.log('✨ Done!')
  })
  .catch(async e => {
    console.error('❌ Seed error:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
