import { useState } from 'react'
import { parseRule } from '../services/gemini.js'

const S = {
  textarea: {
    width: '100%',
    minHeight: 72,
    resize: 'vertical',
    border: '1px solid #CECECE',
    borderRadius: 4,
    padding: '0.6rem 0.75rem',
    fontSize: 13,
    fontFamily: 'Arial, sans-serif',
    color: '#131A48',
    boxSizing: 'border-box',
    outline: 'none',
  },
  btn: {
    background: '#FF5800', color: '#fff', border: 'none', borderRadius: 4,
    padding: '0.55rem 1.5rem', fontSize: 13, fontWeight: 700, cursor: 'pointer',
    letterSpacing: '0.04em', textTransform: 'uppercase', marginTop: '0.6rem',
  },
  btnDisabled: {
    background: '#CECECE', color: '#fff', border: 'none', borderRadius: 4,
    padding: '0.55rem 1.5rem', fontSize: 13, fontWeight: 700, cursor: 'not-allowed',
    letterSpacing: '0.04em', textTransform: 'uppercase', marginTop: '0.6rem',
  },
  error: {
    marginTop: '0.5rem', fontSize: 12, color: '#c0392b',
    background: '#fce8e8', border: '1px solid #e57373',
    borderRadius: 4, padding: '0.4rem 0.7rem',
  },
}

export default function RuleInput({ onParsed }) {
  const [text, setText]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState(null)

  async function handleParse() {
    if (!text.trim()) return
    setLoading(true)
    setError(null)
    try {
      const rule = await parseRule(text.trim())
      onParsed(rule)
      setText('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <textarea
        style={S.textarea}
        placeholder='e.g. "20% off for Natura Casa brand, stackable" or "10% off if cart is above Rs.5000"'
        value={text}
        onChange={(e) => { setText(e.target.value); setError(null) }}
        disabled={loading}
      />
      <div>
        <button
          style={loading || !text.trim() ? S.btnDisabled : S.btn}
          onClick={handleParse}
          disabled={loading || !text.trim()}
        >
          {loading ? 'Parsing…' : 'Parse Rule'}
        </button>
      </div>
      {error && <div style={S.error}>{error}</div>}
    </div>
  )
}
