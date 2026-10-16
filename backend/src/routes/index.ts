import { Router } from 'express'

import authRoutes from '../modules/auth/auth.routes'
import userRoutes from '../modules/user/user.routes'
import routeRoutes from '../modules/route/route.routes'
import favoriteRoutes from '../modules/favorite/favorite.routes'
import { nestedStopRouter, stopRouter } from '../modules/stop/stop.routes'
import { trackingRouter } from '../modules/tracking/tracking.routes'
import { statusReportRouter } from '../modules/statusReport/statusReport.routes'
import { crowdRouter } from '../modules/crowd/crowd.routes'
import walletRoutes from '../modules/wallet/wallet.routes'
import { nestedTicketRouter, ticketRouter } from '../modules/ticket/ticket.routes'
import { sendSuccess } from '../utils/apiResponse'

const router = Router()

router.get('/health', (_req, res) => sendSuccess(res, { status: 'ok' }))

router.use('/auth', authRoutes)
router.use('/users', userRoutes)
router.use('/routes', routeRoutes)
router.use('/routes/:id/stops', nestedStopRouter) // POST /routes/:id/stops
router.use('/routes/:id', trackingRouter) // GET/POST /routes/:id/location, GET /routes/:id/eta
router.use('/routes/:id', statusReportRouter) // GET/POST /routes/:id/status-reports
router.use('/routes/:id', crowdRouter) // GET/POST /routes/:id/crowd (ความหนาแน่นผู้โดยสาร)
router.use('/routes/:id', nestedTicketRouter) // POST /routes/:id/tickets (ซื้อตั๋ว)
router.use('/stops', stopRouter) // PUT/DELETE /stops/:stopId
router.use('/favorites', favoriteRoutes)
router.use('/wallet', walletRoutes) // GET /wallet, POST /wallet/topup
router.use('/tickets', ticketRouter) // GET /tickets/me, POST /tickets/:ticketId/use

export default router
