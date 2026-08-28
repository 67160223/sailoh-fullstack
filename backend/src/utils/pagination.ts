import { Request } from 'express'

export interface PaginationParams {
  page: number
  limit: number
  skip: number
  take: number
}

// query params: ?page=1&limit=20 — ค่าเริ่มต้นและเพดานป้องกันคน query limit สูงเกินจำเป็น
export function parsePagination(query: Request['query']): PaginationParams {
  const page = Math.max(1, parseInt(String(query.page ?? '1'), 10) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(String(query.limit ?? '20'), 10) || 20))
  return { page, limit, skip: (page - 1) * limit, take: limit }
}

export function paginationMeta(total: number, { page, limit }: PaginationParams) {
  return { page, limit, total, totalPages: Math.ceil(total / limit) || 1 }
}
