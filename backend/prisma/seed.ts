import bcrypt from 'bcryptjs'
import { PrismaClient, PlateType } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const adminPasswordHash = await bcrypt.hash('Admin@1234', 10)
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@sailoh.local',
      passwordHash: adminPasswordHash,
      displayName: 'ผู้ดูแลระบบ',
      role: 'ADMIN',
    },
  })

  const routesData: {
    number: string
    name: string
    plateType: PlateType
    stops: { name: string; lat: number; lng: number }[]
  }[] = [
    {
      number: '140',
      name: 'อนุสาวรีย์ชัยฯ – ปากน้ำ',
      plateType: 'ORDINARY',
      stops: [
        { name: 'อนุสาวรีย์ชัยสมรภูมิ', lat: 13.7649, lng: 100.5382 },
        { name: 'สนามเป้า', lat: 13.7809, lng: 100.5453 },
        { name: 'อโศก', lat: 13.7367, lng: 100.5602 },
        { name: 'บางนา', lat: 13.6684, lng: 100.605 },
        { name: 'ปากน้ำ', lat: 13.6023, lng: 100.5967 },
      ],
    },
    {
      number: '25',
      name: 'ท่าเตียน – มีนบุรี',
      plateType: 'ORDINARY',
      stops: [
        { name: 'ท่าเตียน', lat: 13.7469, lng: 100.4931 },
        { name: 'สะพานพุทธ', lat: 13.7433, lng: 100.4987 },
        { name: 'ประตูน้ำ', lat: 13.7508, lng: 100.5397 },
        { name: 'มีนบุรี', lat: 13.8136, lng: 100.7333 },
      ],
    },
    {
      number: '511',
      name: 'อนุสาวรีย์ชัยฯ – ปู่เจ้าสมิงพราย',
      plateType: 'AIRCON',
      stops: [
        { name: 'อนุสาวรีย์ชัยสมรภูมิ', lat: 13.7649, lng: 100.5382 },
        { name: 'สาทร', lat: 13.7204, lng: 100.5298 },
        { name: 'บางนา', lat: 13.6684, lng: 100.605 },
        { name: 'ปู่เจ้าสมิงพราย', lat: 13.6469, lng: 100.5836 },
      ],
    },
    {
      number: 'BRT',
      name: 'สาทร – ราชพฤกษ์',
      plateType: 'BRT',
      stops: [
        { name: 'สาทร', lat: 13.7204, lng: 100.5298 },
        { name: 'เจริญนคร', lat: 13.7267, lng: 100.5089 },
        { name: 'ราชพฤกษ์', lat: 13.7539, lng: 100.4736 },
      ],
    },
  ]

  for (const r of routesData) {
    await prisma.route.upsert({
      where: { number: r.number },
      update: {},
      create: {
        number: r.number,
        name: r.name,
        plateType: r.plateType,
        stops: { create: r.stops.map((s, i) => ({ ...s, sequence: i })) },
      },
    })
  }

  console.log('Seed เสร็จแล้ว — admin/Admin@1234')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
