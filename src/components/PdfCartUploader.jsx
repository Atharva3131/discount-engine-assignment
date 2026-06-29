import { useRef, useState } from 'react'
import { parseCartPDF } from '../services/pdfParser.js'

const S = {
  btn: {
    background: '#131A48', color: '#fff', border: 'none', borderRadius: 4,
    padding: '0.45rem 1rem', fontSize: 11, fontWeight: 700, cursor: 'pointer',
    letterSpacing: '0.04em', textTransform: 'uppercase', marginTop: '0.5rem',
    display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
  },
  btnDisabled: {
    background: '#CECECE', color: '#fff', border: 'none', borderRadius: 4,
    padding: '0.45rem 1rem', fontSize: 11, fontWeight: 700, cursor: 'not-allowed',
    letterSpacing: '0.04em', textTransform: 'uppercase', marginTop: '0.5rem',
    display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
  },
  error: {
    marginTop: '0.5rem', fontSize: 12, color: '#c0392b',
    background: '#fce8e8', border: '1px solid #e57373',
    borderRadius: 4, padding: '0.4rem 0.7rem',
  },
  hint: {
    fontSize: 11, color: '#888', marginTop: '0.4rem',
  },
}

export default function PdfCartUploader({ onCartLoaded, disabled }) {
  const inputRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    e.target.value = ''
    setError(null)
    setLoading(true)
    try {
      const result = await parseCartPDF(file)
      if (!result.success) {
        setError(result.error)
      } else {
        onCartLoaded(result)
      }
    } catch (err) {
      setError(`Unexpected error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        style={{ display: 'none' }}
        onChange={handleFile}
      />
      <button
        style={loading || disabled ? S.btnDisabled : S.btn}
        onClick={() => !loading && !disabled && inputRef.current?.click()}
        disabled={loading || disabled}
      >
        {loading ? 'Reading PDF…' : '📄 Upload cart.pdf'}
      </button>
      <div style={S.hint}>Or upload a PDF order receipt instead of a CSV</div>
      {error && <div style={S.error}>{error}</div>}
    </div>
  )
}
