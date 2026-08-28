import { useState } from 'react'
import './ShareButton.css'

// แก้ pain point "แชร์ก็อปลิงก์ยาก" — ลิงก์นี้เปิดแล้วพาไปหน้าสายเดียวกันทันที ไม่ต้องพิมพ์ค้นหาใหม่
export default function ShareButton({ route }) {
  const [copied, setCopied] = useState(false)
  const shareUrl = `${window.location.origin}/route/${route.id}`
  const shareText = `ดูรถเมล์สาย ${route.number} แบบเรียลไทม์`

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: shareText, url: shareUrl })
      } catch {
        // ผู้ใช้ยกเลิกการแชร์ — ไม่ต้องแจ้งเตือน
      }
      return
    }
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard ใช้ไม่ได้ในเบราว์เซอร์นี้
    }
  }

  return (
    <button className="share-button" onClick={handleShare}>
      <span aria-hidden>↗</span>
      {copied ? 'คัดลอกลิงก์แล้ว' : 'แชร์สายนี้'}
    </button>
  )
}
