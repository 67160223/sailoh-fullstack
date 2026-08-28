import { useEffect, useMemo, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useTheme } from '../../context/ThemeContext'
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
function FitBounds({ points }) {
  const map = useMap()
  useEffect(() => {
    if (!points.length) return
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
 * - height: number                             ความสูงของแผนที่ (px)
 */
export default function RouteMap({ stops = [], busPosition = null, nextStopId = null, height = 300 }) {
  const mapRef = useRef(null)
  const { theme } = useTheme()

  // CartoDB มีชุด tile แยกสว่าง/มืดให้ฟรีทั้งคู่ — สลับตามธีมแอปเพื่อให้แผนที่ไม่ตัดกับพื้นหลังหน้าเว็บ
  const tileUrl =
    theme === 'light'
      ? 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'

  const stopPoints = useMemo(
    () => stops.filter((s) => s.lat != null && s.lng != null).map((s) => [s.lat, s.lng]),
    [stops]
  )
  const busPoint = busPosition ? [busPosition.lat, busPosition.lng] : null
  const allPoints = busPoint ? [...stopPoints, busPoint] : stopPoints

  if (allPoints.length === 0) {
    return (
      <div className="route-map route-map--empty" style={{ height }}>
        ยังไม่มีพิกัดป้ายสำหรับสายนี้ — ใส่ lat/lng ให้ป้ายก่อนถึงจะแสดงบนแผนที่ได้
      </div>
    )
  }

  return (
    <div className="route-map" style={{ height }}>
      <MapContainer
        ref={mapRef}
        center={allPoints[0]}
        zoom={14}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%', borderRadius: 'inherit' }}
      >
        {/* CartoDB tiles — สลับสว่าง/มืดตามธีมแอป, ฟรี ไม่ต้องมี API key เหมือน Google Maps */}
        <TileLayer
          url={tileUrl}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          subdomains="abcd"
          maxZoom={19}
        />

        {stopPoints.length > 1 && (
          <Polyline positions={stopPoints} pathOptions={{ color: '#FFB627', weight: 4, opacity: 0.75 }} />
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

        <FitBounds points={allPoints} />
      </MapContainer>
    </div>
  )
}
