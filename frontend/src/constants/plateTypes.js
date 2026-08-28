// สีป้ายตามประเภทรถ — ใช้แค่การนำเสนอ ไม่ใช่ mock data (route จริงมาจาก API แล้ว)
export const PLATE_TYPES = {
  ordinary: { label: 'ธรรมดา', bg: 'var(--plate-cream)', fg: '#1c2128' },
  aircon: { label: 'ปรับอากาศ', bg: '#2b5aa0', fg: '#f4f6f9' },
  brt: { label: 'ด่วนพิเศษ', bg: 'var(--red)', fg: '#f4f6f9' },
}

export const STATUS_COPY = {
  moving: { label: 'กำลังมา', dot: 'var(--green)' },
  delayed: { label: 'ช้ากว่าปกติ', dot: 'var(--amber)' },
  last: { label: 'คันสุดท้าย', dot: 'var(--red)' },
}
