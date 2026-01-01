/**
 * Generate a unique ID in the format E-XXX
 * The number is sequential (E-001, E-002, E-003, etc.)
 */
export const generateUniqueId = counter => {
  const paddedNumber = String(counter).padStart(3, '0')
  return `E-${paddedNumber}`
}

/**
 * Generate a unique ID that doesn't exist in the database
 */
export const generateUniqueIdForDatabase = async prisma => {
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
