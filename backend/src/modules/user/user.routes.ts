import { Router } from 'express'
import * as controller from './user.controller'
import { requireAuth, requireRole } from '../../middleware/auth.middleware'
import { validate } from '../../middleware/validate.middleware'
import { updateUserSchema } from './user.schema'

const router = Router()

router.get('/me', requireAuth, controller.getMe)
router.get('/check-username/:username', controller.checkUsername) // สาธารณะ ใช้ตอนสมัครสมาชิกก่อน login
router.get('/', requireAuth, requireRole('ADMIN'), controller.listUsers)
router.get('/:id', requireAuth, controller.getUserById)
router.put('/:id', requireAuth, validate(updateUserSchema), controller.updateUser)
router.delete('/:id', requireAuth, controller.deleteUser)

export default router
