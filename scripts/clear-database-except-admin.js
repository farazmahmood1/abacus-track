import prisma from '../src/config/prisma.js'
import dotenv from 'dotenv'

dotenv.config()

const ADMIN_EMAIL = 'admin@forrof.io'

async function safeDelete(modelName, deleteFn) {
  try {
    const result = await deleteFn()
    console.log(`🗑️  Deleted ${result.count} ${modelName}`)
    return result.count
  } catch (error) {
    if (error.code === 'P2021') {
      console.log(`ℹ️  Skipped ${modelName} (Table does not exist)`)
    } else {
      console.error(`❌ Error deleting ${modelName}:`, error.message)
    }
    return 0
  }
}

async function clearDatabaseExceptAdmin() {
  try {
    console.log('🔄 Starting database cleanup...')
    console.log(`✅ Preserving admin user: ${ADMIN_EMAIL}`)

    // Get admin user ID
    const adminUser = await prisma.user.findUnique({
      where: { email: ADMIN_EMAIL },
      select: { id: true, email: true, name: true },
    })

    if (!adminUser) {
      console.error('❌ Admin user not found with email:', ADMIN_EMAIL)
      console.log('Please ensure the admin user exists before running this script.')
      process.exit(1)
    }

    console.log(`✅ Found admin user: ${adminUser.name} (${adminUser.email})`)
    console.log('')

    // Sequential deletion (no transaction to allow skipping missing tables)

    await safeDelete('checkInOutNotification', () => prisma.checkInOutNotification.deleteMany({
      where: { userId: { not: adminUser.id } }
    }))

    await safeDelete('leaveNotification', () => prisma.leaveNotification.deleteMany({}))
    await safeDelete('leave', () => prisma.leave.deleteMany({}))
    await safeDelete('announcementNotification', () => prisma.announcementNotification.deleteMany({}))

    await safeDelete('announcement', () => prisma.announcement.deleteMany({
      where: { createdById: { not: adminUser.id } }
    }))

    await safeDelete('admin announcements', () => prisma.announcement.deleteMany({
      where: { createdById: adminUser.id }
    }))

    await safeDelete('activityLog', () => prisma.activityLog.deleteMany({}))
    await safeDelete('pauseLog', () => prisma.pauseLog.deleteMany({}))
    await safeDelete('timerSession', () => prisma.timerSession.deleteMany({}))
    await safeDelete('timesheet', () => prisma.timesheet.deleteMany({}))

    await safeDelete('userSkill', () => prisma.userSkill.deleteMany({
      where: { userId: { not: adminUser.id } }
    }))

    await safeDelete('userEducation', () => prisma.userEducation.deleteMany({
      where: { userId: { not: adminUser.id } }
    }))

    await safeDelete('userExperience', () => prisma.userExperience.deleteMany({
      where: { userId: { not: adminUser.id } }
    }))

    await safeDelete('profile', () => prisma.profile.deleteMany({
      where: { userId: { not: adminUser.id } }
    }))

    await safeDelete('project', () => prisma.project.deleteMany({}))
    await safeDelete('department', () => prisma.department.deleteMany({}))
    await safeDelete('importantLink', () => prisma.importantLink.deleteMany({}))
    await safeDelete('termsCondition', () => prisma.termsCondition.deleteMany({}))
    await safeDelete('verification', () => prisma.verification.deleteMany({}))

    await safeDelete('session', () => prisma.session.deleteMany({
      where: { userId: { not: adminUser.id } }
    }))

    await safeDelete('account', () => prisma.account.deleteMany({
      where: { userId: { not: adminUser.id } }
    }))

    await safeDelete('users', () => prisma.user.deleteMany({
      where: { email: { not: ADMIN_EMAIL } }
    }))

    console.log('')
    console.log('✅ Database cleanup completed successfully!')
    console.log(`✅ Admin user preserved: ${adminUser.email}`)

  } catch (error) {
    console.error('❌ Error during database cleanup:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

clearDatabaseExceptAdmin()
