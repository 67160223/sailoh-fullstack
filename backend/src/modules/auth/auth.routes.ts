import { Router } from 'express'
import * as controller from './auth.controller'
import { validate } from '../../middleware/validate.middleware'
import { requireAuth } from '../../middleware/auth.middleware'
import { loginLimiter, registerLimiter } from '../../middleware/rateLimiter'
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  logoutSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './auth.schema'

const router = Router()

router.post('/register', registerLimiter, validate(registerSchema), controller.register)
router.post('/login', loginLimiter, validate(loginSchema), controller.login)
router.post('/refresh', validate(refreshSchema), controller.refresh)
router.post('/logout', validate(logoutSchema), controller.logout)
router.post('/change-password', requireAuth, validate(changePasswordSchema), controller.changePassword)
router.post('/forgot-password', validate(forgotPasswordSchema), controller.forgotPassword)
router.post('/reset-password', validate(resetPasswordSchema), controller.resetPassword)

export default router