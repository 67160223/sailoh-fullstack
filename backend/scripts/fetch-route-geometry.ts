// ดึงเส้นทาง "จริงตามถนน" (road-snapped geometry) ของแต่ละสาย จาก OSRM (Open Source Routing Machine)
// แล้วบันทึกลง column routes.routeGeometry — ให้ frontend เอาไปวาดเป็นเส้นทับถนนจริงแทนการลากเส้นตรงต่อจุดป้าย
//
// ใช้ OSRM public demo server (router.project-osrm.org) — ฟรี ไม่ต้องขอ API key
// ข้อจำกัด: เป็น server สาธิตสำหรับงานไม่หวังผลกำไร (non-commercial) และจำกัดความถี่คร่าว ๆ ~1 request/วินาที
// ถ้าจะใช้งานจริงจัง/โปรดักชัน ควรรัน OSRM เอง หรือใช้ routing service เจ้าอื่นที่มี SLA (เช่น Mapbox, GraphHopper)
//
// วิธีรัน (รันจากเครื่องตัวเอง เพราะ sandbox นี้ต่ออินเทอร์เน็ตออกไปหา router.project-osrm.org ไม่ได้):
//   cd backend
//   npx tsx scripts/fetch-route-geometry.ts
//
// ต้องรันหลังจากมีข้อมูลสาย+ป้าย(พิกัด)ใน DB แล้ว (เช่นรัน fetch:routes + prisma:seed มาก่อน)
// สคริปต์นี้แก้ไข DB ตรง ๆ ผ่าน Prisma ไม่ได้เขียนไฟล์ JSON แยกเหมือน fetch-osm-routes.ts

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const OSRM_URL = 'https://router.project-osrm.org/route/v1/driving'
const DELAY_MS = 1200 // เว้นจังหวะระหว่าง request กัน OSRM public server ปฏิเสธ (usage policy ของเขา)

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

type OsrmResponse = {
  code: string
  routes?: { geometry: { coordinates: [number, number][] } }[]
}

async function fetchGeometry(points: { lat: number; lng: number }[]): Promise<[number, number][] | null> {
  // OSRM ต้องการพิกัดแบบ lng,lat คั่นด้วย ; (กลับด้านจาก lat,lng ที่ใช้กันทั่วไปใน Leaflet)
  const coordsParam = points.map((p) => `${p.lng},${p.lat}`).join(';')
  const url = `${OSRM_URL}/${coordsParam}?overview=full&geometries=geojson`

  const res = await fetch(url)
  if (!res.ok) {
    console.warn(`    ⚠ OSRM ตอบ ${res.status}`)
    return null
  }

  const json = (await res.json()) as OsrmResponse
  if (json.code !== 'Ok' || !json.routes || json.routes.length === 0) {
    console.warn(`    ⚠ OSRM หาเส้นทางไม่ได้ (code: ${json.code})`)
    return null
  }

  // GeoJSON ให้พิกัดเป็น [lng, lat] — ต้องกลับเป็น [lat, lng] ให้ Leaflet ใช้ได้ตรง ๆ
  return json.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng])
}

async function main() {
  const routes = await prisma.route.findMany({
    include: { stops: { orderBy: { sequence: 'asc' } } },
  })

  console.log(`พบ ${routes.length} สายในฐานข้อมูล กำลังหาเส้นทางจริงตามถนนทีละสาย...\n`)

  let okCount = 0
  for (const route of routes) {
    const points = route.stops
      .filter((s) => s.lat != null && s.lng != null)
      .map((s) => ({ lat: s.lat as number, lng: s.lng as number }))

    process.stdout.write(`สาย ${route.number} (${points.length} ป้ายมีพิกัด)... `)

    if (points.length < 2) {
      console.log('✗ ป้ายมีพิกัดน้อยกว่า 2 จุด ข้ามไป')
      continue
    }

    try {
      const geometry = await fetchGeometry(points)
      if (geometry) {
        await prisma.route.update({
          where: { id: route.id },
          data: { routeGeometry: geometry },
        })
        console.log(`✓ ได้เส้นทาง ${geometry.length} จุด`)
        okCount++
      } else {
        console.log('✗ ไม่ได้เส้นทางจาก OSRM')
      }
    } catch (err) {
      console.log(`✗ error: ${(err as Error).message}`)
    }

    await sleep(DELAY_MS)
  }

  console.log(`\nเสร็จแล้ว — ได้เส้นทางจริงตามถนน ${okCount}/${routes.length} สาย`)
  console.log('(สายที่ไม่ได้ — หน้าแผนที่จะ fallback ไปลากเส้นตรงระหว่างป้ายแทนโดยอัตโนมัติ)')
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
