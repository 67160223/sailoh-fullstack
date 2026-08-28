import { Prisma } from '@prisma/client'
import { prisma } from '../../config/prisma'
import { ApiError } from '../../utils/ApiError'
import { parsePagination, paginationMeta } from '../../utils/pagination'
import { AuthUser } from '../../types/express'

function publicUser(user: { passwordHash: string; [k: string]: unknown }) {
  const { passwordHash, ...safe } = user
  return safe
}

export async function getById(id: number) {
  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) throw ApiError.notFound('ไม่พบผู้ใช้')
  return publicUser(user)
}

export async function list(query: { page?: string; limit?: string; search?: string }) {
  const pagination = parsePagination(query)
  const search = query.search?.trim()

  const where: Prisma.UserWhereInput = search
    ? {
        OR: [
          { username: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }
    : {}

  const [items, total] = await Promise.all([
    prisma.user.findMany({ where, skip: pagination.skip, take: pagination.take, orderBy: { id: 'asc' } }),
    prisma.user.count({ where }),
  ])

  return { items: items.map(publicUser), meta: paginationMeta(total, pagination) }
}

export async function update(
  targetId: number,
  requester: AuthUser,
  input: { email?: string; displayName?: string; role?: 'USER' | 'ADMIN'; avatarUrl?: string | null }
) {
  if (requester.sub !== targetId && requester.role !== 'ADMIN') {
    throw ApiError.forbidden('แก้ไขได้เฉพาะข้อมูลของตัวเอง')
  }

  const data: Prisma.UserUpdateInput = {}
  if (input.email !== undefined) data.email = input.email
  if (input.displayName !== undefined) data.displayName = input.displayName
  if (input.avatarUrl !== undefined) data.avatarUrl = input.avatarUrl
  // เปลี่ยน role ได้เฉพาะ ADMIN เท่านั้น กันคนตั้งตัวเองเป็น admin
  if (input.role !== undefined && requester.role === 'ADMIN') data.role = input.role

  const user = await prisma.user.update({ where: { id: targetId }, data })
  return publicUser(user)
}

export async function remove(targetId: number, requester: AuthUser) {
  if (requester.sub !== targetId && requester.role !== 'ADMIN') {
    throw ApiError.forbidden('ลบได้เฉพาะบัญชีของตัวเอง')
  }
  await prisma.user.delete({ where: { id: targetId } })
}

export async function checkUsername(username: string) {
  const existing = await prisma.user.findUnique({ where: { username } })
  return { username, available: !existing }
}
