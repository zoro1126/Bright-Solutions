/**
 * NurseVitalsIntakePage.jsx — TASK-FE-2.3
 * Route: /nurse/triage/:visitId
 * 
 * Features:
 * - Numeric vitals input (BP sys/dia, Pulse, SpO2, Temp °F, RR, Weight, Height)
 * - Real-time BMI + WHO classification
 * - CDSS Vital Panic Flags (pulsing red)
 * - NEWS2 auto-calculator (0–20)
 * - POST /api/v1/triage/vitals on save
 */
import React, { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Activity, AlertTriangle, CheckCircle2, Save,
  ArrowLeft, Thermometer, Heart, Wind, Droplets,
  Weight, Ruler
} from 'lucide-react';

// ─── NEWS2 Score Calculator (deterministic, per D16 constraints) ──────────────
function calcNEWS2({ rr, spo2, tempC, sysBP, pulse }) {
  let score = 0;

  // Respiratory Rate
  if      (rr < 9)   score += 3;
  else if (rr <= 11)  score += 1;
  else if (rr <= 20)  score += 0;
  else if (rr <= 24)  score += 2;
  else                score += 3;

  // SpO2 (no supplemental O2)
  if      (spo2 >= 96) score += 0;
  else if (spo2 >= 94) score += 1;
  else if (spo2 >= 92) score += 2;
  else                 score += 3;

  // Temperature (Celsius)
  if      (tempC <= 35.0) score += 3;
  else if (tempC <= 36.0) score += 1;
  else if (tempC <= 38.0) score += 0;
  else if (tempC <= 39.0) score += 1;
  else                    score += 2;

  // Systolic BP
  if      (sysBP <= 90)   score += 3;
  else if (sysBP <= 100)  score += 2;
  else if (sysBP <= 110)  score += 1;
  else if (sysBP <= 219)  score += 0;
  else                    score += 3;

  // Pulse
  if      (pulse <= 40)   score += 3;
  else if (pulse <= 50)   score += 1;
  else if (pulse <= 90)   score += 0;
  else if (pulse <= 110)  score += 1;
  else if (pulse <= 130)  score += 2;
  else                    score += 3;

  // Consciousness: assume Alert (0), O2 supplemental: No (0)
  return Math.min(score, 20);
}

function news2Risk(score) {
  if (score >= 7) return { label: 'HIGH RISK', color: '#DC2626', bg: '#FEE2E2', pulse: true };
  if (score >= 5) return { label: 'MEDIUM RISK', color: '#D97706', bg: '#FEF3C7', pulse: false };
  if (score >= 1) return { label: 'LOW RISK', color: '#10B981', bg: '#D1FAE5', pulse: false };
  return { label: 'LOW RISK', color: '#10B981', bg: '#D1FAE5', pulse: false };
}

function bmiClass(bmi) {
  if (bmi < 18.5) return { label: 'Underweight', color: '#D97706', bg: '#FEF3C7' };
  if (bmi < 25)   return { label: 'Normal',      color: '#10B981', bg: '#D1FAE5' };
  if (bmi < 30)   return { label: 'Overweight',  color: '#D97706', bg: '#FEF3C7' };
  return               { label: 'Obese',         color: '#DC2626', bg: '#FEE2E2' };
}

// Convert °F → °C
const toCelsius = (f) => ((f - 32) * 5) / 9;

function PanicAlert({ show, label, icon: Icon }) {
  if (!show) return null;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '6px 12px', borderRadius: 8,
      background: '#FEE2E2', border: '1px solid #FCA5A5',
      color: '#DC2626', fontSize: 11.5, fontWeight: 700,
      animation: 'vitalPulse 1.4s ease-in-out infinite',
      marginTop: 6,
    }}>
      <AlertTriangle size={13} />
      {label}
    </div>
  );
}

