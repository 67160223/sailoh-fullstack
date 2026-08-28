import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { useAuth } from './AuthContext'

const FavoritesContext = createContext(null)

export function FavoritesProvider({ children }) {
  const { authFetch, isAuthenticated } = useAuth()
  const [favorites, setFavorites] = useState([])
  const [loaded, setLoaded] = useState(false)

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setFavorites([])
      setLoaded(true)
      return
    }
    try {
      const routes = await authFetch('/favorites')
      setFavorites(routes || [])
    } finally {
      setLoaded(true)
    }
  }, [authFetch, isAuthenticated])

  useEffect(() => {
    refresh()
  }, [refresh])

  const isFavorite = useCallback((routeId) => favorites.some((r) => r.id === routeId), [favorites])

  const toggleFavorite = useCallback(
    async (route) => {
      if (isFavorite(route.id)) {
        await authFetch(`/favorites/${route.id}`, { method: 'DELETE' })
        setFavorites((prev) => prev.filter((r) => r.id !== route.id))
      } else {
        await authFetch(`/favorites/${route.id}`, { method: 'POST' })
        setFavorites((prev) => [route, ...prev])
      }
    },
    [authFetch, isFavorite]
  )

  return (
    <FavoritesContext.Provider value={{ favorites, loaded, isFavorite, toggleFavorite }}>
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext)
  if (!ctx) throw new Error('useFavorites ต้องถูกเรียกภายใต้ <FavoritesProvider>')
  return ctx
}
