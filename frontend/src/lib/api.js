// ตัว fetch กลาง — เรียก bus-tracking-api (TypeScript + Prisma + PostgreSQL)
// ตั้ง VITE_API_URL ใน .env ให้ตรงกับที่ API รันอยู่ (ดู .env.example)
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1'

export class ApiFetchError extends Error {
  constructor(message, status, details) {
    super(message)
    this.status = status
    this.details = details
  }
}

// ทุก endpoint ของ bus-tracking-api ตอบกลับด้วย { success, message, data } เสมอ (ดู apiResponse.ts ฝั่ง API)
// ฟังก์ชันนี้ unwrap ให้เหลือแค่ data ตรง ๆ เพื่อให้ที่เรียกใช้ไม่ต้องแตะ envelope ทุกครั้ง
export async function apiFetch(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  const json = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new ApiFetchError(json.message || `เกิดข้อผิดพลาด (${res.status})`, res.status, json.error)
  }

  return json.data
}
