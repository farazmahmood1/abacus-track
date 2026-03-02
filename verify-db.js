import prisma from './src/config/prisma.js'


async function main() {
    console.log('--- DATABASE STATE VERIFICATION ---')

    const users = await prisma.user.findMany()
    console.log(`Users count: ${users.length}`)
    users.forEach(u => console.log(`- ${u.email} (Role: ${u.role})`))

    const tables = [
        'session', 'account', 'announcement', 'leave', 'project', 'timerSession',
        'activityLog', 'timesheet'
    ]

    for (const table of tables) {
        try {
            const count = await prisma[table].count()
            console.log(`${table} count: ${count}`)
        } catch (e) {
            console.log(`${table} count: Table not found or error: ${e.message}`)
        }
    }

    console.log('--- VERIFICATION END ---')
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
