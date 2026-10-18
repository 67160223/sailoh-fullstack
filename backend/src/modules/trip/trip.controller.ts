import { Request, Response } from 'express'
import { asyncHandler } from '../../utils/asyncHandler'
import { sendSuccess } from '../../utils/apiResponse'
import * as tripService from './trip.service'

export const listStopNames = asyncHandler(async (_req: Request, res: Response) => {
  const names = await tripService.listStopNames()
  sendSuccess(res, names)
})

export const planTrip = asyncHandler(async (req: Request, res: Response) => {
  const plans = await tripService.plan({ from: String(req.query.from), to: String(req.query.to) })
  sendSuccess(res, plans)
})
