import prisma from './src/config/prisma.js'
import dotenv from 'dotenv'

dotenv.config()

async function main() {
    try {
        console.log('Attempting to delete all ActivityLog...')
        const count = await prisma.activityLog.deleteMany({})
        console.log('Deleted successfully, count:', count)
    } catch (e) {
        console.error('Failed to delete ActivityLog:', e)
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
