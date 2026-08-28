import { Request, Response } from 'express'
import { asyncHandler } from '../../utils/asyncHandler'
import { sendSuccess } from '../../utils/apiResponse'
import * as trackingService from './tracking.service'

export const upsertLocation = asyncHandler(async (req: Request, res: Response) => {
  const location = await trackingService.upsertLocation(Number(req.params.id), req.body)
  sendSuccess(res, location, 'อัปเดตตำแหน่งสำเร็จ')
})

export const getLocation = asyncHandler(async (req: Request, res: Response) => {
  const location = await trackingService.getLocation(Number(req.params.id))
  sendSuccess(res, location)
})

export const getEta = asyncHandler(async (req: Request, res: Response) => {
  const eta = await trackingService.getEta(Number(req.params.id), Number(req.query.stopId))
  sendSuccess(res, eta)
})
