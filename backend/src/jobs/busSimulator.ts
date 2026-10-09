import { RouteStatus } from '@prisma/client'
import { prisma } from '../config/prisma'

// จำลองตำแหน่งรถเมล์ให้ขยับบนแผนที่จริงเรื่อยๆ — ไม่มีรถเมล์จริงส่ง GPS เข้าระบบนี้
// (ไม่มี API สาธารณะฟรีที่ให้พิกัดรถเมล์กรุงเทพฯ แบบเรียลไทม์) จึงให้ server จำลองการเคลื่อนที่เอง
//
// เส้นทางที่ใช้วิ่งจริง: ถ้าสายนั้นมี routeGeometry (เส้นตามถนนจริงจาก OSRM — ดู scripts/fetch-route-geometry.ts)
// จะวิ่งไล่ไปตามจุดบนถนนจริงหลายร้อย/พันจุดนั้น ไม่ใช่แค่ลากเส้นตรงระหว่างป้ายเหมือนเดิม — รถจะเลี้ยวตามถนนจริง
// ไม่ตัดตรงข้ามตึก/แม่น้ำอีกต่อไป ถ้าสายไหนยังไม่มี routeGeometry จะ fallback ไปวิ่งไล่ป้ายตรงๆ แบบเดิมโดยอัตโนมัติ
//
// แผนที่/เส้นทางเป็นของจริง แต่ "การเคลื่อนที่" นี้ยังเป็นข้อมูลจำลอง ไม่ใช่ GPS จริง

const TICK_MS = 2000 // อัปเดตตำแหน่งทุกกี่ ms
const ROUTE_REFRESH_MS = 60_000 // รีโหลดรายชื่อสาย/ป้าย/เส้นทางจาก DB ทุกกี่ ms เผื่อมีการแก้ไขระหว่างรัน
const BUS_SPEED_KMH = 22 // ความเร็วเฉลี่ยรถเมล์ในเมืองที่ใช้คำนวณระยะที่ขยับต่อ tick (ปรับได้ตามต้องการ)

type LatLng = [number, number]

type RoutePath = {
  points: LatLng[] // ลำดับจุดที่รถวิ่งผ่าน (จากถนนจริงถ้ามี ไม่งั้นจากจุดป้ายต่อกันตรงๆ)
  cumDist: number[] // ระยะทางสะสม (เมตร) ของแต่ละจุดใน points นับจากจุดแรก — length เท่ากับ points
  totalDist: number // ระยะทางรวมทั้งเส้น (เมตร)
  stopMarkers: { stopId: number; cumDist: number }[] // ตำแหน่งป้ายจริงแต่ละป้าย แปลงเป็นระยะสะสมบนเส้นนี้ เรียงน้อย→มาก
}

type SimState = {
  distAlong: number // ตำแหน่งปัจจุบันของรถ นับเป็นระยะทางสะสม (เมตร) จากจุดเริ่มเส้น
  direction: 1 | -1
}

const pathByRoute = new Map<number, RoutePath>()
const stateByRoute = new Map<number, SimState>()
let routesWithRealGeometryCount = 0 // แค่ไว้โชว์ log ตอนเริ่มทำงาน ว่ากี่สายที่วิ่งตามถนนจริงได้ (อัปเดตใน loadRoutes)

