import prisma from '../src/config/prisma.js'

/**
 * Cleanup script for production junk data.
 * Fixes: BUG-017, BUG-019, BUG-020, BUG-021, BUG-027
 *
 * Run: node --experimental-modules scripts/cleanup-junk-data.js
 */

async function main() {
  console.log('🧹 Starting junk data cleanup...\n')
  let totalCleaned = 0

  // ─── BUG-017: Remove junk test employees ───────────────────
  console.log('👥 BUG-017: Removing junk test employees...')
  const junkPatterns = ['notorious', 'testing bogo', 'au consulting', 'ahmed cali']
  for (const pattern of junkPatterns) {
    const junkUsers = await prisma.user.findMany({
      where: {
        name: { contains: pattern, mode: 'insensitive' },
        role: { not: 'admin' },
      },
      select: { id: true, name: true, email: true },
    })

    for (const user of junkUsers) {
      // Delete dependent records first
      await prisma.leaveBalance.deleteMany({ where: { userId: user.id } })
      await prisma.leave.deleteMany({ where: { employeeId: user.id } })
      await prisma.timerSession.deleteMany({ where: { userId: user.id } })
      await prisma.timesheet.deleteMany({ where: { userId: user.id } })
      await prisma.notification.deleteMany({ where: { userId: user.id } })
      await prisma.userShift.deleteMany({ where: { userId: user.id } })
      await prisma.account.deleteMany({ where: { userId: user.id } })
      await prisma.session.deleteMany({ where: { userId: user.id } })

      // Try to delete other possible relations (skip if table doesn't exist)
      const optionalDeletes = [
        () => prisma.standupReport.deleteMany({ where: { userId: user.id } }),
        () => prisma.review.deleteMany({ where: { employeeId: user.id } }),
        () => prisma.feedback.deleteMany({ where: { userId: user.id } }),
        () => prisma.assetAssignment.deleteMany({ where: { userId: user.id } }),
        () => prisma.gamificationPoints.deleteMany({ where: { userId: user.id } }),
        () => prisma.userBadge.deleteMany({ where: { userId: user.id } }),
        () => prisma.moodEntry.deleteMany({ where: { userId: user.id } }),
        () => prisma.conversationParticipant.deleteMany({ where: { userId: user.id } }),
        () => prisma.expense.deleteMany({ where: { userId: user.id } }),
        () => prisma.document.deleteMany({ where: { userId: user.id } }),
        () => prisma.bonusCommission.deleteMany({ where: { userId: user.id } }),
        () => prisma.pomodoroSession.deleteMany({ where: { userId: user.id } }),
        () => prisma.wellnessEntry.deleteMany({ where: { userId: user.id } }),
        () => prisma.attendanceDeviation.deleteMany({ where: { userId: user.id } }),
        () => prisma.attendanceRegularization.deleteMany({ where: { userId: user.id } }),
        () => prisma.overtimeRecord.deleteMany({ where: { userId: user.id } }),
        () => prisma.employeeAvailability.deleteMany({ where: { userId: user.id } }),
        () => prisma.timesheetSubmission.deleteMany({ where: { userId: user.id } }),
      ]
      for (const del of optionalDeletes) {
        try { await del() } catch { /* table may not exist */ }
      }

      await prisma.user.delete({ where: { id: user.id } })
      console.log(`  🗑️  Deleted junk user: ${user.name} (${user.email})`)
      totalCleaned++
    }
  }

  // ─── BUG-019: Remove duplicate holidays ────────────────────
  console.log('\n📅 BUG-019: Removing duplicate holidays...')
  const allHolidays = await prisma.holiday.findMany({ orderBy: { date: 'asc' } })
  const seenHolidays = new Map()
  let dupHolidays = 0
  for (const h of allHolidays) {
    const key = `${h.name}_${h.date.toISOString()}`
    if (seenHolidays.has(key)) {
      await prisma.holiday.delete({ where: { id: h.id } })
      dupHolidays++
      console.log(`  🗑️  Deleted duplicate: ${h.name} (${h.date.toISOString().split('T')[0]})`)
    } else {
      seenHolidays.set(key, h.id)
    }
  }
  totalCleaned += dupHolidays
  console.log(`  ✅ Removed ${dupHolidays} duplicate holidays`)

  // ─── BUG-020: Remove duplicate review cycles ──────────────
  console.log('\n⭐ BUG-020: Removing duplicate review cycles...')
  const allCycles = await prisma.reviewCycle.findMany({ orderBy: { createdAt: 'asc' } })
  const seenCycles = new Map()
  let dupCycles = 0
  for (const c of allCycles) {
    if (seenCycles.has(c.name)) {
      // Delete reviews and goals for this cycle first
      const reviews = await prisma.review.findMany({
        where: { cycleId: c.id },
        select: { id: true },
      })
      for (const r of reviews) {
        await prisma.reviewGoal.deleteMany({ where: { reviewId: r.id } })
      }
      await prisma.review.deleteMany({ where: { cycleId: c.id } })
      await prisma.reviewCycle.delete({ where: { id: c.id } })
      dupCycles++
      console.log(`  🗑️  Deleted duplicate cycle: ${c.name}`)
    } else {
      seenCycles.set(c.name, c.id)
    }
  }
  totalCleaned += dupCycles
  console.log(`  ✅ Removed ${dupCycles} duplicate review cycles`)

  // ─── BUG-027: Remove "Hi" review cycle (junk) ─────────────
  console.log('\n🗑️  BUG-027: Removing junk review cycles...')
  const junkCycleNames = ['Hi', 'Test', 'test', 'hi']
  for (const name of junkCycleNames) {
    const junkCycles = await prisma.reviewCycle.findMany({
      where: { name },
    })
    for (const c of junkCycles) {
      const reviews = await prisma.review.findMany({
        where: { cycleId: c.id },
        select: { id: true },
      })
      for (const r of reviews) {
        await prisma.reviewGoal.deleteMany({ where: { reviewId: r.id } })
      }
      await prisma.review.deleteMany({ where: { cycleId: c.id } })
      await prisma.reviewCycle.delete({ where: { id: c.id } })
      console.log(`  🗑️  Deleted junk cycle: "${c.name}"`)
      totalCleaned++
    }
  }

  // ─── BUG-021: Remove duplicate important links ─────────────
  console.log('\n🔗 BUG-021: Removing duplicate important links...')
  const allLinks = await prisma.importantLink.findMany({ orderBy: { order: 'asc' } })
  const seenLinks = new Map()
  let dupLinks = 0
  for (const link of allLinks) {
    if (seenLinks.has(link.title)) {
      await prisma.importantLink.delete({ where: { id: link.id } })
      dupLinks++
      console.log(`  🗑️  Deleted duplicate link: ${link.title}`)
    } else {
      seenLinks.set(link.title, link.id)
    }
  }
  totalCleaned += dupLinks
  console.log(`  ✅ Removed ${dupLinks} duplicate links`)

  console.log(`\n✨ Cleanup complete! Removed ${totalCleaned} junk/duplicate records.`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async e => {
    console.error('❌ Cleanup error:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
