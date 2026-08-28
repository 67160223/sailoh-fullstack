import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import RoutePlate from './RoutePlate'
import './SearchBar.css'

// Auto-suggest ระหว่างพิมพ์ — เรียก GET /routes/search?q= จริงจาก bus-tracking-api
// debounce 300ms กันยิง request ทุกตัวอักษรที่พิมพ์
export default function SearchBar({ onPick, autoFocus }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const inputRef = useRef(null)
  const debounceRef = useRef(null)
  const navigate = useNavigate()
  const { authFetch } = useAuth()

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }
    setLoading(true)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const items = await authFetch(`/routes/search?q=${encodeURIComponent(query.trim())}`)
        setResults(items || [])
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => clearTimeout(debounceRef.current)
  }, [query, authFetch])

  function pick(route) {
    setQuery('')
    setOpen(false)
    if (onPick) onPick(route)
    navigate(`/route/${route.id}`)
  }

  return (
    <div className="search-bar">
      <div className="search-bar__field">
        <span className="search-bar__icon" aria-hidden>🚌</span>
        <input
          ref={inputRef}
          autoFocus={autoFocus}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder="พิมพ์เลขสาย เช่น 140 หรือปลายทาง"
          aria-label="ค้นหาสายรถเมล์"
        />
        {query && (
          <button
            className="search-bar__clear"
            aria-label="ล้างคำค้นหา"
            onClick={() => { setQuery(''); inputRef.current?.focus() }}
          >
            ✕
          </button>
        )}
      </div>

      {open && query && (
        <ul className="search-bar__suggestions">
          {loading && <li className="search-bar__empty">กำลังค้นหา...</li>}
          {!loading && results.length === 0 && (
            <li className="search-bar__empty">ไม่พบสาย "{query}" — ลองพิมพ์แค่เลขสาย</li>
          )}
          {!loading && results.map((r) => (
            <li key={r.id}>
              <button className="search-bar__suggestion" onClick={() => pick(r)}>
                <RoutePlate route={r} size="sm" />
                <div className="search-bar__suggestion-text">
                  <strong>สาย {r.number}</strong>
                  <span>{r.name}</span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
