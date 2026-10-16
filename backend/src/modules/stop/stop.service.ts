import { prisma } from '../../config/prisma'
import { ApiError } from '../../utils/ApiError'
import { distanceKm } from '../../utils/geo'

export async function addStop(
  routeId: number,
  input: { name: string; lat?: number; lng?: number; sponsorName?: string | null; sponsorNote?: string | null }
) {
  const route = await prisma.route.findUnique({ where: { id: routeId } })
  if (!route) throw ApiError.notFound('ไม่พบสายรถเมล์นี้')

  const lastStop = await prisma.stop.findFirst({ where: { routeId }, orderBy: { sequence: 'desc' } })
  const sequence = lastStop ? lastStop.sequence + 1 : 0

  return prisma.stop.create({
    data: {
      routeId,
      name: input.name,
      lat: input.lat,
      lng: input.lng,
      sponsorName: input.sponsorName,
      sponsorNote: input.sponsorNote,
      sequence,
    },
  })
}

export async function updateStop(
  id: number,
  input: {
    name?: string
    lat?: number
    lng?: number
    sequence?: number
    sponsorName?: string | null
    sponsorNote?: string | null
  }
) {
  return prisma.stop.update({ where: { id }, data: input })
}

export async function deleteStop(id: number) {
  await prisma.stop.delete({ where: { id } })
}

const WALK_METERS_PER_MIN = 80 // ความเร็วเดินโดยประมาณ ~4.8 กม./ชม.

// ป้ายที่ใกล้พิกัดผู้ใช้ที่สุด "สายละ 1 ป้าย" (ป้ายที่ใกล้ที่สุดของสายนั้น) เรียงจากใกล้ไปไกล
// ไม่ตัดระยะทิ้ง — ให้ frontend ตัดสินใจว่าไกลเกินไปหรือไม่ (เช่น ผู้ใช้อยู่นอกพื้นที่ที่มีข้อมูลสาย)
export async function findNearby(input: { lat: number; lng: number; limit: number }) {
  const stops = await prisma.stop.findMany({
    where: { lat: { not: null }, lng: { not: null } },
    include: { route: { select: { id: true, number: true, name: true, plateType: true } } },
  })

  const nearestPerRoute = new Map<
    number,
    {
      stopId: number
      stopName: string
      sequence: number
      distanceKm: number
      walkMins: number
      route: { id: number; number: string; name: string; plateType: string }
    }
  >()

  for (const stop of stops) {
    if (stop.lat == null || stop.lng == null) continue
    const km = distanceKm(input.lat, input.lng, stop.lat, stop.lng)
    const prev = nearestPerRoute.get(stop.routeId)
    if (prev && prev.distanceKm <= km) continue
    nearestPerRoute.set(stop.routeId, {
      stopId: stop.id,
      stopName: stop.name,
      sequence: stop.sequence,
      distanceKm: Number(km.toFixed(2)),
      walkMins: Math.max(1, Math.round((km * 1000) / WALK_METERS_PER_MIN)),
      route: stop.route,
    })
  }

  return Array.from(nearestPerRoute.values())
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, input.limit)
}
