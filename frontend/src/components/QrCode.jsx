import { useMemo } from 'react'
import { generateQr } from '../lib/qr'

const QUIET_ZONE = 4 // ขอบขาวรอบ QR ตามสเปก อย่างน้อย 4 ช่อง ไม่งั้นเครื่องสแกนอ่านยาก

/**
 * แสดง QR Code เป็น SVG — ดำบนขาวเสมอ แม้แอปจะอยู่ในโหมดมืด (เครื่องสแกนอ่านสีกลับไม่ได้)
 *
 * props:
 * - value: string  ข้อความที่จะเข้ารหัส (สูงสุด 106 ไบต์)
 * - size: number   ขนาดเป็นพิกเซล (กว้าง = สูง)
 */
export default function QrCode({ value, size = 180 }) {
  const modules = useMemo(() => {
    try {
      return generateQr(value)
    } catch {
      return null
    }
  }, [value])

  if (!modules) return <p className="qr__error">สร้าง QR ไม่สำเร็จ</p>

  const n = modules.length
  const total = n + QUIET_ZONE * 2
  let path = ''
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (modules[y][x]) path += `M${x + QUIET_ZONE} ${y + QUIET_ZONE}h1v1h-1z`
    }
  }

  return (
    <svg
      role="img"
      aria-label={`QR code ของตั๋ว ${value}`}
      width={size}
      height={size}
      viewBox={`0 0 ${total} ${total}`}
      shapeRendering="crispEdges"
      style={{ display: 'block', background: '#ffffff', borderRadius: 8 }}
    >
      <rect width={total} height={total} fill="#ffffff" />
      <path d={path} fill="#000000" />
    </svg>
  )
}
