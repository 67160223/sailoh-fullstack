// ตัวสร้าง QR Code แบบไม่พึ่งไลบรารีภายนอก (โหมด byte, ระดับแก้ไขข้อผิดพลาด M, เวอร์ชัน 1-6)
// รองรับข้อความ UTF-8 ได้สูงสุด 106 ไบต์ — พอสำหรับรหัสตั๋ว (ราว 12-30 ตัวอักษร)
// เขียนตามสเปก ISO/IEC 18004 และตรวจแล้วว่าตัวอ่าน QR ทั่วไปอ่านได้

// [จำนวน codeword ทั้งหมด, ec codeword ต่อบล็อก, จำนวนบล็อก] ของระดับ M
const VERSION_TABLE = {
  1: [26, 10, 1],
  2: [44, 16, 1],
  3: [70, 26, 1],
  4: [100, 18, 2],
  5: [134, 24, 2],
  6: [172, 16, 4],
}
const ALIGNMENT_POS = { 1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30], 6: [6, 34] }

function gfMul(x, y) {
  let z = 0
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d)
    z ^= ((y >>> i) & 1) * x
  }
  return z
}

function rsDivisor(degree) {
  const result = new Array(degree).fill(0)
  result[degree - 1] = 1
  let root = 1
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < degree; j++) {
      result[j] = gfMul(result[j], root)
      if (j + 1 < degree) result[j] ^= result[j + 1]
    }
    root = gfMul(root, 0x02)
  }
  return result
}

function rsRemainder(data, divisor) {
  const result = new Array(divisor.length).fill(0)
  for (const b of data) {
    const factor = b ^ result.shift()
    result.push(0)
    divisor.forEach((coef, i) => { result[i] ^= gfMul(coef, factor) })
  }
  return result
}

function utf8Bytes(text) {
  return Array.from(new TextEncoder().encode(text))
}

function getBit(x, i) {
  return ((x >>> i) & 1) !== 0
}

function pickVersion(byteLength) {
  for (let v = 1; v <= 6; v++) {
    const [total, ecPer, blocks] = VERSION_TABLE[v]
    const dataCw = total - ecPer * blocks
    // 4 bit โหมด + 8 bit ความยาว + ข้อมูล
    if (4 + 8 + byteLength * 8 <= dataCw * 8) return v
  }
  throw new Error('ข้อความยาวเกินกว่าที่ QR ของระบบรองรับ (สูงสุด 106 ไบต์)')
}

function buildDataCodewords(bytes, dataCw) {
  const bits = []
  const push = (val, len) => { for (let i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1) }
  push(0b0100, 4) // โหมด byte
  push(bytes.length, 8)
  bytes.forEach((b) => push(b, 8))
  const capacity = dataCw * 8
  push(0, Math.min(4, capacity - bits.length)) // terminator
  while (bits.length % 8 !== 0) bits.push(0)
  const codewords = []
  for (let i = 0; i < bits.length; i += 8) {
    let v = 0
    for (let j = 0; j < 8; j++) v = (v << 1) | bits[i + j]
    codewords.push(v)
  }
  for (let pad = 0xec; codewords.length < dataCw; pad ^= 0xec ^ 0x11) codewords.push(pad)
  return codewords
}

function addEccAndInterleave(data, version) {
  const [total, ecPer, blocks] = VERSION_TABLE[version]
  const dataPerBlock = (total - ecPer * blocks) / blocks
  const divisor = rsDivisor(ecPer)
  const dataBlocks = []
  const eccBlocks = []
  for (let b = 0; b < blocks; b++) {
    const chunk = data.slice(b * dataPerBlock, (b + 1) * dataPerBlock)
    dataBlocks.push(chunk)
    eccBlocks.push(rsRemainder(chunk, divisor))
  }
  const out = []
  for (let i = 0; i < dataPerBlock; i++) dataBlocks.forEach((blk) => out.push(blk[i]))
  for (let i = 0; i < ecPer; i++) eccBlocks.forEach((blk) => out.push(blk[i]))
  return out
}

function newMatrix(size, fill) {
  return Array.from({ length: size }, () => new Array(size).fill(fill))
}

function drawFunctionPatterns(modules, isFunction, size, version) {
  const set = (x, y, dark) => {
    modules[y][x] = dark
    isFunction[y][x] = true
  }
  // timing
  for (let i = 0; i < size; i++) {
    set(6, i, i % 2 === 0)
    set(i, 6, i % 2 === 0)
  }
  // finder + separator
  const finder = (cx, cy) => {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const dist = Math.max(Math.abs(dx), Math.abs(dy))
        const x = cx + dx
        const y = cy + dy
        if (x >= 0 && x < size && y >= 0 && y < size) set(x, y, dist !== 2 && dist !== 4)
      }
    }
  }
  finder(3, 3)
  finder(size - 4, 3)
  finder(3, size - 4)
  // alignment
  const pos = ALIGNMENT_POS[version]
  for (let i = 0; i < pos.length; i++) {
    for (let j = 0; j < pos.length; j++) {
      const overlapsFinder = (i === 0 && j === 0) || (i === 0 && j === pos.length - 1) || (i === pos.length - 1 && j === 0)
      if (overlapsFinder) continue
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) set(pos[i] + dx, pos[j] + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1)
      }
    }
  }
  drawFormatBits(modules, isFunction, size, 0)
}

