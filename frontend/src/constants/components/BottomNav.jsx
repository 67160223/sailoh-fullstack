import { NavLink } from 'react-router-dom'
import './BottomNav.css'

const ITEMS = [
  { to: '/', label: 'ค้นหา', icon: '🔍', end: true },
  { to: '/saved', label: 'สายที่บันทึก', icon: '📌' },
]

export default function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="เมนูหลัก">
      {ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) => `bottom-nav__item${isActive ? ' bottom-nav__item--active' : ''}`}
        >
          <span aria-hidden>{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
