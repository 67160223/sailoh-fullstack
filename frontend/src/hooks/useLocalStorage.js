import { useState, useEffect } from 'react'

// เก็บ "สายที่เพิ่งดู" และ "สายที่บันทึกไว้" ไว้ในเครื่อง — ไม่ต้องพิมพ์เลขสายซ้ำทุกครั้ง
// ตอบโจทย์ opportunity: ใช้ Local Storage จำสายรถเมล์ล่าสุด
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = window.localStorage.getItem(key)
      return stored ? JSON.parse(stored) : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // เก็บไม่ได้ก็ไม่เป็นไร — แอปยังใช้งานได้ปกติ แค่ไม่จำ
    }
  }, [key, value])

  return [value, setValue]
}