// ระดับ M = 0b00
function drawFormatBits(modules, isFunction, size, mask) {
  const set = (x, y, dark) => {
    modules[y][x] = dark
    isFunction[y][x] = true
  }
  const data = (0 << 3) | mask
  let rem = data
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537)
  const bits = ((data << 10) | rem) ^ 0x5412

  for (let i = 0; i <= 5; i++) set(8, i, getBit(bits, i))
  set(8, 7, getBit(bits, 6))
  set(8, 8, getBit(bits, 7))
  set(7, 8, getBit(bits, 8))
  for (let i = 9; i < 15; i++) set(14 - i, 8, getBit(bits, i))

  for (let i = 0; i < 8; i++) set(size - 1 - i, 8, getBit(bits, i))
  for (let i = 8; i < 15; i++) set(8, size - 15 + i, getBit(bits, i))
  set(8, size - 8, true) // dark module
}

function drawCodewords(modules, isFunction, size, data) {
  let i = 0
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5
    for (let vert = 0; vert < size; vert++) {
      for (let j = 0; j < 2; j++) {
        const x = right - j
        const upward = ((right + 1) & 2) === 0
        const y = upward ? size - 1 - vert : vert
        if (!isFunction[y][x]) {
          // bit ที่เหลือหลังข้อมูลหมด (remainder bits) เป็น 0
          modules[y][x] = i < data.length * 8 ? getBit(data[i >>> 3], 7 - (i & 7)) : false
          i++
        }
      }
    }
  }
}

function maskApplies(mask, x, y) {
  switch (mask) {
    case 0: return (x + y) % 2 === 0
    case 1: return y % 2 === 0
    case 2: return x % 3 === 0
    case 3: return (x + y) % 3 === 0
    case 4: return (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0
    case 5: return ((x * y) % 2) + ((x * y) % 3) === 0
    case 6: return ((((x * y) % 2) + ((x * y) % 3)) % 2) === 0
    default: return ((((x + y) % 2) + ((x * y) % 3)) % 2) === 0
  }
}

function applyMask(modules, isFunction, size, mask) {
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!isFunction[y][x] && maskApplies(mask, x, y)) modules[y][x] = !modules[y][x]
    }
  }
}

// คะแนนปรับ (ยิ่งต่ำยิ่งดี) — ตามกฎ 4 ข้อของสเปก ใช้เลือก mask ที่อ่านง่ายที่สุด
function penaltyScore(modules, size) {
  let score = 0
  const lines = []
  for (let y = 0; y < size; y++) lines.push(modules[y])
  for (let x = 0; x < size; x++) lines.push(modules.map((row) => row[x]))

  for (const line of lines) {
    let run = 1
    for (let i = 1; i <= size; i++) {
      if (i < size && line[i] === line[i - 1]) run++
      else {
        if (run >= 5) score += 3 + (run - 5)
        run = 1
      }
    }
    // รูปแบบคล้าย finder 1011101 มีช่องว่าง 4 ช่องข้างใดข้างหนึ่ง
    for (let i = 0; i + 11 <= size; i++) {
      const w = line.slice(i, i + 11).map((b) => (b ? 1 : 0)).join('')
      if (w === '10111010000' || w === '00001011101') score += 40
    }
  }
  for (let y = 0; y < size - 1; y++) {
    for (let x = 0; x < size - 1; x++) {
      const c = modules[y][x]
      if (c === modules[y][x + 1] && c === modules[y + 1][x] && c === modules[y + 1][x + 1]) score += 3
    }
  }
  let dark = 0
  modules.forEach((row) => row.forEach((c) => { if (c) dark++ }))
  const percent = (dark * 100) / (size * size)
  score += Math.floor(Math.abs(percent - 50) / 5) * 10
  return score
}

/**
 * สร้างเมทริกซ์ QR จากข้อความ — คืน array 2 มิติของ boolean (true = ช่องดำ) ไม่รวม quiet zone
 */
export function generateQr(text) {
  const bytes = utf8Bytes(text)
  const version = pickVersion(bytes.length)
  const size = 17 + 4 * version
  const [total, ecPer, blocks] = VERSION_TABLE[version]
  const dataCw = total - ecPer * blocks

  const codewords = addEccAndInterleave(buildDataCodewords(bytes, dataCw), version)

  const base = newMatrix(size, false)
  const isFunction = newMatrix(size, false)
  drawFunctionPatterns(base, isFunction, size, version)
  drawCodewords(base, isFunction, size, codewords)

  let best = null
  let bestScore = Infinity
  for (let mask = 0; mask < 8; mask++) {
    const candidate = base.map((row) => row.slice())
    applyMask(candidate, isFunction, size, mask)
    drawFormatBits(candidate, isFunction, size, mask)
    const score = penaltyScore(candidate, size)
    if (score < bestScore) {
      bestScore = score
      best = candidate
    }
  }
  return best
}
