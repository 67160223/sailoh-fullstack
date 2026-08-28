import { PrismaClient } from '@prisma/client'

// instance เดียวใช้ทั้งแอป กัน connection pool ล้นตอน hot-reload ใน dev
export const prisma = new PrismaClient()
