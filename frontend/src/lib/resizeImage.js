// ย่อรูปฝั่ง browser ก่อนส่งขึ้น backend เสมอ — เก็บเป็น data URL ตรง ๆ ในฐานข้อมูล
// (โปรเจกต์นี้ไม่มีระบบไฟล์สตอเรจแยก เช่น S3 จึงย่อให้เล็กที่สุดเท่าที่ยังพอดูออกก่อนอัปโหลด)
export function resizeImageToDataUrl(file, { size = 256, quality = 0.85 } = {}) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('อ่านไฟล์รูปไม่สำเร็จ'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('ไฟล์นี้ไม่ใช่รูปภาพที่ใช้ได้'))
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size

        // center-crop เป็นสี่เหลี่ยมจัตุรัสก่อน แล้วค่อยย่อ ไม่ให้รูปบิดเบี้ยว
        const minSide = Math.min(img.width, img.height)
        const sx = (img.width - minSide) / 2
        const sy = (img.height - minSide) / 2

        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size)

        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}
