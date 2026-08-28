import { RouteStatus } from '@prisma/client'
import { prisma } from '../../config/prisma'
import { ApiError } from '../../utils/ApiError'

// haversine distance ระหว่าง 2 จุด (กม.) — ใช้ประมาณ ETA แบบง่าย ไม่พึ่ง routing engine ภายนอก
function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export async function upsertLocation(
  routeId: number,
  input: { lat: number; lng: number; nextStopId?: number; status?: RouteStatus }
) {
  const route = await prisma.route.findUnique({ where: { id: routeId } })
  if (!route) throw ApiError.notFound('ไม่พบสายรถเมล์นี้')

  return prisma.routeLocation.upsert({
    where: { routeId },
    update: { lat: input.lat, lng: input.lng, nextStopId: input.nextStopId, status: input.status || 'MOVING' },
    create: { routeId, lat: input.lat, lng: input.lng, nextStopId: input.nextStopId, status: input.status || 'MOVING' },
  })
}

export async function getLocation(routeId: number) {
  const location = await prisma.routeLocation.findUnique({ where: { routeId } })
  if (!location) throw ApiError.notFound('ยังไม่มีข้อมูลตำแหน่งของสายนี้')
  return location
}

const AVG_SPEED_KMH = 18 // ความเร็วเฉลี่ยรถเมล์ในเมือง รวมจอดป้าย — ปรับได้ตามข้อมูลจริงในอนาคต

export async function getEta(routeId: number, stopId: number) {
  const [location, stop] = await Promise.all([
    prisma.routeLocation.findUnique({ where: { routeId } }),
    prisma.stop.findUnique({ where: { id: stopId } }),
  ])
  if (!location) throw ApiError.notFound('ยังไม่มีข้อมูลตำแหน่งของสายนี้')
  if (!stop || stop.routeId !== routeId) throw ApiError.notFound('ไม่พบป้ายนี้ในสายนี้')
  if (stop.lat == null || stop.lng == null) throw ApiError.badRequest('ป้ายนี้ยังไม่มีพิกัด')

  const km = distanceKm(location.lat, location.lng, stop.lat, stop.lng)
  const etaMins = Math.max(1, Math.round((km / AVG_SPEED_KMH) * 60))

  return { routeId, stopId, distanceKm: Number(km.toFixed(2)), etaMins, status: location.status }
}
