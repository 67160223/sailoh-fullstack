// ดึงข้อมูลสายรถเมล์ + ป้าย "จริง" จาก OpenStreetMap (ผ่าน Overpass API) มาเป็น prisma/seed-data/osm-routes.json
// ให้ seed.ts เอาไปใช้แทนพิกัดที่พิมพ์มือ — ฟรี ไม่ต้องขอ API key
//
// วิธีรัน (รันจากเครื่องตัวเอง เพราะ sandbox นี้ต่ออินเทอร์เน็ตออกไป Overpass ไม่ได้):
//   cd backend
//   npx tsx scripts/fetch-osm-routes.ts
//
// ผลลัพธ์: backend/prisma/seed-data/osm-routes.json
// แล้วรัน `npm run prisma:seed` (หรือ docker compose up ใหม่ ถ้า seed รันตอน container start) เพื่อลงข้อมูลจริงเข้า DB

import fs from 'fs'
import path from 'path'

// กล่องพิกัดครอบพื้นที่กรุงเทพฯ-ปริมณฑล กันดึงรถเมล์ต่างจังหวัดชื่อเลขสายชนกันมาปน
const BBOX = '13.4,100.3,13.95,100.95'

// เลือกสายที่หลากหลาย ครอบคลุมทั้งรถธรรมดา/รถแอร์/BRT และคนละโซนของกรุงเทพฯ
// plateType ใส่ตามที่รู้จริง (OSM ไม่มีแท็กบอกรถแอร์/รถธรรมดาที่เชื่อถือได้ 100%)
const ROUTES: { ref: string; plateType: 'ORDINARY' | 'AIRCON' | 'BRT' }[] = [
  { ref: '140', plateType: 'ORDINARY' },
  { ref: '25', plateType: 'ORDINARY' },
  { ref: '8', plateType: 'ORDINARY' },
  { ref: '15', plateType: 'ORDINARY' },
  { ref: '34', plateType: 'ORDINARY' },
  { ref: '73', plateType: 'ORDINARY' },
  { ref: '204', plateType: 'ORDINARY' },
  { ref: '511', plateType: 'AIRCON' },
  { ref: '547', plateType: 'AIRCON' },
  { ref: '522', plateType: 'AIRCON' },
  { ref: 'BRT', plateType: 'BRT' },
]

const STOP_ROLES = new Set(['stop', 'platform', 'stop_entry_only', 'stop_exit_only'])
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter'
const DELAY_MS = 1500 // เว้นจังหวะระหว่าง request กัน Overpass ปฏิเสธ (usage policy ของเขา)

type OsmElement = {
  type: 'node' | 'way' | 'relation'
  id: number
  lat?: number
  lon?: number
  tags?: Record<string, string>
  members?: { type: string; ref: number; role: string }[]
}

type RouteOut = {
  number: string
  name: string
  plateType: 'ORDINARY' | 'AIRCON' | 'BRT'
  stops: { name: string; lat: number; lng: number }[]
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function buildQuery(ref: string) {
  // สาย BRT ใน OSM ไม่ได้แท็ก ref="BRT" เสมอไป ลองทั้ง ref ตรงตัว และ name ที่มีคำว่า BRT ด้วย
  const refClause = ref === 'BRT'
    ? `relation["route"="bus"]["name"~"BRT",i](${BBOX});`
    : `relation["route"="bus"]["ref"="${ref}"](${BBOX});`
  return `[out:json][timeout:60];\n${refClause}\nout body;\n>;\nout skel qt;`
}

async function fetchRoute(ref: string): Promise<{ name: string; stops: { name: string; lat: number; lng: number }[] } | null> {
  const query = buildQuery(ref)
  const res = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'data=' + encodeURIComponent(query),
  })

  if (!res.ok) {
    console.warn(`  ⚠ สาย ${ref}: Overpass ตอบ ${res.status} — ข้ามไปก่อน`)
    return null
  }

  const json = (await res.json()) as { elements: OsmElement[] }
  const relation = json.elements.find((el) => el.type === 'relation')
  if (!relation || !relation.members) {
    console.warn(`  ⚠ สาย ${ref}: ไม่พบ relation ใน OSM (อาจไม่มีข้อมูล หรือแท็กไม่ตรง)`)
    return null
  }

  const nodeById = new Map<number, OsmElement>()
  for (const el of json.elements) {
    if (el.type === 'node') nodeById.set(el.id, el)
  }

  const stops: { name: string; lat: number; lng: number }[] = []
  let lastId: number | null = null
  for (const member of relation.members) {
    if (member.type !== 'node' || !STOP_ROLES.has(member.role)) continue
    if (member.ref === lastId) continue // กันป้ายซ้ำติดกัน (OSM บางสายมี stop_entry+stop_exit คู่กัน)
    lastId = member.ref

    const node = nodeById.get(member.ref)
    if (!node || node.lat == null || node.lon == null) continue

    stops.push({
      name: node.tags?.name || node.tags?.['name:th'] || `ป้าย ${stops.length + 1}`,
      lat: node.lat,
      lng: node.lon,
    })
  }

  if (stops.length < 2) {
    console.warn(`  ⚠ สาย ${ref}: พบป้ายแค่ ${stops.length} ป้าย (น้อยเกินจะใช้) — ข้ามไปก่อน`)
    return null
  }

  const name =
    relation.tags?.name ||
    (relation.tags?.from && relation.tags?.to ? `${relation.tags.from} – ${relation.tags.to}` : `สาย ${ref}`)

  return { name, stops }
}

async function main() {
  console.log(`กำลังดึงข้อมูล ${ROUTES.length} สายจาก OpenStreetMap/Overpass API...\n`)

  const results: RouteOut[] = []

  for (const { ref, plateType } of ROUTES) {
    process.stdout.write(`สาย ${ref}... `)
    try {
      const data = await fetchRoute(ref)
      if (data) {
        console.log(`✓ พบ ${data.stops.length} ป้าย — "${data.name}"`)
        results.push({ number: ref, name: data.name, plateType, stops: data.stops })
      } else {
        console.log('✗ ไม่พบข้อมูลที่ใช้ได้')
      }
    } catch (err) {
      console.log(`✗ error: ${(err as Error).message}`)
    }
    await sleep(DELAY_MS)
  }

  const outDir = path.join(__dirname, '..', 'prisma', 'seed-data')
  fs.mkdirSync(outDir, { recursive: true })
  const outPath = path.join(outDir, 'osm-routes.json')
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf-8')

  console.log(`\nเสร็จแล้ว — ได้ข้อมูลจริง ${results.length}/${ROUTES.length} สาย`)
  console.log(`บันทึกไว้ที่ ${outPath}`)
  if (results.length < ROUTES.length) {
    console.log('(สายที่ดึงไม่ได้ — seed.ts จะใช้ข้อมูลสำรองที่พิมพ์มือไว้แทนให้อัตโนมัติ)')
  }
  console.log('\nขั้นต่อไป: รัน `npm run prisma:seed` (หรือ docker compose up --build ใหม่ ถ้า seed รันตอน container start)')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
