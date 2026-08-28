import { Request, Response } from 'express'
import { asyncHandler } from '../../utils/asyncHandler'
import { sendCreated, sendNoContent, sendSuccess } from '../../utils/apiResponse'
import * as stopService from './stop.service'

export const addStop = asyncHandler(async (req: Request, res: Response) => {
  const stop = await stopService.addStop(Number(req.params.id), req.body)
  sendCreated(res, stop, 'เพิ่มป้ายสำเร็จ')
})

export const updateStop = asyncHandler(async (req: Request, res: Response) => {
  const stop = await stopService.updateStop(Number(req.params.stopId), req.body)
  sendSuccess(res, stop, 'แก้ไขป้ายสำเร็จ')
})

export const deleteStop = asyncHandler(async (req: Request, res: Response) => {
  await stopService.deleteStop(Number(req.params.stopId))
  sendNoContent(res)
})
