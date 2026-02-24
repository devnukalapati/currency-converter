import { useState, useEffect, useRef, useCallback } from 'react'
import { API_BASE, FLAGS } from './constants'
import Ticker from './components/Ticker'

function formatAmount(n, currency) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 6,
      minimumFractionDigits: 2,
    }).format(n)
  } catch {
    return `${n} ${currency}`
  }
}

export default function App() {
  const [currencies, setCurrencies] = useState({})
  const [amount, setAmount] = useState('1')
  const [from, setFrom] = useState('USD')
  const [to, setTo] = useState('EUR')
  const [converted, setConverted] = useState('—')
  const [rateLabel, setRateLabel] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [swapRotated, setSwapRotated] = useState(false)

  const abortRef = useRef(null)
  const debounceRef = useRef(null)
  const amountRef = useRef(amount)
  const fromRef = useRef(from)
  const toRef = useRef(to)

  // Keep refs current on every render so the stable fetchRate can read latest values
  amountRef.current = amount
  fromRef.current = from
  toRef.current = to

  const fetchRate = useCallback(async () => {
    const raw = amountRef.current.trim()
    const n = parseFloat(raw)
    const fromVal = fromRef.current
    const toVal = toRef.current

    if (raw === '' || isNaN(n) || n === 0) {
      setConverted('—')
      setRateLabel('')
      setLoading(false)
      return
    }

    if (fromVal === toVal) {
      setConverted(formatAmount(n, toVal))
      setRateLabel(`1 ${fromVal} = 1.00 ${toVal}`)
      setLoading(false)
      return
    }

    if (abortRef.current) abortRef.current.abort()
    abortRef.current = new AbortController()
    const { signal } = abortRef.current

    setLoading(true)
    setError(null)

    try {
      const [res, unitRes] = await Promise.all([
        fetch(`${API_BASE}/latest?amount=${n}&from=${fromVal}&to=${toVal}`, { signal }),
        fetch(`${API_BASE}/latest?amount=1&from=${fromVal}&to=${toVal}`, { signal }),
      ])

      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      if (!unitRes.ok) throw new Error(`HTTP ${unitRes.status}`)

      const [data, unitData] = await Promise.all([res.json(), unitRes.json()])

      setConverted(formatAmount(data.rates[toVal], toVal))
      setRateLabel(`1 ${fromVal} = ${unitData.rates[toVal].toFixed(4)} ${toVal}`)
    } catch (err) {
      if (err.name === 'AbortError') return
      setConverted('—')
      setRateLabel('')
      setError('Could not fetch exchange rate. Please try again.')
      console.error('fetchRate:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Mount: load currency list
  useEffect(() => {
    async function loadCurrencies() {
      try {
        const res = await fetch(`${API_BASE}/currencies`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        setCurrencies(data)
      } catch (err) {
        setLoading(false)
        setError('Could not load currencies. Check your connection and refresh.')
        console.error('loadCurrencies:', err)
      }
    }
    loadCurrencies()
  }, [])

  // Fetch rate whenever currencies are loaded or either dropdown changes
  useEffect(() => {
    if (Object.keys(currencies).length === 0) return
    fetchRate()
  }, [currencies, from, to, fetchRate])

  function handleAmountChange(e) {
    setAmount(e.target.value)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(fetchRate, 300)
  }

  function handleSwap() {
    setFrom(to)
    setTo(from)
    setSwapRotated(r => !r)
  }

  const currencyEntries = Object.entries(currencies).sort((a, b) => a[0].localeCompare(b[0]))

  return (
    <>
      <Ticker />

      <div
        className={`spinner-overlay${loading ? '' : ' hidden'}`}
        aria-live="polite"
        aria-label="Loading"
      >
        <div className="spinner"></div>
      </div>

      {error && (
        <div className="error-banner" role="alert">
          <span>{error}</span>
          <button
            className="error-close"
            onClick={() => setError(null)}
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      <main className="card" role="main">
        <h1 className="card__title">Currency Converter</h1>

        <div className="field">
          <label className="field__label" htmlFor="amount">Amount</label>
          <input
            className="field__input"
            id="amount"
            type="number"
            min="0"
            step="any"
            placeholder="1"
            autoComplete="off"
            inputMode="decimal"
            value={amount}
            onChange={handleAmountChange}
          />
        </div>

        <div className="selectors">
          <div className="field field--select">
            <label className="field__label" htmlFor="fromCurrency">From</label>
            <div className="select-wrapper">
              <select
                className="field__select"
                id="fromCurrency"
                value={from}
                onChange={e => setFrom(e.target.value)}
              >
                {currencyEntries.map(([code, name]) => (
                  <option key={code} value={code}>{FLAGS[code] ?? '🏳'} {code} — {name}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            className={`swap-btn${swapRotated ? ' rotated' : ''}`}
            onClick={handleSwap}
            aria-label="Swap currencies"
            title="Swap"
          >
            ⇄
          </button>

          <div className="field field--select">
            <label className="field__label" htmlFor="toCurrency">To</label>
            <div className="select-wrapper">
              <select
                className="field__select"
                id="toCurrency"
                value={to}
                onChange={e => setTo(e.target.value)}
              >
                {currencyEntries.map(([code, name]) => (
                  <option key={code} value={code}>{FLAGS[code] ?? '🏳'} {code} — {name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="result-area">
          <output className="result__value" htmlFor="amount fromCurrency toCurrency">
            {converted}
          </output>
          <p className="result__rate">{rateLabel}</p>
        </div>

        <p className="attribution">
          Rates via{' '}
          <a href="https://www.frankfurter.app" target="_blank" rel="noopener">
            Frankfurter.app
          </a>
          {' '}· European Central Bank data · Updated daily
        </p>
      </main>
    </>
  )
}
