const S = {
  box: {
    border: '1px solid #CECECE',
    borderRadius: 4,
    padding: '0.8rem 1rem',
    background: '#f9f9fb',
    marginTop: '0.75rem',
    fontSize: 13,
    color: '#131A48',
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '3px 0',
    borderBottom: '1px solid #f0f0f0',
  },
  label: { color: '#888', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' },
  value: { fontWeight: 600 },
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
}

function Row({ label, value }) {
  return (
    <div style={S.row}>
      <span style={S.label}>{label}</span>
      <span style={S.value}>{value}</span>
    </div>
  )
}

export default function RulePreview({ rule, onConfirm, onCancel }) {
  return (
    <div style={S.box}>
      <Row label="Scope"     value={rule.scope.charAt(0).toUpperCase() + rule.scope.slice(1)} />
      {rule.scope !== 'cart' && <Row label="Applies To" value={rule.appliesTo} />}
      <Row label="Type"      value={rule.type.charAt(0).toUpperCase() + rule.type.slice(1)} />
      <Row label="Value"     value={rule.type === 'percentage' ? `${rule.value}% off` : `Rs.${rule.value} off`} />
      <Row label="Stackable" value={rule.stackable ? 'Yes' : 'No'} />
      {rule.scope === 'cart' && (
        <Row label="Min Cart Value" value={`Rs.${rule.minCartValue.toLocaleString('en-IN')}`} />
      )}
      <div style={S.actions}>
        <button style={S.confirm} onClick={onConfirm}>Confirm</button>
        <button style={S.cancel}  onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}
