import { useEffect, useMemo, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useTheme } from '../context/ThemeContext'
import './RouteMap.css'

// react-leaflet ไม่แถม marker icon แบบ default มาให้ใช้ตรง ๆ (path ของรูปหักตอน build ด้วย Vite)
// เลยสร้าง icon เองด้วย divIcon แทน ไม่ต้องพึ่งไฟล์รูปจาก leaflet เลย ปรับสีให้เข้าธีมแอปได้ด้วย
function plateIcon(label, { bg = '#F4E7D3', fg = '#1C2128', size = 30 } = {}) {
  return L.divIcon({
    className: 'route-map-plate-icon',
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:8px;
      background:${bg};color:${fg};
      display:flex;align-items:center;justify-content:center;
      font-family:'Leelawadee UI','Noto Sans Thai',sans-serif;font-weight:700;
      font-size:${size * 0.42}px;
      box-shadow:0 2px 6px rgba(0,0,0,0.45);
      border:2px solid rgba(255,255,255,0.15);
    ">${label}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

function busIcon(status) {
  const tone = status === 'DELAYED' ? '#FFB627' : status === 'LAST' ? '#E4572E' : '#2BAF7A'
  return L.divIcon({
    className: 'route-map-bus-icon',
    html: `<div style="
      width:38px;height:38px;border-radius:50%;
      background:${tone};display:flex;align-items:center;justify-content:center;
      font-size:19px;box-shadow:0 0 0 6px ${tone}33, 0 2px 8px rgba(0,0,0,0.5);
      border:2px solid #14171C;
    ">🚌</div>`,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
  })
}

// component ลูกที่ทำหน้าที่สั่ง map ซูม/เลื่อนให้เห็นทุกจุดพอดี — ต้องอยู่ใต้ MapContainer เท่านั้น
// เพราะ useMap() ใช้ context ของ react-leaflet ที่มีแค่ภายใน MapContainer
//
// สำคัญ: ซูมให้พอดีแค่ "ครั้งแรก" ที่มีพิกัดเท่านั้น (ใช้ didFit กันไว้) ไม่ซูมซ้ำทุกครั้งที่ตำแหน่งรถเปลี่ยน
// เพราะหน้า RouteDetail poll ตำแหน่งรถทุก 3 วิ ถ้าซูมใหม่ทุกรอบ จะดึงแผนที่ที่ผู้ใช้ซูม/เลื่อนเองไว้กลับไปจุดเดิมตลอด
function FitBounds({ points }) {
  const map = useMap()
  const didFit = useRef(false)
  useEffect(() => {
    if (didFit.current || !points.length) return
    didFit.current = true
    if (points.length === 1) {
      map.setView(points[0], 15)
      return
    }
    map.fitBounds(L.latLngBounds(points), { padding: [36, 36], maxZoom: 16 })
  }, [map, points])
  return null
}

/**
 * แผนที่จริงแบบ pan/zoom ได้เหมือน Google Maps — ใช้ OpenStreetMap/CartoDB (ฟรี ไม่ต้องขอ API key)
 *
 * props:
 * - stops: [{ id, name, lat, lng, sequence }]  ป้ายของสาย (ต้องมี lat/lng ถึงจะขึ้นบนแผนที่ได้)
 * - busPosition: { lat, lng, status } | null   ตำแหน่งรถล่าสุด (ไม่มีก็ได้ ถ้ายังไม่มีข้อมูล GPS)
 * - nextStopId: number | null                  เอาไว้ไฮไลต์ป้ายถัดไปที่รถกำลังจะถึง
 * - routeGeometry: [[lat,lng], ...] | null     เส้นทางจริงตามถนน (ได้จาก scripts/fetch-route-geometry.ts ผ่าน OSRM)
 *                                               ถ้าไม่มี (ยังไม่เคยรันสคริปต์) จะ fallback ไปลากเส้นตรงต่อจุดป้ายแทน
 * - height: number                             ความสูงของแผนที่ (px)
 */
export default function RouteMap({ stops = [], busPosition = null, nextStopId = null, routeGeometry = null, height = 300 }) {
  const mapRef = useRef(null)
  const { theme } = useTheme()

  // เดิมใช้ tile ฟรีของ CartoDB (basemaps.cartocdn.com) แต่ตอนนี้ CartoDB เปลี่ยนนโยบายให้ต้องสมัคร API key
  // ถึงจะใช้ได้ (เห็นเป็นลาย "API KEY REQUIRED" ทับแผนที่) เลยเปลี่ยนมาใช้ tile มาตรฐานของ OpenStreetMap เอง
  // แทน — ฟรี ไม่ต้องขอ key แต่มีให้แบบสว่างแบบเดียว โหมดมืดเลยใช้ CSS filter invert สีแทน (เทคนิคที่ใช้กันทั่วไป)
  const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

  const stopPoints = useMemo(
    () => stops.filter((s) => s.lat != null && s.lng != null).map((s) => [s.lat, s.lng]),
    [stops]
  )
  const busPoint = busPosition ? [busPosition.lat, busPosition.lng] : null
  const allPoints = busPoint ? [...stopPoints, busPoint] : stopPoints

  // ถ้ามี routeGeometry (เส้นทางจริงตามถนนจาก OSRM) ให้ใช้วาดเส้นแทนการลากเส้นตรงต่อจุดป้าย
  // ตรวจรูปแบบคร่าว ๆ กันพังถ้าข้อมูลใน DB ผิดรูป (ต้องเป็น array ของ [lat,lng] อย่างน้อย 2 จุด)
  const geometryPoints = useMemo(() => {
    if (!Array.isArray(routeGeometry) || routeGeometry.length < 2) return null
    const valid = routeGeometry.every(
      (p) => Array.isArray(p) && p.length === 2 && typeof p[0] === 'number' && typeof p[1] === 'number'
    )
    return valid ? routeGeometry : null
  }, [routeGeometry])
  const linePoints = geometryPoints || stopPoints

  if (allPoints.length === 0) {
    return (
      <div className="route-map route-map--empty" style={{ height }}>
        ยังไม่มีพิกัดป้ายสำหรับสายนี้ — ใส่ lat/lng ให้ป้ายก่อนถึงจะแสดงบนแผนที่ได้
      </div>
    )
  }

  return (
    <div className={`route-map${theme === 'dark' ? ' route-map--dark' : ''}`} style={{ height }}>
      <MapContainer
        ref={mapRef}
        center={allPoints[0]}
        zoom={14}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%', borderRadius: 'inherit' }}
      >
        {/* tile มาตรฐานของ OpenStreetMap — ฟรี ไม่ต้องมี API key (ดูคอมเมนต์ด้านบนเรื่อง CartoDB) */}
        <TileLayer
          url={tileUrl}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          subdomains="abc"
          maxZoom={19}
        />

        {/* เส้นทางสาย — ใช้ geometryPoints (เส้นตามถนนจริงจาก OSRM) ถ้ามี ไม่งั้น fallback ไปเส้นตรงต่อจุดป้าย */}
        {linePoints.length > 1 && (
          <Polyline positions={linePoints} pathOptions={{ color: '#FFB627', weight: 4, opacity: 0.75 }} />
        )}

        {stops
          .filter((s) => s.lat != null && s.lng != null)
          .map((s) => {
            const isNext = s.id === nextStopId
            return (
              <Marker
                key={s.id}
                position={[s.lat, s.lng]}
                icon={plateIcon(String(s.sequence + 1), isNext ? { bg: '#FFB627', fg: '#14171C' } : {})}
              />
            )
          })}

        {busPoint && <Marker position={busPoint} icon={busIcon(busPosition.status)} />}

        {/* ใช้แค่ stopPoints (ไม่รวมตำแหน่งรถ) กันการซูมสั่นเวลารถขยับ — ถ้าไม่มีป้ายเลยค่อย fallback ไปจุดรถแทน */}
        <FitBounds points={stopPoints.length ? stopPoints : allPoints} />
      </MapContainer>
    </div>
  )
}
