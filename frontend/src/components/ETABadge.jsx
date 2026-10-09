import './ETABadge.css'

export default function ETABadge({ mins, status }) {
  const tone = status === 'delayed' ? 'amber' : status === 'last' ? 'red' : 'green'
  return (
    <div className={`eta-badge eta-badge--${tone}`}>
      <span className="eta-badge__value">{mins}</span>
      <span className="eta-badge__unit">นาที</span>
    </div>
  )
}
