import prisma from './src/config/prisma.js'
import dotenv from 'dotenv'
import fs from 'fs'

dotenv.config()

async function main() {
    let log = '--- DIAGNOSTIC START ---\n'
    const keys = Object.keys(prisma)
    log += 'All keys on prisma object:\n'
    keys.forEach(k => {
        if (!k.startsWith('$') && !k.startsWith('_')) {
            log += `- ${k} (Type: ${typeof prisma[k]})\n`
        }
    })

    try {
        const admin = await prisma.user.findFirst({ where: { email: 'admin@forrof.io' } })
        log += `Admin user found: ${!!admin}\n`
    } catch (e) {
        log += `Error fetching admin with lowercase "user": ${e.message}\n`
    }

    try {
        log += `Type of prisma.activityLog: ${typeof prisma.activityLog}\n`
        log += `Type of prisma.ActivityLog: ${typeof prisma.ActivityLog}\n`
        log += `Type of prisma.activity_logs: ${typeof prisma.activity_logs}\n`
    } catch (e) { }

    log += '--- DIAGNOSTIC END ---\n'
    fs.writeFileSync('diagnostic-results.log', log)
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
