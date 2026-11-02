import { PrismaClient } from '../src/generated/prisma/client.js'
import { getDatabaseUrl } from '../src/database-url.js'
import { hashPassword } from '#/lib/hash.js'

import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({
  connectionString: getDatabaseUrl(),
})

const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding database...')

  await prisma.user.deleteMany()

  const users = await prisma.user.createMany({
    data: [
      { email: "admin@example.com", login: "Admin", phone: "8(922)344-91-23", fullname: "Админ Админович", password: await hashPassword('KorokNET') },
      { email: "testuser@example.com", login: "testuser", phone: "8(922)344-91-24", fullname: "Юзер Юзерович", password: await hashPassword('testuser') },
    ],
  })

  console.log(`✅ Created ${users.count} users`)

  const testuser = await prisma.user.findUniqueOrThrow({ where: { login: 'testuser' } })
  const entries = await prisma.entry.createMany({
    data: [
      { userId: testuser.id, course: 'Основы веб-дизайна', startDate: new Date('2026-09-01'), payment: 'CASH', status: 'DONE' },
      { userId: testuser.id, course: 'Основы проектирования баз данных', startDate: new Date('2026-11-15'), payment: 'PHONE_TRANSFER', status: 'IN_PROGRESS' },
      { userId: testuser.id, course: 'Основы алгоритмизации и программирования', startDate: new Date('2027-01-10'), payment: 'CASH' },
      { userId: testuser.id, course: 'Основы веб-дизайна', startDate: new Date('2027-02-01'), payment: 'PHONE_TRANSFER' },
      { userId: testuser.id, course: 'Основы проектирования баз данных', startDate: new Date('2027-03-01'), payment: 'CASH' },
      { userId: testuser.id, course: 'Основы алгоритмизации и программирования', startDate: new Date('2027-04-01'), payment: 'PHONE_TRANSFER' },
    ],
  })

  console.log(`✅ Created ${entries.count} entries`)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
