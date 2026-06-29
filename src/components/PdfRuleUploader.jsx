import { useRef, useState } from 'react'
import { parsePDF } from '../services/pdfParser.js'

const S = {
  uploadArea: (hasData) => ({
    border: `2px dashed ${hasData ? '#1e5c2c' : '#CECECE'}`,
    borderRadius: 6,
    padding: '1rem 1.2rem',
    background: hasData ? '#f0faf2' : '#fafafa',
    cursor: 'pointer',
    transition: 'border-color 0.15s',
  }),
  row: { display: 'flex', alignItems: 'center', gap: '0.6rem' },
  label: { fontWeight: 700, fontSize: 13, color: '#131A48' },
  sub: { fontSize: 11, color: '#888', marginTop: 2 },
  action: (hasData) => ({
    marginLeft: 'auto', fontSize: 11, fontWeight: 700,
    color: hasData ? '#1e5c2c' : '#FF5800',
    textTransform: 'uppercase', letterSpacing: '0.05em',
  }),
  error: {
    marginTop: '0.5rem', fontSize: 12, color: '#c0392b',
    background: '#fce8e8', border: '1px solid #e57373',
    borderRadius: 4, padding: '0.4rem 0.7rem',
  },
  warn: {
    marginTop: '0.5rem', fontSize: 12, color: '#7a5c00',
    background: '#fffbe6', border: '1px solid #ffe066',
    borderRadius: 4, padding: '0.4rem 0.7rem',
  },
}

export default function PdfRuleUploader({ onParsed, existingRules }) {
  const inputRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [fileName, setFileName] = useState('')

  async function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    e.target.value = ''
    setFileName(file.name)
    setError(null)
    setLoading(true)
    try {
      const result = await parsePDF(file, existingRules)
      if (!result.success) {
        setError(result.error)
      } else {
        onParsed(result)
      }
    } catch (err) {
      setError(`Unexpected error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const hasData = !!fileName && !error && !loading

  return (
    <div>
      <div style={S.uploadArea(hasData)} onClick={() => !loading && inputRef.current?.click()}>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          style={{ display: 'none' }}
          onChange={handleFile}
        />
        <div style={S.row}>
          <span style={{ fontSize: 20 }}>{loading ? '⏳' : hasData ? '✅' : '📄'}</span>
          <div>
            <div style={S.label}>rules.pdf</div>
            <div style={S.sub}>
              {loading ? 'Extracting rules…' : hasData ? fileName : 'Upload a PDF containing discount rules'}
            </div>
          </div>
          <div style={S.action(hasData)}>
            {loading ? '' : hasData ? 'Change' : 'Upload'}
          </div>
        </div>
      </div>
      {error && <div style={S.error}>{error}</div>}
    </div>
  )
}
