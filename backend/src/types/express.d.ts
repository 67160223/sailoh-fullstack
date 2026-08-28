import { Role } from '@prisma/client'

export interface AuthUser {
  sub: number
  username: string
  role: Role
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser
    }
  }
}

export {}
