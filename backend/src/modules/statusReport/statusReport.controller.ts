import { Request, Response } from 'express'
import { ReportStatus } from '@prisma/client'
import { asyncHandler } from '../../utils/asyncHandler'
import { sendCreated, sendSuccess } from '../../utils/apiResponse'
import * as statusReportService from './statusReport.service'

export const createStatusReport = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.sub ?? null
  const body = req.body as { stopId: number; status: ReportStatus; note?: string }
  const report = await statusReportService.create(userId, Number(req.params.id), body)
  sendCreated(res, report, 'รายงานสถานะสำเร็จ ขอบคุณที่ช่วยอัปเดตให้ผู้โดยสารคนอื่น')
})

export const listStatusReports = asyncHandler(async (req: Request, res: Response) => {
  const minutes = req.query.minutes ? Number(req.query.minutes) : undefined
  const reports = await statusReportService.getRecentByRoute(Number(req.params.id), minutes)
  sendSuccess(res, reports)
})
