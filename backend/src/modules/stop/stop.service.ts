import { prisma } from '../../config/prisma'
import { ApiError } from '../../utils/ApiError'

export async function addStop(routeId: number, input: { name: string; lat?: number; lng?: number }) {
  const route = await prisma.route.findUnique({ where: { id: routeId } })
  if (!route) throw ApiError.notFound('ไม่พบสายรถเมล์นี้')

  const lastStop = await prisma.stop.findFirst({ where: { routeId }, orderBy: { sequence: 'desc' } })
  const sequence = lastStop ? lastStop.sequence + 1 : 0

  return prisma.stop.create({ data: { routeId, name: input.name, lat: input.lat, lng: input.lng, sequence } })
}

export async function updateStop(id: number, input: { name?: string; lat?: number; lng?: number; sequence?: number }) {
  return prisma.stop.update({ where: { id }, data: input })
}

export async function deleteStop(id: number) {
  await prisma.stop.delete({ where: { id } })
}
