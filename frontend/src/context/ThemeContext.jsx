import { createContext, useContext, useEffect, useState, useCallback } from 'react'

const ThemeContext = createContext(null)
const STORAGE_KEY = 'theme'

function getInitialTheme() {
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  // ยังไม่เคยตั้งค่าเอง — ใช้ค่าที่ระบบปฏิบัติการ/เบราว์เซอร์ของผู้ใช้ตั้งไว้เป็นค่าเริ่มต้น
  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

// ธีมเป็นแค่การตั้งค่าหน้าตา ไม่ผูกกับบัญชีผู้ใช้ — ใช้ได้ทั้งตอน login และตอนยังเป็น guest
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    window.localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  }, [])

  return <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme ต้องใช้ภายใน ThemeProvider เท่านั้น')
  return ctx
}
