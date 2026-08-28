import { PLATE_TYPES, STATUS_COPY } from '../plateTypes'
import './RoutePlate.css'

// ทรงป้ายและตัวเลขล้อจากป้ายบอกสายจริงบนหน้ารถเมล์ — จุดจำง่ายที่สุดของทั้งแอป
// route มาจาก API จริงแล้ว: plateType เป็น 'ORDINARY' | 'AIRCON' | 'BRT', สถานะอยู่ใน route.location?.status
// (ยังไม่มีตำแหน่ง GPS โพสต์เข้ามา ก็จะไม่มี route.location — ป้ายจะไม่มีจุดสถานะ ไม่ error)
export default function RoutePlate({ route, size = 'md', status }) {
  const plateKey = (route.plateType || 'ORDINARY').toLowerCase()
  const plate = PLATE_TYPES[plateKey] || PLATE_TYPES.ordinary

  const statusKey = (status ?? route.location?.status ?? '').toLowerCase()
  const statusInfo = STATUS_COPY[statusKey]

  return (
    <div className={`route-plate route-plate--${size}`} style={{ '--plate-bg': plate.bg, '--plate-fg': plate.fg }}>
      <span className="route-plate__rivet route-plate__rivet--tl" />
      <span className="route-plate__rivet route-plate__rivet--tr" />
      <span className="route-plate__number">{route.number}</span>
      {statusInfo && (
        <span className="route-plate__status" style={{ '--dot': statusInfo.dot }}>
          <span className="route-plate__dot" />
        </span>
      )}
    </div>
  )
}
