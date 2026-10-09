import { Request, Response } from 'express'
import { asyncHandler } from '../../utils/asyncHandler'
import { sendCreated, sendSuccess } from '../../utils/apiResponse'
import * as ticketService from './ticket.service'

export const purchaseTicket = asyncHandler(async (req: Request, res: Response) => {
  const ticket = await ticketService.purchase(req.user!.sub, Number(req.params.id))
  sendCreated(res, ticket, 'ซื้อตั๋วสำเร็จ แสดงโค้ดนี้ให้คนขับ/กระเป๋ารถตอนขึ้นรถ')
})

export const listMyTickets = asyncHandler(async (req: Request, res: Response) => {
  const tickets = await ticketService.listMine(req.user!.sub)
  sendSuccess(res, tickets)
})

export const useTicket = asyncHandler(async (req: Request, res: Response) => {
  const ticket = await ticketService.useTicket(req.user!.sub, Number(req.params.ticketId))
  sendSuccess(res, ticket, 'ยืนยันการใช้ตั๋วสำเร็จ เดินทางปลอดภัย 🚌')
})
