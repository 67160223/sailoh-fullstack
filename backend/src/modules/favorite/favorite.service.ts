import { prisma } from '../../config/prisma'
import { ApiError } from '../../utils/ApiError'

export async function list(userId: number) {
  const favorites = await prisma.favorite.findMany({
    where: { userId },
    include: { route: { include: { location: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return favorites.map((f) => f.route)
}

export async function add(userId: number, routeId: number) {
  const route = await prisma.route.findUnique({ where: { id: routeId } })
  if (!route) throw ApiError.notFound('ไม่พบสายรถเมล์นี้')

  return prisma.favorite.upsert({
    where: { userId_routeId: { userId, routeId } },
    update: {},
    create: { userId, routeId },
  })
}

export async function remove(userId: number, routeId: number) {
  await prisma.favorite
    .delete({ where: { userId_routeId: { userId, routeId } } })
    .catch(() => null) // เลิกบันทึกสายที่ไม่ได้บันทึกไว้ก็ถือว่าสำเร็จ (idempotent)
}
