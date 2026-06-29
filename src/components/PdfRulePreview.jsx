const S = {
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 12, marginTop: '0.75rem' },
  th: {
    background: '#131A48', color: '#fff', padding: '7px 10px',
    textAlign: 'left', fontWeight: 700, fontSize: 11,
    textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap',
  },
  td: { padding: '6px 10px', color: '#131A48', borderBottom: '1px solid #f0f0f0' },
  actions: { display: 'flex', gap: '0.6rem', marginTop: '0.75rem' },
  confirm: {
    background: '#131A48', color: '#fff', border: 'none', borderRadius: 4,
    padding: '0.5rem 1.4rem', fontSize: 13, fontWeight: 700, cursor: 'pointer',
    letterSpacing: '0.04em', textTransform: 'uppercase',
  },
  cancel: {
    background: '#fff', color: '#131A48', border: '1px solid #CECECE', borderRadius: 4,
    padding: '0.5rem 1.4rem', fontSize: 13, fontWeight: 700, cursor: 'pointer',
    letterSpacing: '0.04em', textTransform: 'uppercase',
  },
  warn: {
    fontSize: 12, color: '#7a5c00', background: '#fffbe6',
    border: '1px solid #ffe066', borderRadius: 4,
    padding: '0.4rem 0.7rem', marginBottom: '0.5rem',
  },
  parseErr: {
    fontSize: 12, color: '#c0392b', background: '#fce8e8',
    border: '1px solid #e57373', borderRadius: 4,
    padding: '0.4rem 0.7rem', marginBottom: '0.5rem',
  },
}

export default function PdfRulePreview({ result, onConfirm, onCancel }) {
  const { rules, duplicateCount, parseErrors } = result

  return (
    <div style={{ marginTop: '0.75rem' }}>
      {duplicateCount > 0 && (
        <div style={S.warn}>
          {duplicateCount} duplicate rule{duplicateCount > 1 ? 's were' : ' was'} skipped.
        </div>
      )}
      {parseErrors?.length > 0 && (
        <div style={S.parseErr}>
          {parseErrors.length} line{parseErrors.length > 1 ? 's' : ''} could not be parsed and were skipped.
        </div>
      )}
      <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>
        {rules.length} rule{rules.length > 1 ? 's' : ''} ready to add
      </div>
      <div style={{ overflowX: 'auto', border: '1px solid #CECECE', borderRadius: 4 }}>
        <table style={S.table}>
          <thead>
            <tr>
              {['#', 'Scope', 'Applies To', 'Type', 'Value', 'Stackable', 'Min Cart Value'].map((h) => (
                <th key={h} style={S.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rules.map((rule, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                <td style={S.td}>{i + 1}</td>
                <td style={S.td}>{rule.scope.charAt(0).toUpperCase() + rule.scope.slice(1)}</td>
                <td style={S.td}>{rule.appliesTo || '—'}</td>
                <td style={S.td}>{rule.type.charAt(0).toUpperCase() + rule.type.slice(1)}</td>
                <td style={S.td}>{rule.type === 'percentage' ? `${rule.value}% off` : `Rs.${rule.value} off`}</td>
                <td style={S.td}>{rule.stackable ? 'Yes' : 'No'}</td>
                <td style={S.td}>{rule.minCartValue ? `Rs.${rule.minCartValue.toLocaleString('en-IN')}` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={S.actions}>
        <button style={S.confirm} onClick={onConfirm}>Confirm All</button>
        <button style={S.cancel} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}
