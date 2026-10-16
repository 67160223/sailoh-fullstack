import { CrowdLevel } from '@prisma/client'
import { prisma } from '../../config/prisma'
import { ApiError } from '../../utils/ApiError'

const WINDOW_MINUTES = 20 // รายงานเก่ากว่านี้ไม่นับ — ความหนาแน่นเปลี่ยนเร็วตามป้ายที่รถผ่าน
const REPORT_COOLDOWN_MS = 2 * 60 * 1000 // กันผู้ใช้คนเดิมกดรายงานซ้ำถี่เกินไปในสายเดียวกัน

const LEVEL_VALUE: Record<CrowdLevel, number> = { EMPTY: 1, MODERATE: 2, FULL: 3 }

async function assertRouteExists(routeId: number) {
  const route = await prisma.route.findUnique({ where: { id: routeId }, select: { id: true } })
  if (!route) throw ApiError.notFound('ไม่พบสายรถเมล์นี้')
}

export async function create(userId: number | null, routeId: number, level: CrowdLevel) {
  await assertRouteExists(routeId)

  if (userId) {
    const cooldownSince = new Date(Date.now() - REPORT_COOLDOWN_MS)
    const recent = await prisma.crowdReport.findFirst({
      where: { userId, routeId, createdAt: { gte: cooldownSince } },
    })
    if (recent) throw ApiError.conflict('รายงานได้อีกครั้งในอีกสักครู่ (กันการรายงานซ้ำถี่เกินไป)')
  }

  return prisma.crowdReport.create({ data: { routeId, userId, level } })
}

// สรุปความหนาแน่นของสาย = ค่าเฉลี่ยของรายงานภายใน WINDOW_MINUTES นาทีล่าสุด ปัดเป็น 3 ระดับ
// ถ้าไม่มีรายงานเลย level เป็น null (frontend แสดงว่า "ยังไม่มีรายงาน" แทนการเดา)
export async function getSummary(routeId: number) {
  await assertRouteExists(routeId)

  const cutoff = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000)
  const reports = await prisma.crowdReport.findMany({
    where: { routeId, createdAt: { gte: cutoff } },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: { level: true, createdAt: true },
  })

  const counts: Record<CrowdLevel, number> = { EMPTY: 0, MODERATE: 0, FULL: 0 }
  let sum = 0
  for (const r of reports) {
    counts[r.level] += 1
    sum += LEVEL_VALUE[r.level]
  }

  let level: CrowdLevel | null = null
  if (reports.length > 0) {
    const avg = sum / reports.length
    level = avg < 1.67 ? 'EMPTY' : avg < 2.34 ? 'MODERATE' : 'FULL'
  }

  return {
    routeId,
    level,
    total: reports.length,
    counts,
    windowMinutes: WINDOW_MINUTES,
    lastReportAt: reports[0]?.createdAt ?? null,
  }
}
