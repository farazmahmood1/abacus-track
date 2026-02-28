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
    console.log('🔄 Backfilling unique IDs for all users...\n')

    // Find the highest existing E-ID number to continue from
    const existingEIds = await prisma.user.findMany({
      where: { uniqueId: { startsWith: 'E-' } },
      select: { uniqueId: true },
      orderBy: { uniqueId: 'desc' },
      take: 1,
    })

    let counter = 1
    if (existingEIds.length > 0) {
      const lastNumber = parseInt(existingEIds[0].uniqueId.replace('E-', ''), 10)
      counter = lastNumber + 1
      console.log(`Continuing from E-${String(counter).padStart(3, '0')} (found existing IDs up to ${existingEIds[0].uniqueId})`)
    }

    // Find all users with RDX IDs
    const usersWithRDX = await prisma.user.findMany({
      where: { uniqueId: { startsWith: 'RDX-' } },
      orderBy: { createdAt: 'asc' },
    })
    console.log(`Found ${usersWithRDX.length} users with RDX IDs`)

    for (const user of usersWithRDX) {
      const newEId = generateUniqueId(counter)
      await prisma.user.update({
        where: { id: user.id },
        data: { uniqueId: newEId },
      })
      console.log(`✅ Migrated ${user.uniqueId} → ${newEId} for ${user.name} (${user.email})`)
      counter++
    }

    // Find all users without any unique ID
    const usersWithoutId = await prisma.user.findMany({
      where: { uniqueId: null },
      orderBy: { createdAt: 'asc' },
    })
    console.log(`Found ${usersWithoutId.length} users without unique IDs`)

    for (const user of usersWithoutId) {
      const newEId = generateUniqueId(counter)
      await prisma.user.update({
        where: { id: user.id },
        data: { uniqueId: newEId },
      })
      console.log(`✅ Generated ${newEId} for ${user.name} (${user.email})`)
      counter++
    }

    const total = usersWithRDX.length + usersWithoutId.length
    console.log(
      `\n✨ Successfully processed ${total} users!`
    )
  } catch (error) {
    console.error('❌ Error migrating unique IDs:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
