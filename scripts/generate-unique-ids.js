import prisma from '../src/config/prisma.js'

const generateUniqueId = counter => {
  // Generate E-ID format: E-001, E-002, E-003, etc.
  const paddedNumber = String(counter).padStart(3, '0')
  return `E-${paddedNumber}`
}

const generateUniqueIdForDatabase = async () => {
  // Get the highest existing E-ID number
  const existingUsers = await prisma.user.findMany({
    where: {
      uniqueId: {
        startsWith: 'E-',
      },
    },
    select: { uniqueId: true },
    orderBy: { uniqueId: 'desc' },
    take: 1,
  })

  let nextCounter = 1
  if (existingUsers.length > 0) {
    const lastId = existingUsers[0].uniqueId
    const lastNumber = parseInt(lastId.replace('E-', ''), 10)
    nextCounter = lastNumber + 1
  }

  return generateUniqueId(nextCounter)
}

async function main() {
  try {
    console.log('🔄 Migrating unique IDs from RDX to E-ID format...')

    // Find all users with RDX IDs
    const usersWithRDX = await prisma.user.findMany({
      where: {
        uniqueId: {
          startsWith: 'RDX-',
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    console.log(`Found ${usersWithRDX.length} users with RDX IDs`)

    let counter = 1
    for (const user of usersWithRDX) {
      const newEId = generateUniqueId(counter)
      await prisma.user.update({
        where: { id: user.id },
        data: { uniqueId: newEId },
      })
      console.log(
        `✅ Migrated ${user.uniqueId} → ${newEId} for user ${user.name} (${user.email})`
      )
      counter++
    }

    // Also check for users without any ID and generate for them
    const usersWithoutId = await prisma.user.findMany({
      where: {
        uniqueId: null,
      },
    })

    console.log(`Found ${usersWithoutId.length} users without unique IDs`)

    for (const user of usersWithoutId) {
      const newEId = generateUniqueId(counter)
      await prisma.user.update({
        where: { id: user.id },
        data: { uniqueId: newEId },
      })
      console.log(`✅ Generated ${newEId} for user ${user.name} (${user.email})`)
      counter++
    }

    console.log(
      `\n✨ Successfully migrated ${usersWithRDX.length + usersWithoutId.length} users to E-ID format!`
    )
  } catch (error) {
    console.error('❌ Error migrating unique IDs:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
