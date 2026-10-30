/**
 * DynamicFormRenderer.jsx — TASK FE-4.8
 * Reusable generic form renderer driven by a schema array.
 *
 * Props:
 *   schema      — array of field objects (see below)
 *   values      — { [fieldId]: value } controlled state
 *   onChange    — (fieldId, value) => void
 *   onSubmit    — (values) => void
 *   submitLabel — string (default "Save")
 *   readOnly    — boolean
 *
 * Field object shape:
 *   { id, type, label, placeholder, required, options, unit, span }
 *   type: 'text' | 'number' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'date'
 *   span: 1 (half width) | 2 (full width, default)
 *   options: array of { value, label } for select/radio
 */
import React, { useState } from 'react';
import { Save, AlertCircle } from 'lucide-react';

export default function DynamicFormRenderer({
  schema = [],
  values = {},
  onChange,
  onSubmit,
  submitLabel = 'Save',
  readOnly = false,
}) {
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    schema.forEach((f) => {
      if (f.required && !values[f.id]) e[f.id] = `${f.label} is required`;
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (ev) => {
    ev.preventDefault();
    if (validate() && onSubmit) onSubmit(values);
  };

  const inputStyle = (id) => ({
    width: '100%',
    padding: '8px 10px',
    borderRadius: 8,
    fontSize: 12.5,
    fontWeight: 500,
    border: `1.5px solid ${errors[id] ? '#fca5a5' : '#e2e8f0'}`,
    background: readOnly ? '#f8fafc' : '#fff',
    color: '#0f172a',
    outline: 'none',
    boxSizing: 'border-box',
  });

  const labelStyle = {
    display: 'block',
    fontSize: 11,
    fontWeight: 700,
    color: '#334155',
    marginBottom: 4,
  };

  const renderField = (field) => {
    const { id, type, label, placeholder, options = [], unit } = field;
    const val = values[id] ?? '';
    const change = (v) => { if (!readOnly && onChange) onChange(id, v); };

    let input;

    if (type === 'textarea') {
      input = (
        <textarea
          value={val}
          onChange={(e) => change(e.target.value)}
          placeholder={placeholder}
          readOnly={readOnly}
          style={{ ...inputStyle(id), minHeight: 80, resize: 'vertical', fontFamily: 'inherit' }}
        />
      );
    } else if (type === 'select') {
      input = (
        <select
          value={val}
          onChange={(e) => change(e.target.value)}
          disabled={readOnly}
          style={inputStyle(id)}
        >
          <option value="">— Select —</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      );
    } else if (type === 'radio') {
      input = (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
          {options.map((o) => (
            <label
              key={o.value}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                cursor: readOnly ? 'default' : 'pointer',
                padding: '5px 12px', borderRadius: 8,
                border: `1.5px solid ${val === o.value ? '#0d9488' : '#e2e8f0'}`,
                background: val === o.value ? '#f0fdfa' : '#fff',
                fontSize: 12,
                fontWeight: val === o.value ? 700 : 500,
                color: val === o.value ? '#0d9488' : '#334155',
              }}
            >
              <input
                type="radio"
                value={o.value}
                checked={val === o.value}
                onChange={() => change(o.value)}
                disabled={readOnly}
                style={{ accentColor: '#0d9488' }}
              />
              {o.label}
            </label>
          ))}
        </div>
      );
    } else if (type === 'checkbox') {
      input = (
        <label
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            cursor: readOnly ? 'default' : 'pointer',
            padding: '8px 12px', borderRadius: 8,
            border: `1.5px solid ${val ? '#0d9488' : '#e2e8f0'}`,
            background: val ? '#f0fdfa' : '#fff',
            fontSize: 12, fontWeight: 600,
            color: val ? '#0d9488' : '#334155',
          }}
        >
          <input
            type="checkbox"
            checked={!!val}
            onChange={(e) => change(e.target.checked)}
            disabled={readOnly}
            style={{ accentColor: '#0d9488' }}
          />
          {placeholder || label}
        </label>
      );
    } else {
      input = (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            type={type}
            value={val}
            onChange={(e) => change(e.target.value)}
            placeholder={placeholder}
            readOnly={readOnly}
            style={{ ...inputStyle(id), flex: 1 }}
          />
          {unit && (
            <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b', whiteSpace: 'nowrap' }}>
              {unit}
            </span>
          )}
        </div>
      );
    }

    return (
      <div
        key={id}
        style={{ gridColumn: field.span === 1 ? 'span 1' : 'span 2', marginBottom: 4 }}
      >
        {type !== 'checkbox' && (
          <label style={labelStyle}>
            {label}
            {field.required && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}
          </label>
        )}
        {input}
        {errors[id] && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3, fontSize: 10.5, color: '#ef4444' }}>
            <AlertCircle size={10} />
            {errors[id]}
          </div>
        )}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px' }}>
        {schema.map(renderField)}
      </div>
      {!readOnly && onSubmit && (
        <button
          type="submit"
          style={{
            marginTop: 16,
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '9px 20px', borderRadius: 9,
            border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg,#0d9488,#0f766e)',
            color: '#fff', fontSize: 12.5, fontWeight: 700,
          }}
        >
          <Save size={14} /> {submitLabel}
        </button>
      )}
    </form>
  );
}

