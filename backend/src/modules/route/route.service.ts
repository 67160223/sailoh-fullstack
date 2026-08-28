import { Prisma } from '@prisma/client'
import { prisma } from '../../config/prisma'
import { ApiError } from '../../utils/ApiError'
import { parsePagination, paginationMeta } from '../../utils/pagination'

const routeInclude = { stops: { orderBy: { sequence: 'asc' as const } }, location: true }

export async function list(query: { page?: string; limit?: string; search?: string }) {
  const pagination = parsePagination(query)
  const search = query.search?.trim()

  const where: Prisma.RouteWhereInput = search
    ? { OR: [{ number: { contains: search, mode: 'insensitive' } }, { name: { contains: search, mode: 'insensitive' } }] }
    : {}

  const [items, total] = await Promise.all([
    prisma.route.findMany({ where, skip: pagination.skip, take: pagination.take, orderBy: { number: 'asc' }, include: routeInclude }),
    prisma.route.count({ where }),
  ])

  return { items, meta: paginationMeta(total, pagination) }
}

// สำหรับ auto-suggest ระหว่างพิมพ์ค้นหา — จำกัด 8 รายการ ไม่ต้อง paginate
export async function search(q: string) {
  if (!q.trim()) return []
  return prisma.route.findMany({
    where: { OR: [{ number: { contains: q, mode: 'insensitive' } }, { name: { contains: q, mode: 'insensitive' } }] },
    take: 8,
    orderBy: { number: 'asc' },
    include: { location: true },
  })
}

export async function getById(id: number) {
  const route = await prisma.route.findUnique({ where: { id }, include: routeInclude })
  if (!route) throw ApiError.notFound('ไม่พบสายรถเมล์นี้')
  return route
}

export async function create(input: {
  number: string
  name: string
  plateType?: 'ORDINARY' | 'AIRCON' | 'BRT'
  stops?: { name: string; lat?: number; lng?: number }[]
}) {
  return prisma.route.create({
    data: {
      number: input.number,
      name: input.name,
      plateType: input.plateType || 'ORDINARY',
      stops: input.stops?.length
        ? { create: input.stops.map((s, i) => ({ name: s.name, sequence: i, lat: s.lat, lng: s.lng })) }
        : undefined,
    },
    include: routeInclude,
  })
}

export async function update(id: number, input: { number?: string; name?: string; plateType?: 'ORDINARY' | 'AIRCON' | 'BRT' }) {
  return prisma.route.update({ where: { id }, data: input, include: routeInclude })
}

export async function remove(id: number) {
  await prisma.route.delete({ where: { id } })
}
