import { prisma } from '../../config/prisma'
import { distanceKm } from '../../utils/geo'

const AVG_SPEED_KMH = 18 // ใช้ค่าเดียวกับการคำนวณ ETA (tracking.service.ts) ให้ตัวเลขสอดคล้องกันทั้งแอป
const FALLBACK_KM_PER_STOP = 0.6 // ป้ายที่ไม่มีพิกัด ประมาณระยะระหว่างป้ายแบบเฉลี่ย

function nameMatches(stopName: string, query: string): boolean {
  return stopName.toLowerCase().includes(query.toLowerCase())
}

// รายชื่อป้ายไม่ซ้ำทั้งหมด — ใช้เป็นตัวเลือกช่วยพิมพ์ (autocomplete) ในหน้าวางแผนเดินทาง
export async function listStopNames(): Promise<string[]> {
  const rows = await prisma.stop.findMany({ distinct: ['name'], select: { name: true }, orderBy: { name: 'asc' } })
  return rows.map((r) => r.name)
}

type StopLite = { id: number; name: string; sequence: number; lat: number | null; lng: number | null }

type TripPlan = {
  route: { id: number; number: string; name: string; plateType: string; fare: number }
  direction: 'FORWARD' | 'REVERSE' // ตามลำดับป้ายของสาย (ขาไป) หรือย้อนลำดับ (ขากลับ)
  fromStop: { id: number; name: string }
  toStop: { id: number; name: string }
  stopsCount: number // จำนวนป้ายที่ต้องนั่งผ่าน (ไม่นับป้ายต้นทาง)
  distanceKm: number
  rideMins: number
  fare: number
  busEtaMins: number | null // รถคันที่กำลังวิ่งอยู่จะถึงป้ายต้นทางในอีกกี่นาที (ถ้ามีตำแหน่งรถ)
}

// ระยะทางโดยประมาณตามลำดับป้ายจากต้นทางถึงปลายทาง (เส้นตรงระหว่างป้ายที่อยู่ติดกัน)
function ridingDistanceKm(stopsBetween: StopLite[]): number {
  let km = 0
  for (let i = 1; i < stopsBetween.length; i++) {
    const a = stopsBetween[i - 1]
    const b = stopsBetween[i]
    if (a.lat != null && a.lng != null && b.lat != null && b.lng != null) {
      km += distanceKm(a.lat, a.lng, b.lat, b.lng)
    } else {
      km += FALLBACK_KM_PER_STOP
    }
  }
  return km
}

/**
 * วางแผนเดินทางแบบนั่งสายเดียว: หาสายที่ผ่านทั้งป้ายต้นทางและปลายทาง (ค้นจากชื่อป้ายบางส่วนได้)
 * ยังไม่รองรับการต่อรถหลายสาย — คืนรายการเรียงจากใช้เวลานั่งน้อยไปมาก
 */
export async function plan(input: { from: string; to: string }): Promise<TripPlan[]> {
  const from = input.from.trim()
  const to = input.to.trim()

  const routes = await prisma.route.findMany({
    include: { stops: { orderBy: { sequence: 'asc' } }, location: true },
  })

  const plans: TripPlan[] = []

  for (const route of routes) {
    const fromCandidates = route.stops.filter((s) => nameMatches(s.name, from))
    const toCandidates = route.stops.filter((s) => nameMatches(s.name, to))
    if (fromCandidates.length === 0 || toCandidates.length === 0) continue

    // ถ้าในสายเดียวกันมีหลายป้ายที่ชื่อตรง เลือกคู่ที่อยู่ใกล้กันที่สุด
    let best: { f: StopLite; t: StopLite } | null = null
    let bestGap = Infinity
    for (const f of fromCandidates) {
      for (const t of toCandidates) {
        if (f.id === t.id) continue
        const gap = Math.abs(f.sequence - t.sequence)
        if (gap < bestGap) {
          bestGap = gap
          best = { f, t }
        }
      }
    }
    if (!best) continue

    const forward = best.f.sequence < best.t.sequence
    const lo = Math.min(best.f.sequence, best.t.sequence)
    const hi = Math.max(best.f.sequence, best.t.sequence)
    const between = route.stops.filter((s) => s.sequence >= lo && s.sequence <= hi)
    const km = ridingDistanceKm(between)

    let busEtaMins: number | null = null
    if (route.location && best.f.lat != null && best.f.lng != null) {
      const busKm = distanceKm(route.location.lat, route.location.lng, best.f.lat, best.f.lng)
      busEtaMins = Math.max(1, Math.round((busKm / AVG_SPEED_KMH) * 60))
    }

    plans.push({
      route: { id: route.id, number: route.number, name: route.name, plateType: route.plateType, fare: route.fare },
      direction: forward ? 'FORWARD' : 'REVERSE',
      fromStop: { id: best.f.id, name: best.f.name },
      toStop: { id: best.t.id, name: best.t.name },
      stopsCount: hi - lo,
      distanceKm: Number(km.toFixed(1)),
      rideMins: Math.max(1, Math.round((km / AVG_SPEED_KMH) * 60)),
      fare: route.fare,
      busEtaMins,
    })
  }

  return plans.sort((a, b) => a.rideMins - b.rideMins || a.fare - b.fare)
}
