import { Router } from 'express'
import * as controller from './ticket.controller'
import { requireAuth } from '../../middleware/auth.middleware'

// mount ที่ /routes/:id — POST /routes/:id/tickets (ซื้อตั๋วของสายนี้)
export const nestedTicketRouter = Router({ mergeParams: true })
nestedTicketRouter.post('/tickets', requireAuth, controller.purchaseTicket)

// mount ที่ /tickets — GET /tickets/me, POST /tickets/:ticketId/use
export const ticketRouter = Router()
ticketRouter.get('/me', requireAuth, controller.listMyTickets)
ticketRouter.post('/:ticketId/use', requireAuth, controller.useTicket)