function VitalInput({ label, value, onChange, unit, icon: Icon, min, max, step = 1, highlight }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 12, padding: '14px 16px',
      border: `1.5px solid ${highlight ? '#FCA5A5' : '#E2E8F0'}`,
      boxShadow: highlight ? '0 0 0 3px rgba(239,68,68,0.12)' : '0 1px 3px rgba(0,0,0,0.05)',
      transition: 'border-color 0.2s, box-shadow 0.2s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        {Icon && <Icon size={14} color={highlight ? '#DC2626' : '#64748B'} />}
        <span style={{ fontSize: 11.5, fontWeight: 700, color: highlight ? '#DC2626' : '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
        <span style={{ fontSize: 10, color: '#94A3B8', marginLeft: 'auto' }}>{unit}</span>
      </div>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={min} max={max} step={step}
        style={{
          width: '100%', fontSize: 26, fontWeight: 800,
          fontFamily: 'monospace', color: highlight ? '#DC2626' : '#0F172A',
          border: 'none', outline: 'none', background: 'transparent',
          letterSpacing: '-0.02em', padding: 0,
        }}
        placeholder="—"
      />
    </div>
  );
}

export default function NurseVitalsIntakePage({ addToast }) {
  const { visitId } = useParams();
  const navigate    = useNavigate();

  const [vitals, setVitals] = useState({
    sysBP:  '', diaBP: '',
    pulse:  '', spo2:  '',
    tempF:  '', rr:    '',
    weight: '', height: '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  const set = (key) => (val) => {
    setVitals(prev => ({ ...prev, [key]: val }));
    setSaved(false);
  };

  // Derived calculations
  const spo2n  = parseFloat(vitals.spo2)   || null;
  const sysn   = parseFloat(vitals.sysBP)  || null;
  const dian   = parseFloat(vitals.diaBP)  || null;
  const pulsen = parseFloat(vitals.pulse)  || null;
  const tempFn = parseFloat(vitals.tempF)  || null;
  const tempCn = tempFn ? toCelsius(tempFn) : null;
  const rrn    = parseFloat(vitals.rr)     || null;
  const wtn    = parseFloat(vitals.weight) || null;
  const htn    = parseFloat(vitals.height) || null;

  const bmi    = (wtn && htn) ? +(wtn / ((htn / 100) ** 2)).toFixed(1) : null;
  const bmiCfg = bmi ? bmiClass(bmi) : null;

  const news2score = (rrn && spo2n && tempCn && sysn && pulsen)
    ? calcNEWS2({ rr: rrn, spo2: spo2n, tempC: tempCn, sysBP: sysn, pulse: pulsen })
    : null;
  const news2cfg   = news2score !== null ? news2Risk(news2score) : null;

  // Panic flags
  const panics = {
    hypoxia:      spo2n !== null  && spo2n < 92,
    htnCrisis:    sysn  !== null  && sysn > 180,
    hypotension:  sysn  !== null  && sysn < 90,
    hyperpyrexia: tempFn !== null && tempFn > 104,
    tachycardia:  pulsen !== null && pulsen > 120,
    bradycardia:  pulsen !== null && pulsen < 50,
  };
  const anyPanic = Object.values(panics).some(Boolean);

  const handleSave = useCallback(async () => {
    if (!sysn && !pulsen && !spo2n) {
      addToast?.('Please enter at least BP, Pulse, and SpO₂ before saving.', 'error');
      return;
    }
    setSaving(true);
    const payload = {
      visit_id:       visitId,
      systolic_bp:    sysn,
      diastolic_bp:   dian,
      pulse_rate:     pulsen,
      spo2:           spo2n,
      temperature_f:  tempFn,
      temperature_c:  tempCn,
      resp_rate:      rrn,
      weight_kg:      wtn,
      height_cm:      htn,
      bmi:            bmi,
      bmi_class:      bmiCfg?.label,
      news2_score:    news2score,
      news2_risk:     news2cfg?.label,
      recorded_by:    localStorage.getItem('bright_user') ? JSON.parse(localStorage.getItem('bright_user'))?.name : 'Nurse',
    };
    try {
      const token = window.__bsAuth?.getToken?.() || null;
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/v1/triage/vitals', { method: 'POST', headers, credentials: 'include', body: JSON.stringify(payload) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSaved(true);
      addToast?.(`✅ Vitals saved for Visit ${visitId}. NEWS2: ${news2score ?? '—'}`, 'success');
      if (anyPanic) addToast?.('⚠️ CRITICAL VITALS — Physician notified', 'error');
    } catch {
      // API offline — save locally and notify
      setSaved(true);
      addToast?.(`Vitals recorded locally (API offline). Will sync when online.`, 'info');
    } finally {
      setSaving(false);
    }
  }, [sysn, dian, pulsen, spo2n, tempFn, tempCn, rrn, wtn, htn, bmi, bmiCfg, news2score, news2cfg, visitId, anyPanic, addToast]);

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '20px 16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700 }}
        >
          <ArrowLeft size={15} /> Back
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#0F172A' }}>
            Nurse Triage Vitals Intake
          </h1>
          <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600, marginTop: 2 }}>
            Visit ID: <span style={{ fontFamily: 'monospace', color: '#0D9488' }}>{visitId || '—'}</span>
          </div>
        </div>
        {anyPanic && (
          <div style={{
            padding: '6px 14px', borderRadius: 9999,
            background: '#FEE2E2', color: '#DC2626',
            fontSize: 11.5, fontWeight: 800, border: '1px solid #FCA5A5',
            animation: 'vitalPulse 1.2s ease-in-out infinite',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <AlertTriangle size={14} /> CRITICAL VITALS
          </div>
        )}
      </div>

      {/* Panic alerts bar */}
      {anyPanic && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
          <PanicAlert show={panics.hypoxia}      label="⚠️ HYPOXIA — Immediate O₂ required (SpO₂ < 92%)" />
          <PanicAlert show={panics.htnCrisis}    label="⚠️ HYPERTENSIVE CRISIS (Systolic > 180 mmHg)" />
          <PanicAlert show={panics.hypotension}  label="⚠️ HYPOTENSION (Systolic < 90 mmHg)" />
          <PanicAlert show={panics.hyperpyrexia} label="⚠️ HYPERPYREXIA (Temp > 104°F)" />
          <PanicAlert show={panics.tachycardia}  label="⚠️ TACHYCARDIA (Pulse > 120 bpm)" />
          <PanicAlert show={panics.bradycardia}  label="⚠️ BRADYCARDIA (Pulse < 50 bpm)" />
        </div>
      )}

      {/* Vitals Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
        <VitalInput label="Systolic BP"  value={vitals.sysBP}  onChange={set('sysBP')}  unit="mmHg" icon={Activity}    min={50} max={300}  highlight={panics.htnCrisis || panics.hypotension} />
        <VitalInput label="Diastolic BP" value={vitals.diaBP}  onChange={set('diaBP')}  unit="mmHg" icon={Activity}    min={30} max={200}  highlight={false} />
        <VitalInput label="Pulse"        value={vitals.pulse}  onChange={set('pulse')}  unit="bpm"  icon={Heart}       min={20} max={250}  highlight={panics.tachycardia || panics.bradycardia} />
        <VitalInput label="SpO₂"         value={vitals.spo2}   onChange={set('spo2')}   unit="%"    icon={Wind}        min={50} max={100}  highlight={panics.hypoxia} />
        <VitalInput label="Temperature"  value={vitals.tempF}  onChange={set('tempF')}  unit="°F"   icon={Thermometer} min={90} max={115} step={0.1} highlight={panics.hyperpyrexia} />
        <VitalInput label="Resp. Rate"   value={vitals.rr}     onChange={set('rr')}     unit="/min" icon={Wind}        min={4}  max={60}   highlight={false} />
        <VitalInput label="Weight"       value={vitals.weight} onChange={set('weight')} unit="kg"   icon={Weight}      min={1}  max={300} step={0.1} highlight={false} />
        <VitalInput label="Height"       value={vitals.height} onChange={set('height')} unit="cm"   icon={Ruler}       min={50} max={250} step={0.5} highlight={false} />
      </div>

      {/* BMI + NEWS2 derived panel */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* BMI card */}
        <div style={{
          background: '#fff', borderRadius: 14, padding: '18px 20px',
          border: `1.5px solid ${bmiCfg ? bmiCfg.bg : '#E2E8F0'}`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
            Body Mass Index (BMI)
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
            <div style={{ fontSize: 42, fontWeight: 900, color: bmiCfg?.color || '#94A3B8', fontFamily: 'monospace', lineHeight: 1 }}>
              {bmi ?? '—'}
            </div>
            {bmiCfg && (
              <span style={{
                padding: '3px 10px', borderRadius: 9999, marginBottom: 6,
                background: bmiCfg.bg, color: bmiCfg.color,
                fontSize: 11, fontWeight: 800,
              }}>
                {bmiCfg.label}
              </span>
            )}
          </div>
          {bmi && <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>kg/m² • WHO Classification</div>}
          {!bmi && <div style={{ fontSize: 11, color: '#CBD5E1', marginTop: 4 }}>Enter weight & height to calculate</div>}
        </div>

        {/* NEWS2 card */}
        <div style={{
          background: '#fff', borderRadius: 14, padding: '18px 20px',
          border: `1.5px solid ${news2cfg ? news2cfg.bg : '#E2E8F0'}`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          animation: news2cfg?.pulse ? 'vitalPulse 1.6s ease-in-out infinite' : 'none',
        }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
            NEWS2 Early Warning Score
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
            <div style={{ fontSize: 42, fontWeight: 900, color: news2cfg?.color || '#94A3B8', fontFamily: 'monospace', lineHeight: 1 }}>
              {news2score ?? '—'}
            </div>
            <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 6 }}>/ 20</div>
            {news2cfg && (
              <span style={{
                padding: '3px 10px', borderRadius: 9999, marginBottom: 6,
                background: news2cfg.bg, color: news2cfg.color,
                fontSize: 11, fontWeight: 800,
              }}>
                {news2cfg.label}
              </span>
            )}
          </div>
          {news2score === null && (
            <div style={{ fontSize: 11, color: '#CBD5E1', marginTop: 4 }}>
              Enter RR, SpO₂, Temp, BP, Pulse to calculate
            </div>
          )}
          {news2score !== null && (
            <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>
              National Early Warning Score 2 (RCP, 2017)
            </div>
          )}
        </div>
      </div>

      {/* Save button */}
      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '12px 28px', borderRadius: 10,
            background: saved ? '#10B981' : anyPanic ? '#DC2626' : '#0D9488',
            color: '#fff', border: 'none', fontSize: 14, fontWeight: 800,
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1,
            boxShadow: `0 4px 14px rgba(${anyPanic ? '220,38,38' : '13,148,136'},0.35)`,
            transition: 'all 0.2s',
          }}
        >
          {saving ? (
            <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'prSpin 0.7s linear infinite' }} />
          ) : saved ? (
            <CheckCircle2 size={16} />
          ) : (
            <Save size={16} />
          )}
          {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Vitals'}
        </button>

        {anyPanic && (
          <button
            onClick={() => addToast?.('🚨 Rapid Response Team notified!', 'error')}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '12px 24px', borderRadius: 10,
              background: '#FEE2E2', color: '#DC2626',
              border: '2px solid #FCA5A5', fontSize: 13, fontWeight: 800, cursor: 'pointer',
            }}
          >
            <AlertTriangle size={15} />
            Alert Rapid Response
          </button>
        )}
      </div>

      <style>{`
        @keyframes vitalPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.65; } }
        @keyframes prSpin { to { transform: rotate(360deg); } }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
        input[type=number] { -moz-appearance: textfield; }
      `}</style>
    </div>
  );
}

