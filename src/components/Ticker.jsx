import { useState, useEffect, useRef } from 'react'
import { API_BASE, FLAGS } from '../constants'

export default function Ticker() {
  const [items, setItems] = useState([])
  const prevRatesRef = useRef(null)

  async function fetchTicker() {
    try {
      const res = await fetch(`${API_BASE}/latest?from=USD`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()

      const entries = Object.entries(data.rates).sort((a, b) => a[0].localeCompare(b[0]))

      const newItems = entries.map(([code, rate]) => {
        const prev = prevRatesRef.current?.[code]
        let dir = null
        if (prev !== undefined) {
          if (rate > prev) dir = 'up'
          else if (rate < prev) dir = 'down'
        }
        const flag = FLAGS[code] ?? '🏳'
        const formatted =
          rate < 0.001 ? rate.toFixed(6) :
          rate < 1000  ? rate.toFixed(4) :
                         rate.toFixed(2)
        return { code, rate, dir, flag, formatted }
      })

      setItems(newItems)
      prevRatesRef.current = data.rates
    } catch (err) {
      console.warn('ticker:', err)
    }
  }

  useEffect(() => {
    fetchTicker()
    const id = setInterval(fetchTicker, 60_000)
    return () => clearInterval(id)
  }, [])

  if (items.length === 0) {
    return (
      <div className="ticker" aria-label="Live exchange rates">
        <span className="ticker__badge">LIVE</span>
        <div className="ticker__mask"></div>
      </div>
    )
  }

  return (
    <div className="ticker" aria-label="Live exchange rates">
      <span className="ticker__badge">LIVE</span>
      <div className="ticker__mask">
        <div
          className="ticker__track"
          style={{ animationDuration: `${items.length * 1.8}s` }}
        >
          {[...items, ...items].map((item, i) => (
            <span key={i} className="ticker__item">
              {item.flag}{' '}
              <span className="ticker__code">{item.code}</span>
              <span className="ticker__rate">{item.formatted}</span>
              {item.dir === 'up' && <span className="ticker__up">▲</span>}
              {item.dir === 'down' && <span className="ticker__down">▼</span>}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
