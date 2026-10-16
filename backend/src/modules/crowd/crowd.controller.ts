import { Request, Response } from 'express'
import { CrowdLevel } from '@prisma/client'
import { asyncHandler } from '../../utils/asyncHandler'
import { sendCreated, sendSuccess } from '../../utils/apiResponse'
import * as crowdService from './crowd.service'

export const getCrowdSummary = asyncHandler(async (req: Request, res: Response) => {
  const summary = await crowdService.getSummary(Number(req.params.id))
  sendSuccess(res, summary)
})

export const createCrowdReport = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.sub ?? null
  const body = req.body as { level: CrowdLevel }
  await crowdService.create(userId, Number(req.params.id), body.level)
  const summary = await crowdService.getSummary(Number(req.params.id))
  sendCreated(res, summary, 'รายงานความหนาแน่นสำเร็จ ขอบคุณที่ช่วยอัปเดต')
})