// ระยะทางฮาเวอร์ไซน์ (เมตร) ระหว่างสองพิกัด — ใช้คำนวณความยาวเส้นทางจริง (ไม่ใช่เส้นตรงบนจอ)
function haversine([lat1, lng1]: LatLng, [lat2, lng2]: LatLng): number {
  const R = 6371000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

function buildCumDist(points: LatLng[]): { cumDist: number[]; totalDist: number } {
  const cumDist = [0]
  for (let i = 1; i < points.length; i++) {
    cumDist.push(cumDist[i - 1] + haversine(points[i - 1], points[i]))
  }
  return { cumDist, totalDist: cumDist[cumDist.length - 1] }
}

// หาพิกัด (lat,lng) ของจุดที่อยู่บนเส้นทาง ณ ระยะสะสม = dist เมตร (interpolate ระหว่างจุดที่ใกล้ที่สุดสองจุด)
function pointAtDistance(path: RoutePath, dist: number): LatLng {
  const { points, cumDist, totalDist } = path
  const d = Math.max(0, Math.min(totalDist, dist))
  let i = 1
  while (i < cumDist.length && cumDist[i] < d) i++
  if (i >= cumDist.length) return points[points.length - 1]
  const prevDist = cumDist[i - 1]
  const segLen = cumDist[i] - prevDist
  const t = segLen > 0 ? (d - prevDist) / segLen : 0
  const [lat1, lng1] = points[i - 1]
  const [lat2, lng2] = points[i]
  return [lat1 + (lat2 - lat1) * t, lng1 + (lng2 - lng1) * t]
}

// หาป้ายถัดไปตามทิศทางการวิ่ง จากตำแหน่งปัจจุบัน — ใช้โชว์ "ป้ายถัดไป" กับคำนวณ ETA ฝั่ง frontend
function findNextStop(path: RoutePath, distAlong: number, direction: 1 | -1): number | null {
  const { stopMarkers } = path
  if (!stopMarkers.length) return null
  if (direction === 1) {
    const next = stopMarkers.find((s) => s.cumDist >= distAlong)
    return next ? next.stopId : stopMarkers[stopMarkers.length - 1].stopId
  }
  for (let i = stopMarkers.length - 1; i >= 0; i--) {
    if (stopMarkers[i].cumDist <= distAlong) return stopMarkers[i].stopId
  }
  return stopMarkers[0].stopId
}

async function loadRoutes() {
  const routes = await prisma.route.findMany({ include: { stops: { orderBy: { sequence: 'asc' } } } })

  pathByRoute.clear()
  const seenRouteIds = new Set<number>()
  let geometryCount = 0

  for (const route of routes) {
    const stopsWithCoords = route.stops.filter((s) => s.lat != null && s.lng != null)
    if (stopsWithCoords.length < 2) continue // ต้องมีป้ายอย่างน้อย 2 ป้ายที่มีพิกัดถึงจะจำลองการวิ่งได้

    // ใช้เส้นทางจริงตามถนน (routeGeometry จาก OSRM) ถ้ามีและข้อมูลถูกรูปแบบ ไม่งั้น fallback ไปจุดป้ายต่อกันตรงๆ
    const geometryRaw = route.routeGeometry as unknown
    const hasValidGeometry =
      Array.isArray(geometryRaw) &&
      geometryRaw.length >= 2 &&
      geometryRaw.every(
        (p): p is LatLng => Array.isArray(p) && p.length === 2 && typeof p[0] === 'number' && typeof p[1] === 'number'
      )

    const points: LatLng[] = hasValidGeometry
      ? (geometryRaw as LatLng[])
      : stopsWithCoords.map((s) => [s.lat as number, s.lng as number])

    const { cumDist, totalDist } = buildCumDist(points)
    if (totalDist <= 0) continue

    // แปลงตำแหน่งป้ายแต่ละป้ายเป็น "ระยะสะสมบนเส้นที่ใช้วิ่งจริง" โดยหาจุดบนเส้นที่ใกล้ป้ายนั้นที่สุด
    // (ต้องทำแบบนี้เพราะป้ายอาจไม่ได้ตรงกับจุดใดจุดหนึ่งใน routeGeometry เป๊ะๆ)
    const stopMarkers = stopsWithCoords
      .map((s) => {
        const stopPoint: LatLng = [s.lat as number, s.lng as number]
        let bestIdx = 0
        let bestDist = Infinity
        for (let i = 0; i < points.length; i++) {
          const d = haversine(points[i], stopPoint)
          if (d < bestDist) {
            bestDist = d
            bestIdx = i
          }
        }
        return { stopId: s.id, cumDist: cumDist[bestIdx] }
      })
      .sort((a, b) => a.cumDist - b.cumDist)

    if (hasValidGeometry) geometryCount++
    seenRouteIds.add(route.id)
    pathByRoute.set(route.id, { points, cumDist, totalDist, stopMarkers })
    if (!stateByRoute.has(route.id)) {
      stateByRoute.set(route.id, { distAlong: 0, direction: 1 })
    }
  }
  routesWithRealGeometryCount = geometryCount

  // เอาสายที่หายไป (ถูกลบ หรือข้อมูลไม่พอแล้ว) ออกจาก state กันค้างคำนวณสายที่ไม่มีแล้ว
  for (const routeId of stateByRoute.keys()) {
    if (!seenRouteIds.has(routeId)) stateByRoute.delete(routeId)
  }
}

async function tick() {
  const metersPerTick = ((BUS_SPEED_KMH * 1000) / 3600) * (TICK_MS / 1000)
  const updates: Promise<unknown>[] = []

  for (const [routeId, path] of pathByRoute) {
    const state = stateByRoute.get(routeId)
    if (!state) continue

    let next = state.distAlong + state.direction * metersPerTick
    if (next >= path.totalDist) {
      next = path.totalDist
      state.direction = -1
    } else if (next <= 0) {
      next = 0
      state.direction = 1
    }
    state.distAlong = next

    const [lat, lng] = pointAtDistance(path, state.distAlong)
    const nextStopId = findNextStop(path, state.distAlong, state.direction)
    const status: RouteStatus = Math.random() < 0.05 ? 'DELAYED' : 'MOVING' // แกล้งให้มีรถติดบ้างเล็กน้อย เพิ่มความสมจริงตอนเดโม

    updates.push(
      prisma.routeLocation
        .upsert({
          where: { routeId },
          update: { lat, lng, nextStopId: nextStopId ?? undefined, status },
          create: { routeId, lat, lng, nextStopId: nextStopId ?? undefined, status },
        })
        .catch((err) => console.error(`[bus-simulator] อัปเดตสาย ${routeId} ไม่สำเร็จ`, err))
    )
  }

  await Promise.all(updates)
}

let tickTimer: NodeJS.Timeout | null = null
let refreshTimer: NodeJS.Timeout | null = null

export async function startBusSimulator() {
  await loadRoutes()
  tickTimer = setInterval(() => {
    tick().catch((err) => console.error('[bus-simulator] tick error', err))
  }, TICK_MS)
  refreshTimer = setInterval(() => {
    loadRoutes().catch((err) => console.error('[bus-simulator] refresh error', err))
  }, ROUTE_REFRESH_MS)

  console.log(
    `[bus-simulator] เริ่มจำลองตำแหน่งรถ ${pathByRoute.size} สาย ทุก ${TICK_MS / 1000} วินาที ` +
      `(วิ่งตามถนนจริง ${routesWithRealGeometryCount} สาย — ข้อมูลตำแหน่งยังเป็นของจำลอง ไม่ใช่ GPS จริง — ปิดได้ด้วย ENABLE_BUS_SIMULATOR=false)`
  )
}

export function stopBusSimulator() {
  if (tickTimer) clearInterval(tickTimer)
  if (refreshTimer) clearInterval(refreshTimer)
  tickTimer = null
  refreshTimer = null
}
