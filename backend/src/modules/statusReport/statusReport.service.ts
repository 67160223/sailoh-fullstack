import { ReportStatus } from '@prisma/client'
import { prisma } from '../../config/prisma'
import { ApiError } from '../../utils/ApiError'

const DEFAULT_WINDOW_MINUTES = 30 // รายงานเก่ากว่านี้ไม่มีผลกับสถานะที่แสดง กันข้อมูลค้าง
const REPORT_COOLDOWN_MS = 2 * 60 * 1000 // กันผู้ใช้คนเดิมสแปมรายงานซ้ำถี่เกินไปในสายเดียวกัน

export async function create(
  userId: number | null,
  routeId: number,
  input: { stopId: number; status: ReportStatus; note?: string }
) {
  const stop = await prisma.stop.findUnique({ where: { id: input.stopId } })
  if (!stop || stop.routeId !== routeId) throw ApiError.notFound('ไม่พบป้ายนี้ในสายนี้')

  if (userId) {
    const cooldownSince = new Date(Date.now() - REPORT_COOLDOWN_MS)
    const recent = await prisma.statusReport.findFirst({
      where: { userId, routeId, createdAt: { gte: cooldownSince } },
    })
    if (recent) throw ApiError.conflict('รายงานได้อีกครั้งในอีกสักครู่ (กันการรายงานซ้ำถี่เกินไป)')
  }

  return prisma.statusReport.create({
    data: {
      routeId,
      stopId: input.stopId,
      userId,
      status: input.status,
      note: input.note,
    },
  })
}

// คืนรายงานล่าสุด 1 รายการต่อป้าย (ภายในหน้าต่างเวลาที่กำหนด) เรียงตามป้ายที่มีรายงานล่าสุดก่อน
export async function getRecentByRoute(routeId: number, windowMinutes = DEFAULT_WINDOW_MINUTES) {
  const cutoff = new Date(Date.now() - windowMinutes * 60 * 1000)

  const reports = await prisma.statusReport.findMany({
    where: { routeId, createdAt: { gte: cutoff } },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: { stop: { select: { id: true, name: true, sequence: true } } },
  })

  const latestPerStop = new Map<number, (typeof reports)[number]>()
  for (const report of reports) {
    if (!latestPerStop.has(report.stopId)) latestPerStop.set(report.stopId, report)
  }

  return Array.from(latestPerStop.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}
