import { useEffect, useRef, useState } from 'react';
import { DISPOSITIONS } from '../data/referenceData';

export function StampLabel({ children }) {
  return (
    <span style={{
      fontFamily: "'Chakra Petch', sans-serif",
      letterSpacing: '0.12em',
      fontSize: '0.7rem',
      fontWeight: 600,
      textTransform: 'uppercase',
      padding: '2px 8px',
      border: '1.5px solid #e4e9ea',
      borderRadius: '2px',
      color: '#e4e9ea',
      background: 'rgba(0,0,0,0.04)',
      whiteSpace: 'nowrap',
    }}>{children}</span>
  );
}

// Displays narrative (flavor/outcome) text with a small pencil affordance that reveals
// an inline textarea for editing. Mechanical/rules text never uses this — it's read-only
// by simply being rendered as plain text elsewhere. Edits write to campaign.narrativeOverrides
// keyed by cardId+field, never mutating the original source data.
export function EditableNarrativeText({ text, onSave, italic = true }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(text);

  useEffect(() => { setDraft(text); }, [text]);

  if (editing) {
    return (
      <div>
        <TextArea value={draft} onChange={setDraft} rows={4} />
        <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem' }}>
          <Button onClick={() => { onSave(draft); setEditing(false); }} style={{ padding: '0.3rem 0.7rem', fontSize: '0.7rem' }}>Save</Button>
          <Button variant="ghost" onClick={() => { setDraft(text); setEditing(false); }} style={{ padding: '0.3rem 0.7rem', fontSize: '0.7rem' }}>Cancel</Button>
        </div>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
      <p style={{ margin: 0, fontStyle: italic ? 'italic' : 'normal', color: '#aab8be', flex: 1, lineHeight: 1.5 }}>{text}</p>
      <button
        onClick={() => setEditing(true)}
        title="Edit narrative text"
        style={{ background: 'transparent', border: 'none', color: '#6e7d83', cursor: 'pointer', fontSize: '0.85rem', flexShrink: 0, padding: '0.1rem' }}
      >✎</button>
    </div>
  );
}

export function SectionHeader({ children, sub }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <h2 style={{
        fontFamily: "'Chakra Petch', sans-serif",
        fontWeight: 700,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        fontSize: '1.4rem',
        color: '#e4e9ea',
        margin: 0,
        borderBottom: '3px solid #e4e9ea',
        paddingBottom: '0.4rem',
        display: 'inline-block',
      }}>{children}</h2>
      {sub && <div style={{ fontFamily: "'Chakra Petch', sans-serif", fontStyle: 'italic', color: '#6e7d83', fontSize: '0.95rem', marginTop: '0.3rem' }}>{sub}</div>}
    </div>
  );
}

export function TextArea({ value, onChange, placeholder, rows = 6 }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      style={{
        width: '100%',
        fontFamily: "'Chakra Petch', sans-serif",
        fontSize: '1rem',
        lineHeight: 1.5,
        padding: '0.7rem',
        border: '1.5px solid #3a4448',
        borderRadius: '3px',
        background: '#15191b',
        color: '#e4e9ea',
        resize: 'vertical',
        boxSizing: 'border-box',
      }}
    />
  );
}

export function TextInput({ value, onChange, placeholder, style }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        fontFamily: "'Chakra Petch', sans-serif",
        fontSize: '1rem',
        padding: '0.5rem 0.6rem',
        border: '1.5px solid #3a4448',
        borderRadius: '3px',
        background: '#15191b',
        color: '#e4e9ea',
        boxSizing: 'border-box',
        ...style,
      }}
    />
  );
}

export function Select({ value, onChange, options, style }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        fontFamily: "'Chakra Petch', sans-serif",
        fontSize: '0.9rem',
        padding: '0.5rem 0.6rem',
        border: '1.5px solid #3a4448',
        borderRadius: '3px',
        background: '#15191b',
        color: '#e4e9ea',
        boxSizing: 'border-box',
        ...style,
      }}
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

// Free-text input backed by a <datalist> of known names. Lets the Warmaster pick from
// a suggested list where available, but never blocks entry of a name that hasn't been
// catalogued yet (the full Agenda/Location/Upgrade decks aren't all uploaded).
let comboboxCounter = 0;
export function Combobox({ value, onChange, suggestions, placeholder, style }) {
  const listId = useRef(`combobox-${++comboboxCounter}`).current;
  return (
    <>
      <input
        list={listId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          fontFamily: "'Chakra Petch', sans-serif",
          fontSize: '1rem',
          padding: '0.5rem 0.6rem',
          border: '1.5px solid #3a4448',
          borderRadius: '3px',
          background: '#15191b',
          color: '#e4e9ea',
          boxSizing: 'border-box',
          ...style,
        }}
      />
      <datalist id={listId}>
        {suggestions.map(s => <option key={s} value={s} />)}
      </datalist>
    </>
  );
}

export function Button({ children, onClick, variant = 'default', style }) {
  const base = {
    fontFamily: "'Chakra Petch', sans-serif",
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    fontSize: '0.8rem',
    fontWeight: 600,
    padding: '0.55rem 1rem',
    borderRadius: '3px',
    cursor: 'pointer',
    border: '1.5px solid #e4e9ea',
    transition: 'all 0.15s ease',
  };
  const variants = {
    default: { background: '#e4e9ea', color: '#0c0f10' },
    ghost: { background: 'transparent', color: '#e4e9ea' },
    danger: { background: '#8b1a1a', color: '#0c0f10', borderColor: '#8b1a1a' },
  };
  return (
    <button onClick={onClick} style={{ ...base, ...variants[variant], ...style }}>
      {children}
    </button>
  );
}

// ---------- Force Disposition picker / Agenda resolver ----------
export function DispositionPicker({ value, onChange, label }) {
  return (
    <div>
      <div style={{ fontFamily: "'Chakra Petch', sans-serif", fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6e7d83', marginBottom: '0.4rem' }}>{label}</div>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {DISPOSITIONS.map(d => (
          <button
            key={d.id}
            onClick={() => onChange(d.id)}
            title={d.label}
            style={{
              width: 48, height: 48, borderRadius: '50%', padding: 0, overflow: 'hidden',
              border: value === d.id ? '3px solid #e4e9ea' : '2px solid #3a4448',
              background: 'transparent', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: value === d.id ? 1 : 0.55,
              transform: value === d.id ? 'scale(1.08)' : 'scale(1)',
              transition: 'all 0.15s ease',
            }}
          >
            <img src={d.icon} alt={d.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </button>
        ))}
      </div>
    </div>
  );
}

export function EmptyState({ text }) {
  return (
    <div style={{
      border: '1.5px dashed #6e7d83',
      borderRadius: '4px',
      padding: '2.4rem 1.5rem',
      textAlign: 'center',
      color: '#6e7d83',
      fontFamily: "'Chakra Petch', sans-serif",
      fontStyle: 'italic',
    }}>{text}</div>
  );
}
