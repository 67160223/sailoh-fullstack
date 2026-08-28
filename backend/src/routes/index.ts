import { Router } from 'express'

import authRoutes from '../modules/auth/auth.routes'
import userRoutes from '../modules/user/user.routes'
import routeRoutes from '../modules/route/route.routes'
import favoriteRoutes from '../modules/favorite/favorite.routes'
import { nestedStopRouter, stopRouter } from '../modules/stop/stop.routes'
import { trackingRouter } from '../modules/tracking/tracking.routes'
import { sendSuccess } from '../utils/apiResponse'

const router = Router()

router.get('/health', (_req, res) => sendSuccess(res, { status: 'ok' }))

router.use('/auth', authRoutes)
router.use('/users', userRoutes)
router.use('/routes', routeRoutes)
router.use('/routes/:id/stops', nestedStopRouter) // POST /routes/:id/stops
router.use('/routes/:id', trackingRouter) // GET/POST /routes/:id/location, GET /routes/:id/eta
router.use('/stops', stopRouter) // PUT/DELETE /stops/:stopId
router.use('/favorites', favoriteRoutes)

export default router
