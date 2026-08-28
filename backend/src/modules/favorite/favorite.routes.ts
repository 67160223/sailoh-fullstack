import { Router } from 'express'
import * as controller from './favorite.controller'
import { requireAuth } from '../../middleware/auth.middleware'

const router = Router()

router.use(requireAuth) // สายที่บันทึกไว้เป็นข้อมูลส่วนตัว ต้อง login ทุก endpoint

router.get('/', controller.listFavorites)
router.post('/:routeId', controller.addFavorite)
router.delete('/:routeId', controller.removeFavorite)

export default router
