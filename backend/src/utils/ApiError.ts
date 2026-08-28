export class ApiError extends Error {
  statusCode: number
  details?: unknown

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message)
    this.statusCode = statusCode
    this.details = details
    this.name = 'ApiError'
  }

  static badRequest(message: string, details?: unknown) {
    return new ApiError(400, message, details)
  }
  static unauthorized(message = 'ต้องเข้าสู่ระบบก่อนใช้งาน') {
    return new ApiError(401, message)
  }
  static forbidden(message = 'ไม่มีสิทธิ์เข้าถึงส่วนนี้') {
    return new ApiError(403, message)
  }
  static notFound(message = 'ไม่พบข้อมูลที่ต้องการ') {
    return new ApiError(404, message)
  }
  static conflict(message: string, details?: unknown) {
    return new ApiError(409, message, details)
  }
}
