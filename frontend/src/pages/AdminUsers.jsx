import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Admin.css'

const ROLE_LABEL = { ADMIN: 'แอดมิน', USER: 'ผู้ใช้ทั่วไป' }
const PAGE_SIZE = 10

// หน้า Admin Dashboard — ดึงรายชื่อผู้ใช้ทั้งหมดแบบแบ่งหน้า (ทีละ 10 คน) ไม่ให้หน้าเว็บโหลดช้า
export default function AdminUsers() {
  const { authFetch, user: currentUser } = useAuth()

  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [users, setUsers] = useState([])
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState(null)

  // debounce ช่องค้นหา — รอผู้ใช้พิมพ์นิ่งก่อนค่อยยิง request กันสแปม request ทุกตัวอักษร
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, 350)
    return () => clearTimeout(t)
  }, [searchInput])

  useEffect(() => {
    let ignore = false
    setLoading(true)
    setError('')

    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) })
    if (search) params.set('search', search)

    authFetch(`/users?${params.toString()}`)
      .then((res) => {
        if (ignore) return
        setUsers(res.items)
        setMeta(res.meta)
      })
      .catch((err) => { if (!ignore) setError(err.message) })
      .finally(() => { if (!ignore) setLoading(false) })

    return () => { ignore = true }
  }, [authFetch, page, search])

  async function handleDelete(u) {
    if (!window.confirm(`ลบผู้ใช้ "${u.username}" ออกจากระบบ? การกระทำนี้ย้อนกลับไม่ได้`)) return

    setDeletingId(u.id)
    try {
      await authFetch(`/users/${u.id}`, { method: 'DELETE' })
      setUsers((prev) => prev.filter((x) => x.id !== u.id))
      setMeta((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }))
    } catch (err) {
      alert(err.message || 'ลบไม่สำเร็จ')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="page admin">
      <header className="admin__header">
        <p className="eyebrow">Admin Dashboard</p>
        <h1>จัดการผู้ใช้งาน</h1>
        <p className="admin__sub">ทั้งหมด {meta.total} คน</p>
      </header>

      <input
        className="admin__search"
        placeholder="ค้นหาด้วย username หรืออีเมล..."
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
      />

      {error && <p className="empty-state">โหลดไม่สำเร็จ: {error}</p>}
      {!error && loading && <p className="empty-state">กำลังโหลด...</p>}
      {!error && !loading && users.length === 0 && <p className="empty-state">ไม่พบผู้ใช้ที่ตรงกับคำค้นหา</p>}

      {!loading && users.length > 0 && (
        <div className="admin__table-wrap">
          <table className="admin__table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>อีเมล</th>
                <th>บทบาท</th>
                <th aria-label="การจัดการ" />
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>
                    {u.displayName || u.username}
                    {u.id === currentUser?.id && <span className="admin__you-tag">คุณ</span>}
                  </td>
                  <td className="admin__email-cell">{u.email}</td>
                  <td>
                    <span className={`admin__role-badge admin__role-badge--${u.role.toLowerCase()}`}>
                      {ROLE_LABEL[u.role] || u.role}
                    </span>
                  </td>
                  <td className="admin__actions-cell">
                    <Link to={`/admin/users/${u.id}`} className="admin__action-link">ดูรายละเอียด</Link>
                    <button
                      className="admin__delete-btn"
                      onClick={() => handleDelete(u)}
                      disabled={deletingId === u.id}
                      title="ลบผู้ใช้นี้"
                      aria-label={`ลบ ${u.username}`}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {meta.totalPages > 1 && (
        <div className="admin__pagination">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← ก่อนหน้า</button>
          <span>หน้า {meta.page} จาก {meta.totalPages}</span>
          <button disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)}>ถัดไป →</button>
        </div>
      )}
    </div>
  )
}
