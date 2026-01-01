import prisma from '../src/config/prisma.js'

const departmentNames = ['HR', 'IT', 'SALES', 'MARKETING', 'FINANCE', 'OPERATIONS']
const firstNames = [
  'Muhammad',
  'Ahmed',
  'Ali',
  'Hassan',
  'Ibrahim',
  'Omar',
  'Khalid',
  'Fatima',
  'Aisha',
  'Zainab',
  'Layla',
  'Noor',
  'Sara',
  'Hana',
  'Leila',
  'Rania',
  'Abdullah',
  'Mustafa',
  'Yusuf',
  'Karim',
  'Rashid',
  'Tariq',
  'Jamal',
  'Nabil',
  'Amina',
  'Yasmine',
  'Dina',
  'Sophia',
  'Mariam',
  'Hiba',
  'Rana',
  'Maha',
  'Hamza',
  'Waleed',
  'Samir',
  'Basem',
  'Farah',
  'Lina',
  'Nina',
  'Yara',
]
const lastNames = [
  'Ahmed',
  'Hassan',
  'Khan',
  'Ali',
  'Ibrahim',
  'Mohammed',
  'Abdullah',
  'Salem',
  'Rashid',
  'Mansour',
  'Malik',
  'Rahman',
  'Amin',
  'Aziz',
  'Hani',
  'Jamal',
  'Karim',
  'Kareem',
  'Latif',
  'Majid',
  'Nasir',
  'Qadir',
  'Saleh',
  'Samir',
]

function generateEmail(firstName, lastName, index) {
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}${index}@forrof.com`
}

async function main() {
  console.log('🌱 Starting seed...')

  try {
    // Delete existing users (optional - comment out if you want to keep existing data)
    // await prisma.user.deleteMany({});
    // console.log('Cleared existing users');

    // Create departments if they don't exist
    console.log('\n📁 Creating departments...')
    const departments = []
    for (const deptName of departmentNames) {
      const dept = await prisma.department.upsert({
        where: { name: deptName },
        update: {},
        create: {
          name: deptName,
          description: `${deptName} Department`,
        },
      })
      departments.push(dept)
      console.log(`✅ Department: ${dept.name} (ID: ${dept.id})`)
    }

    const createdUsers = []

    console.log('\n👥 Creating users...')
    for (let i = 0; i < 40; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
      const department = departments[Math.floor(Math.random() * departments.length)]
      const email = generateEmail(firstName, lastName, i + 1)

      const user = await prisma.user.create({
        data: {
          id: `user_${Date.now()}_${i}`,
          name: `${firstName} ${lastName}`,
          email: email,
          emailVerified: true,
          role: 'employee',
          departmentId: department.id,
          isPasswordChanged: true, // Set to true so they don't see password change modal
        },
      })

      createdUsers.push(user)
      console.log(
        `✅ Created user ${i + 1}/40: ${user.name} (${user.email}) - Dept: ${department.name}`
      )
    }

    console.log(`\n🎉 Successfully seeded ${createdUsers.length} employees!`)
    console.log('\n📋 All users created as basic employees (no accounts needed)')
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    process.exit(1)
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
    console.log('\n✨ Seed complete!')
  })
  .catch(async e => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
