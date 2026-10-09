import { Request, Response } from 'express'
import { asyncHandler } from '../../utils/asyncHandler'
import { sendSuccess } from '../../utils/apiResponse'
import * as walletService from './wallet.service'

export const getMyWallet = asyncHandler(async (req: Request, res: Response) => {
  const wallet = await walletService.getWalletWithHistory(req.user!.sub)
  sendSuccess(res, wallet)
})

export const topupWallet = asyncHandler(async (req: Request, res: Response) => {
  const { amount } = req.body as { amount: number }
  const wallet = await walletService.topup(req.user!.sub, amount)
  sendSuccess(res, wallet, `เติมเงินสำเร็จ ${amount.toLocaleString('th-TH')} บาท (โหมดเดโม ยังไม่มีการเก็บเงินจริง)`)
})
