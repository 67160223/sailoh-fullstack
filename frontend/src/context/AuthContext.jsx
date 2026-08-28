import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { apiFetch, ApiFetchError } from '../lib/api'

const AuthContext = createContext(null)
const STORAGE_KEY = 'auth'

function loadStored() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : { accessToken: null, refreshToken: null, user: null }
  } catch {
    return { accessToken: null, refreshToken: null, user: null }
  }
}

// เก็บ token คู่ + user ไว้ใน localStorage เพื่อให้ยัง login อยู่หลังปิด-เปิดเบราว์เซอร์ใหม่
export function AuthProvider({ children }) {
  const [state, setState] = useState(loadStored)
  const refreshingRef = useRef(null) // กัน refresh ซ้อนกันหลาย request พร้อมกัน

  const persist = useCallback((next) => {
    setState(next)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }, [])

  const clear = useCallback(() => {
    persist({ accessToken: null, refreshToken: null, user: null })
  }, [persist])

  const login = useCallback(
    async (username, password) => {
      const data = await apiFetch('/auth/login', { method: 'POST', body: { username, password } })
      persist({ accessToken: data.accessToken, refreshToken: data.refreshToken, user: data.user })
      return data.user
    },
    [persist]
  )

  const register = useCallback(
    async (payload) => {
      await apiFetch('/auth/register', { method: 'POST', body: payload })
      // สมัครสำเร็จแล้ว login ต่อให้เลย ผู้ใช้ไม่ต้องพิมพ์รหัสผ่านซ้ำ
      return login(payload.username, payload.password)
    },
    [login]
  )

  const logout = useCallback(async () => {
    try {
      if (state.refreshToken) {
        await apiFetch('/auth/logout', { method: 'POST', body: { refreshToken: state.refreshToken } })
      }
    } catch {
      // ถึง logout ฝั่ง server ไม่สำเร็จ (เช่น token หมดอายุไปแล้ว) ก็เคลียร์ฝั่ง client ต่อได้เลย
    }
    clear()
  }, [state.refreshToken, clear])

  const refreshTokens = useCallback(async () => {
    if (!state.refreshToken) throw new Error('ไม่มี refresh token')
    if (!refreshingRef.current) {
      refreshingRef.current = apiFetch('/auth/refresh', { method: 'POST', body: { refreshToken: state.refreshToken } })
        .then((data) => {
          const next = { ...state, accessToken: data.accessToken, refreshToken: data.refreshToken }
          persist(next)
          return next.accessToken
        })
        .finally(() => {
          refreshingRef.current = null
        })
    }
    return refreshingRef.current
  }, [state, persist])

  // ทุก request ที่ต้อง login ให้เรียกผ่านตัวนี้ — ใส่ access token ให้อัตโนมัติ
  // และถ้าเจอ 401 (token หมดอายุ) จะขอ token ใหม่แล้ว retry ให้ 1 ครั้งโดยผู้ใช้ไม่ต้องรู้ตัว
  const authFetch = useCallback(
    async (path, options = {}) => {
      try {
        return await apiFetch(path, { ...options, token: state.accessToken })
      } catch (err) {
        if (err instanceof ApiFetchError && err.status === 401 && state.refreshToken) {
          try {
            const newToken = await refreshTokens()
            return await apiFetch(path, { ...options, token: newToken })
          } catch {
            clear()
            throw err
          }
        }
        throw err
      }
    },
    [state, refreshTokens, clear]
  )

  const changePassword = useCallback(
    async (currentPassword, newPassword) => {
      await authFetch('/auth/change-password', { method: 'POST', body: { currentPassword, newPassword } })
      // backend เพิกถอน refresh token เดิมทั้งหมดตอนเปลี่ยนรหัสผ่าน — ต้อง login ใหม่เสมอ
      clear()
    },
    [authFetch, clear]
  )

  // ใช้หลังแก้ไขโปรไฟล์สำเร็จ — อัปเดต user ใน context/localStorage โดยไม่ต้อง login ใหม่
  const updateStoredUser = useCallback(
    (patch) => {
      persist({ ...state, user: { ...state.user, ...patch } })
    },
    [state, persist]
  )

  const value = {
    user: state.user,
    isAuthenticated: !!state.accessToken,
    login,
    register,
    logout,
    changePassword,
    updateStoredUser,
    authFetch,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth ต้องถูกเรียกภายใต้ <AuthProvider>')
  return ctx
}
