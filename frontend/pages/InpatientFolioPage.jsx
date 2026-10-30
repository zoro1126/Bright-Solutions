/**
 * InpatientFolioPage.jsx — TASK-FE-4.1 + FE-4.2 + FE-4.3
 * Inpatient patient folio with 7-tab structure.
 *
 * Props:
 *   admission  — { bed, patient } from BedMatrixPage
 *   onBack     — callback to go back to admissions list
 *
 * Tabs:
 *   1. Intake & Consents   (Forms 8, 9, 10)
 *   2. Treatment & MAR     (Form 29)
 *   3. Fluid Balance       (Form 61)
 *   4. Nursing & Care      (Forms 71, 72)
 *   5. Surgical & OT       (Forms 15, 54)
 *   6. Handovers           (SBAR, Transfers)
 *   7. Discharge & Feedback
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, FileText, Pill, Droplets, Heart,
  Scissors, ArrowRightLeft, LogOut, AlertTriangle,
  CheckCircle2, User, Phone, MapPin, CreditCard,
  Shield, Clock, Save, ChevronDown, ChevronUp,
  Activity, Thermometer, Wind,
} from 'lucide-react';

// ─── Tabs config ──────────────────────────────────────────────────────────────
const TABS = [
  { id: 'intake',    label: 'Intake & Consents',    icon: FileText,       shortLabel: 'Intake'    },
  { id: 'mar',       label: 'Treatment & MAR',       icon: Pill,           shortLabel: 'MAR'       },
  { id: 'fluid',     label: 'Fluid Balance',         icon: Droplets,       shortLabel: 'Fluid'     },
  { id: 'nursing',   label: 'Nursing & Care',        icon: Heart,          shortLabel: 'Nursing'   },
  { id: 'surgical',  label: 'Surgical & OT',         icon: Scissors,       shortLabel: 'OT'        },
  { id: 'handover',  label: 'Handovers',             icon: ArrowRightLeft, shortLabel: 'Handover'  },
  { id: 'discharge', label: 'Discharge',             icon: LogOut,         shortLabel: 'Discharge' },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: 16, overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '14px 18px', background: 'none', border: 'none', cursor: 'pointer',
          borderBottom: open ? '1px solid #f1f5f9' : 'none',
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>{title}</span>
        {open ? <ChevronUp size={16} color="#94a3b8" /> : <ChevronDown size={16} color="#94a3b8" />}
      </button>
      {open && <div style={{ padding: '16px 18px' }}>{children}</div>}
    </div>
  );
}

function FieldRow({ label, value, highlight }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
      <div style={{ width: 160, flexShrink: 0, fontSize: 11.5, fontWeight: 600, color: '#64748b' }}>{label}</div>
      <div style={{
        flex: 1, fontSize: 12.5, fontWeight: highlight ? 700 : 500,
        color: highlight ? '#0f172a' : '#334155',
        background: highlight ? '#f0fdf4' : 'transparent',
        padding: highlight ? '2px 8px' : 0,
        borderRadius: highlight ? 6 : 0,
      }}>
        {value || <span style={{ color: '#cbd5e1' }}>—</span>}
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, type = 'text', unit, placeholder }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 4 }}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <input
          type={type}
          value={value}
          onChange={e => onChange?.(e.target.value)}
          placeholder={placeholder || '—'}
          style={{
            flex: 1, padding: '8px 12px', borderRadius: 8,
            border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none',
            background: '#fff', color: '#0f172a',
            transition: 'border-color 0.15s',
          }}
          onFocus={e => e.target.style.borderColor = '#0d9488'}
          onBlur={e => e.target.style.borderColor = '#e2e8f0'}
        />
        {unit && <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>{unit}</span>}
      </div>
    </div>
  );
}

// ─── Tab 1: Intake & Consents (Forms 8, 9, 10) ───────────────────────────────
function IntakeTab({ admission }) {
  const p = admission?.patient || {};
  const [mlcToggle, setMlcToggle] = useState(false);
  const [paymentType, setPaymentType] = useState('CASH');
  const [kinName, setKinName] = useState('');
  const [kinPhone, setKinPhone] = useState('');
  const [kinRel, setKinRel] = useState('');
  const [policeStation, setPoliceStation] = useState('');
  const [firNo, setFirNo] = useState('');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [saved, setSaved] = useState(false);

  // Form 10 Systemic Exam
  const [systemicExam, setSystemicExam] = useState({
    cvs: 'S1 S2 heard, normal rhythm, no murmurs',
    resp: 'Bilateral vesicular breath sounds, chest clear',
    abdomen: 'Soft, non-tender, bowel sounds present',
    cns: 'Conscious, oriented to time, place and person, no focal deficit'
  });

  // Form 70 Nursing Initial Assessment
  const [vitalsTriage, setVitalsTriage] = useState({
    bp: '124/82', pulse: '76', spo2: '98', temp: '98.4', rr: '16'
  });
  const [morse, setMorse] = useState({
    historyOfFalls: 0,
    secondaryDx: 15,
    ambulatoryAid: 0,
    ivTherapy: 20,
    gait: 0,
    mentalStatus: 0,
  });
  const morseScore = Object.values(morse).reduce((a, b) => a + Number(b), 0);
  const morseRisk = morseScore >= 51 ? { label: 'High Risk', color: '#dc2626', bg: '#fee2e2' }
    : morseScore >= 25 ? { label: 'Moderate Risk', color: '#d97706', bg: '#fef3c7' }
    : { label: 'Low Risk', color: '#16a34a', bg: '#f0fdf4' };

  const [braden, setBraden] = useState({
    sensory: 4, moisture: 4, activity: 3, mobility: 3, nutrition: 3, friction: 2
  });
  const bradenScore = Object.values(braden).reduce((a, b) => a + Number(b), 0);
  const bradenRisk = bradenScore <= 9 ? { label: 'Very High Risk', color: '#dc2626', bg: '#fee2e2' }
    : bradenScore <= 12 ? { label: 'High Risk', color: '#ea580c', bg: '#fff7ed' }
    : bradenScore <= 14 ? { label: 'Moderate Risk', color: '#d97706', bg: '#fef3c7' }
    : bradenScore <= 18 ? { label: 'Mild Risk', color: '#0284c7', bg: '#f0f9ff' }
    : { label: 'No Risk', color: '#16a34a', bg: '#f0fdf4' };

  const [wristbandVerified, setWristbandVerified] = useState(true);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      {/* Form 9 — Admission Face Sheet */}
      <SectionCard title="Form 9 — Inpatient Face Sheet">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
          <FieldRow label="Patient Name"       value={p.name}   highlight />
          <FieldRow label="UHID"               value={p.uhid}   highlight />
          <FieldRow label="Bed No."            value={admission?.bed?.id} highlight />
          <FieldRow label="Ward"               value={admission?.bed?.wardName} />
          <FieldRow label="Admission Date"     value={new Date().toLocaleDateString('en-IN')} />
          <FieldRow label="Attending Doctor"   value={p.doc} />
          <FieldRow label="Day of Stay"        value={`Day ${p.admDay || 1}`} />
          <FieldRow label="Room Rate"          value={`₹${(admission?.bed?.dailyRate || 1500).toLocaleString('en-IN')}/day`} />
        </div>
      </SectionCard>

      {/* Form 8 — MLC & Legal */}
      <SectionCard title="Form 8 — Admission Consent & MLC Status">
        {/* MLC Toggle */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 14px', borderRadius: 10,
          background: mlcToggle ? '#fff5f5' : '#f8fafc',
          border: `1.5px solid ${mlcToggle ? '#fca5a5' : '#e2e8f0'}`,
          marginBottom: 16, cursor: 'pointer',
        }} onClick={() => setMlcToggle(v => !v)}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: mlcToggle ? '#dc2626' : '#334155' }}>
              {mlcToggle ? '⚠️ MLC Case Active' : 'Medico-Legal Case (MLC)'}
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
              Toggle if this is a police / accident / assault case
            </div>
          </div>
          <div style={{
            width: 40, height: 22, borderRadius: 11,
            background: mlcToggle ? '#dc2626' : '#e2e8f0',
            position: 'relative', transition: 'background 0.2s',
          }}>
            <div style={{
              position: 'absolute', top: 3, left: mlcToggle ? 21 : 3,
              width: 16, height: 16, borderRadius: 8, background: '#fff',
              transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }} />
          </div>
        </div>

        {/* MLC fields — only show when toggled */}
        {mlcToggle && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16, padding: '12px 14px', background: '#fff5f5', borderRadius: 8, border: '1px solid #fca5a5' }}>
            <InputField label="Police Station Name" value={policeStation} onChange={setPoliceStation} placeholder="e.g. Kalupur PS" />
            <InputField label="FIR / DD Number" value={firNo} onChange={setFirNo} placeholder="FIR-2024-0431" />
          </div>
        )}

        {/* Consent checkboxes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            'I consent to the proposed treatment and medical/surgical procedures.',
            'I acknowledge the hospital\'s financial responsibility policy.',
            'I have been informed of my rights as a patient.',
            'I consent to photography/video for medical documentation only.',
          ].map((text, i) => (
            <label key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
              <input type="checkbox" defaultChecked style={{ marginTop: 2, accentColor: '#0d9488' }} />
              <span style={{ fontSize: 12, color: '#334155', lineHeight: 1.5 }}>{text}</span>
            </label>
          ))}
        </div>
      </SectionCard>

      {/* Next of Kin */}
      <SectionCard title="Next of Kin / Legal Guardian">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          <InputField label="Guardian Name" value={kinName} onChange={setKinName} placeholder="Full name" />
          <InputField label="Relationship" value={kinRel} onChange={setKinRel} placeholder="e.g. Son, Wife" />
          <InputField label="Phone Number" value={kinPhone} onChange={setKinPhone} type="tel" placeholder="+91 98765 43210" />
        </div>
      </SectionCard>

      {/* Payment Category */}
      <SectionCard title="Payment Category & Advance Deposit">
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          {['CASH', 'TPA', 'GOVT_SCHEME'].map(pt => (
            <button
              key={pt}
              onClick={() => setPaymentType(pt)}
              style={{
                padding: '8px 18px', borderRadius: 8, fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
                background: paymentType === pt ? '#0d9488' : '#f1f5f9',
                color: paymentType === pt ? '#fff' : '#64748b',
                border: `1.5px solid ${paymentType === pt ? '#0d9488' : '#e2e8f0'}`,
                transition: 'all 0.15s',
              }}
            >
              {pt === 'CASH' ? '💵 Self-Pay / Cash' : pt === 'TPA' ? '🏢 TPA Insurance' : '🏛️ Govt. Scheme'}
            </button>
          ))}
        </div>
        {paymentType === 'TPA' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '12px', background: '#f0f9ff', borderRadius: 8, marginBottom: 12 }}>
            <InputField label="Insurance Company" placeholder="Star Health, HDFC Ergo…" />
            <InputField label="TPA Card ID" placeholder="TPA-XXXX-XXXX" />
            <InputField label="Pre-Authorization Amount" type="number" unit="₹" placeholder="50000" />
            <InputField label="Policy Number" placeholder="POL-2024-XXXXX" />
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <InputField label="Advance Deposit (₹)" type="number" unit="₹" placeholder="5000" />
          <InputField label="Receipt Number" placeholder="RCP-2024-XXXX" />
        </div>
      </SectionCard>

      {/* Form 10 — Doctor H&P */}
      <SectionCard title="Form 10 — Doctor H&P Admission Note" defaultOpen={false}>
        <InputField label="Chief Complaint" value={chiefComplaint} onChange={setChiefComplaint} placeholder="e.g. Chest pain for 2 hours, radiating to left arm" />
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 4 }}>History of Present Illness</label>
          <textarea
            rows={4}
            placeholder="Onset, duration, character, aggravating/relieving factors..."
            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 13, resize: 'vertical', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
            onFocus={e => e.target.style.borderColor = '#0d9488'}
            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Past Medical History</label>
            <textarea rows={3} placeholder="HTN, DM, prior surgeries..." style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 12, resize: 'vertical', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Current Medications</label>
            <textarea rows={3} placeholder="Drug, dose, frequency..." style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 12, resize: 'vertical', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
          </div>
        </div>
        {/* Systemic Examination (CVS, Resp, Abdomen, CNS) */}
        <div style={{ marginTop: 14, marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>🩺 Systemic Examination</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Cardiovascular (CVS)</label>
              <input type="text" value={systemicExam.cvs} onChange={e => setSystemicExam(s => ({ ...s, cvs: e.target.value }))}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Respiratory System (RS)</label>
              <input type="text" value={systemicExam.resp} onChange={e => setSystemicExam(s => ({ ...s, resp: e.target.value }))}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Abdomen (GI)</label>
              <input type="text" value={systemicExam.abdomen} onChange={e => setSystemicExam(s => ({ ...s, abdomen: e.target.value }))}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Central Nervous System (CNS)</label>
              <input type="text" value={systemicExam.cns} onChange={e => setSystemicExam(s => ({ ...s, cns: e.target.value }))}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
            </div>
          </div>
        </div>

        <InputField label="Provisional Diagnosis" placeholder="ICD-10 code or description" />
        <InputField label="Allergies" placeholder="Drug / food allergies (NKDA if none)" />
      </SectionCard>

      {/* Form 70 — Nursing Initial Assessment (Morse Fall Risk & Braden Scale) */}
      <SectionCard title="Form 70 — Nursing Initial Admission Assessment (15-Min Triage)" defaultOpen={false}>
        {/* Triage vitals */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>⚡ 15-Minute Triage Baseline Vitals</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
            {[
              ['BP (mmHg)', vitalsTriage.bp, 'bp'],
              ['Pulse (bpm)', vitalsTriage.pulse, 'pulse'],
              ['SpO₂ (%)', vitalsTriage.spo2, 'spo2'],
              ['Temp (°F)', vitalsTriage.temp, 'temp'],
              ['Resp. Rate (/min)', vitalsTriage.rr, 'rr'],
            ].map(([lbl, val, key]) => (
              <div key={key} style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 4 }}>{lbl}</span>
                <input
                  type="text"
                  value={val}
                  onChange={e => setVitalsTriage(vt => ({ ...vt, [key]: e.target.value }))}
                  style={{ width: '100%', padding: '4px 6px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, fontWeight: 800, color: '#0f172a', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Morse Fall Risk Calculator */}
        <div style={{ marginBottom: 16, padding: '14px', borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#0f172a' }}>
              🚶 Morse Fall Risk Scale
            </div>
            <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800, background: morseRisk.bg, color: morseRisk.color, border: `1px solid ${morseRisk.color}40` }}>
              Score: {morseScore} — {morseRisk.label}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 11.5 }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, color: '#475569', marginBottom: 4 }}>1. History of Falling (within 3 mos)</label>
              <select value={morse.historyOfFalls} onChange={e => setMorse(m => ({ ...m, historyOfFalls: Number(e.target.value) }))}
                style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 12 }}>
                <option value={0}>No (0 pts)</option>
                <option value={25}>Yes (25 pts)</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, color: '#475569', marginBottom: 4 }}>2. Secondary Diagnosis (&gt;1 medical dx)</label>
              <select value={morse.secondaryDx} onChange={e => setMorse(m => ({ ...m, secondaryDx: Number(e.target.value) }))}
                style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 12 }}>
                <option value={0}>No (0 pts)</option>
                <option value={15}>Yes (15 pts)</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, color: '#475569', marginBottom: 4 }}>3. Ambulatory Aid</label>
              <select value={morse.ambulatoryAid} onChange={e => setMorse(m => ({ ...m, ambulatoryAid: Number(e.target.value) }))}
                style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 12 }}>
                <option value={0}>None / Bed Rest / Nurse assist (0 pts)</option>
                <option value={15}>Crutches / Cane / Walker (15 pts)</option>
                <option value={30}>Furniture clutching (30 pts)</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, color: '#475569', marginBottom: 4 }}>4. IV Line / Saline Lock</label>
              <select value={morse.ivTherapy} onChange={e => setMorse(m => ({ ...m, ivTherapy: Number(e.target.value) }))}
                style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 12 }}>
                <option value={0}>No (0 pts)</option>
                <option value={20}>Yes (20 pts)</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, color: '#475569', marginBottom: 4 }}>5. Gait / Transferring</label>
              <select value={morse.gait} onChange={e => setMorse(m => ({ ...m, gait: Number(e.target.value) }))}
                style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 12 }}>
                <option value={0}>Normal / Immobile / Wheelchair (0 pts)</option>
                <option value={10}>Weak (10 pts)</option>
                <option value={20}>Impaired / Shuffling (20 pts)</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, color: '#475569', marginBottom: 4 }}>6. Mental Status</label>
              <select value={morse.mentalStatus} onChange={e => setMorse(m => ({ ...m, mentalStatus: Number(e.target.value) }))}
                style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 12 }}>
                <option value={0}>Oriented to own ability (0 pts)</option>
                <option value={15}>Overestimates / Forgets limitations (15 pts)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Braden Pressure Ulcer Risk Scale */}
        <div style={{ marginBottom: 16, padding: '14px', borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#0f172a' }}>
              🛡️ Braden Pressure Injury Risk Scale
            </div>
            <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800, background: bradenRisk.bg, color: bradenRisk.color, border: `1px solid ${bradenRisk.color}40` }}>
              Score: {bradenScore}/23 — {bradenRisk.label}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, fontSize: 11.5 }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Sensory Perception</label>
              <select value={braden.sensory} onChange={e => setBraden(b => ({ ...b, sensory: Number(e.target.value) }))}
                style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 11.5 }}>
                <option value={1}>1 - Completely Limited</option>
                <option value={2}>2 - Very Limited</option>
                <option value={3}>3 - Slightly Limited</option>
                <option value={4}>4 - No Impairment</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Moisture</label>
              <select value={braden.moisture} onChange={e => setBraden(b => ({ ...b, moisture: Number(e.target.value) }))}
                style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 11.5 }}>
                <option value={1}>1 - Constantly Moist</option>
                <option value={2}>2 - Very Moist</option>
                <option value={3}>3 - Occasionally Moist</option>
                <option value={4}>4 - Rarely Moist</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Activity</label>
              <select value={braden.activity} onChange={e => setBraden(b => ({ ...b, activity: Number(e.target.value) }))}
                style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 11.5 }}>
                <option value={1}>1 - Bedfast</option>
                <option value={2}>2 - Chairfast</option>
                <option value={3}>3 - Walks Occasionally</option>
                <option value={4}>4 - Walks Frequently</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Mobility</label>
              <select value={braden.mobility} onChange={e => setBraden(b => ({ ...b, mobility: Number(e.target.value) }))}
                style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 11.5 }}>
                <option value={1}>1 - Completely Immobile</option>
                <option value={2}>2 - Very Limited</option>
                <option value={3}>3 - Slightly Limited</option>
                <option value={4}>4 - No Limitations</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Nutrition</label>
              <select value={braden.nutrition} onChange={e => setBraden(b => ({ ...b, nutrition: Number(e.target.value) }))}
                style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 11.5 }}>
                <option value={1}>1 - Very Poor</option>
                <option value={2}>2 - Probably Inadequate</option>
                <option value={3}>3 - Adequate</option>
                <option value={4}>4 - Excellent</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Friction &amp; Shear</label>
              <select value={braden.friction} onChange={e => setBraden(b => ({ ...b, friction: Number(e.target.value) }))}
                style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 11.5 }}>
                <option value={1}>1 - Problem</option>
                <option value={2}>2 - Potential Problem</option>
                <option value={3}>3 - No Apparent Problem</option>
              </select>
            </div>
          </div>
        </div>

        {/* Allergy Wristband Verification */}
        <label style={{
          display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
          padding: '10px 14px', borderRadius: 8, background: wristbandVerified ? '#f0fdf4' : '#fff5f5',
          border: `1.5px solid ${wristbandVerified ? '#86efac' : '#fca5a5'}`,
        }}>
          <input
            type="checkbox"
            checked={wristbandVerified}
            onChange={e => setWristbandVerified(e.target.checked)}
            style={{ accentColor: '#10b981', width: 16, height: 16 }}
          />
          <span style={{ fontSize: 12, fontWeight: 700, color: wristbandVerified ? '#15803d' : '#dc2626' }}>
            🏷️ Physical Allergy Wristband verified and placed on patient's wrist (NABH Mandate)
          </span>
        </label>
      </SectionCard>

      {/* Save bar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 8 }}>
        <button onClick={handleSave} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 24px', borderRadius: 9,
          background: saved ? '#10b981' : '#0d9488', color: '#fff',
          border: 'none', fontSize: 13, fontWeight: 800, cursor: 'pointer',
          transition: 'background 0.2s',
        }}>
          {saved ? <CheckCircle2 size={15} /> : <Save size={15} />}
          {saved ? 'Saved!' : 'Save Intake Forms'}
        </button>
      </div>
    </div>
  );
}

// ─── Tab 2: Treatment & MAR (Form 29) ────────────────────────────────────────
function MARTab() {
  const DAYS = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6'];
  const TIMES = ['08:00', '14:00', '20:00', '02:00'];

  const mockOrders = [
    { drug: 'Tab. Metformin 500mg', route: 'Oral', freq: 'BD', dose: '500mg' },
    { drug: 'Inj. Ceftriaxone 1g', route: 'IV',   freq: 'OD', dose: '1g'   },
    { drug: 'Tab. Pantoprazole 40mg', route: 'Oral', freq: 'OD', dose: '40mg' },
    { drug: 'Inj. Paracetamol 1g',  route: 'IV',   freq: 'TDS', dose: '1g'  },
  ];

  const [marStatus, setMarStatus] = useState({});
  const toggleStatus = (drug, day, time) => {
    const key = `${drug}-${day}-${time}`;
    setMarStatus(prev => ({
      ...prev,
      [key]: prev[key] === 'given' ? null : 'given',
    }));
  };

  return (
    <div>
      {/* Doctor Order Panel */}
      <SectionCard title="Form 29 — Active Treatment Orders">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#334155', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' }}>Drug / Order</th>
                <th style={{ padding: '10px 8px', color: '#334155', fontWeight: 700, borderBottom: '2px solid #e2e8f0' }}>Route</th>
                <th style={{ padding: '10px 8px', color: '#334155', fontWeight: 700, borderBottom: '2px solid #e2e8f0' }}>Freq</th>
                {DAYS.map(d => (
                  <th key={d} style={{ padding: '10px 8px', textAlign: 'center', color: '#0d9488', fontWeight: 700, borderBottom: '2px solid #e2e8f0', minWidth: 64 }}>{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mockOrders.map((order, ri) => (
                <tr key={ri} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap' }}>
                    <div>{order.drug}</div>
                    <div style={{ fontSize: 10, color: '#94a3b8' }}>{order.dose}</div>
                  </td>
                  <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                    <span style={{
                      padding: '2px 7px', borderRadius: 9999, fontSize: 10, fontWeight: 700,
                      background: order.route === 'IV' ? '#ede9fe' : '#f0fdf4',
                      color: order.route === 'IV' ? '#6d28d9' : '#15803d',
                    }}>{order.route}</span>
                  </td>
                  <td style={{ padding: '10px 8px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#64748b' }}>{order.freq}</td>
                  {DAYS.map(day => {
                    const key = `${order.drug}-${day}-08:00`;
                    const given = marStatus[key] === 'given';
                    return (
                      <td key={day} style={{ padding: '6px 4px', textAlign: 'center' }}>
                        <button
                          onClick={() => toggleStatus(order.drug, day, '08:00')}
                          style={{
                            width: 28, height: 28, borderRadius: 7,
                            background: given ? '#d1fae5' : '#f8fafc',
                            border: `1.5px solid ${given ? '#6ee7b7' : '#e2e8f0'}`,
                            color: given ? '#059669' : '#94a3b8',
                            cursor: 'pointer', fontSize: 12,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                          title={given ? 'Given — click to undo' : 'Mark as given'}
                        >
                          {given ? '✓' : '·'}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 12, padding: '10px 14px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #86efac', fontSize: 12, color: '#15803d', fontWeight: 600 }}>
          ✓ Click each cell to mark drug as administered. Full MAR logging with nurse initials + timestamp — Phase FE-4.3
        </div>
      </SectionCard>
    </div>
  );
}

// ─── Tab 3: Fluid Balance (Form 61) ──────────────────────────────────────────
function FluidTab() {
  const shifts = ['Morning (07:00–15:00)', 'Evening (15:00–23:00)', 'Night (23:00–07:00)'];
  const [intake, setIntake] = useState({ oral: '', iv: '', blood: '' });
  const [output, setOutput] = useState({ urine: '', aspirate: '', drain: '', stool: '' });

  const totalIn  = (parseFloat(intake.oral) || 0) + (parseFloat(intake.iv) || 0) + (parseFloat(intake.blood) || 0);
  const totalOut = (parseFloat(output.urine) || 0) + (parseFloat(output.aspirate) || 0) + (parseFloat(output.drain) || 0);
  const netBal   = totalIn - totalOut;

  return (
    <div>
      <SectionCard title="Form 61 — Daily 24h Fluid Balance Chart">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 16 }}>
          {/* Intake */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#0d9488', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Droplets size={14} /> INTAKE
            </div>
            <InputField label="Oral / RT Fluids" value={intake.oral}  onChange={v => setIntake(p => ({...p, oral: v}))}  type="number" unit="ml" placeholder="0" />
            <InputField label="IV Infusions"      value={intake.iv}    onChange={v => setIntake(p => ({...p, iv: v}))}    type="number" unit="ml" placeholder="0" />
            <InputField label="Blood Products"    value={intake.blood} onChange={v => setIntake(p => ({...p, blood: v}))} type="number" unit="ml" placeholder="0" />
            <div style={{ padding: '10px 14px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #86efac' }}>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Total Intake</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#0d9488', fontFamily: 'monospace' }}>{totalIn} ml</div>
            </div>
          </div>

          {/* Output */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#dc2626', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Droplets size={14} /> OUTPUT
            </div>
            <InputField label="Urine Output"        value={output.urine}    onChange={v => setOutput(p => ({...p, urine: v}))}    type="number" unit="ml" placeholder="0" />
            <InputField label="RT Aspirate / Vomit" value={output.aspirate} onChange={v => setOutput(p => ({...p, aspirate: v}))} type="number" unit="ml" placeholder="0" />
            <InputField label="Drain Output"        value={output.drain}    onChange={v => setOutput(p => ({...p, drain: v}))}    type="number" unit="ml" placeholder="0" />
            <div style={{ padding: '10px 14px', background: '#fff5f5', borderRadius: 8, border: '1px solid #fca5a5' }}>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Total Output</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#dc2626', fontFamily: 'monospace' }}>{totalOut} ml</div>
            </div>
          </div>
        </div>

        {/* Net Balance */}
        <div style={{
          padding: '16px 20px', borderRadius: 12,
          background: netBal >= 0 ? '#f0fdf4' : '#fff5f5',
          border: `2px solid ${netBal >= 0 ? '#86efac' : '#fca5a5'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#334155' }}>Net Fluid Balance</div>
          <div style={{ fontSize: 28, fontWeight: 900, fontFamily: 'monospace', color: netBal >= 0 ? '#16a34a' : '#dc2626' }}>
            {netBal >= 0 ? '+' : ''}{netBal} ml
          </div>
          <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>
            {netBal > 500 ? '⚠️ Positive overload' : netBal < -500 ? '⚠️ Fluid deficit' : '✓ Balanced'}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

// ─── Tab 4: Nursing & Care (Form 71 & 72) ─────────────────────────────────────────
function NursingTab() {
  // Form 71 State
  const [carePlan, setCarePlan] = useState({
    diagnosis: 'Acute Pain related to surgical incision / tissue injury',
    goal: 'Patient will report pain <= 3/10 within 1 hour; maintain SpO2 >= 95% on room air',
    interventions: {
      vitalsQ4H: true,
      analgesicSchedule: true,
      reposition2H: true,
      fluidChart: true,
      sideRailsUp: true,
      patientReassurance: false,
    },
    evaluation: 'Goal met. Pain reduced from 6/10 to 2/10. Patient resting comfortably in semi-fowler position.',
  });

  // Form 72 State
  const [shift, setShift] = useState('Morning');
  const [shiftVitals, setShiftVitals] = useState({
    sysBP: 126, diaBP: 82, pulse: 78, spo2: 98, tempF: 98.6, rr: 16
  });
  const [painScore, setPainScore] = useState(2);
  const [shiftNotes, setShiftNotes] = useState('Patient resting comfortably. Morning oral medications administered. IV cannula patent on left forearm without redness or extravasation. Clear urine output.');
  const [savedNotes, setSavedNotes] = useState(false);

  // Compute NEWS2 dynamically for the shift
  const tempC = ((shiftVitals.tempF - 32) * 5) / 9;
  let news2 = 0;
  if (shiftVitals.rr < 9 || shiftVitals.rr > 24) news2 += 3;
  else if (shiftVitals.rr >= 21) news2 += 2;
  else if (shiftVitals.rr <= 11) news2 += 1;

  if (shiftVitals.spo2 < 92) news2 += 3;
  else if (shiftVitals.spo2 <= 93) news2 += 2;
  else if (shiftVitals.spo2 <= 95) news2 += 1;

  if (tempC <= 35.0 || tempC >= 39.1) news2 += 3;
  else if (tempC <= 36.0 || tempC >= 38.1) news2 += 1;

  if (shiftVitals.sysBP <= 90 || shiftVitals.sysBP >= 220) news2 += 3;
  else if (shiftVitals.sysBP <= 100) news2 += 2;
  else if (shiftVitals.sysBP <= 110) news2 += 1;

  if (shiftVitals.pulse <= 40 || shiftVitals.pulse >= 131) news2 += 3;
  else if (shiftVitals.pulse >= 111) news2 += 2;
  else if (shiftVitals.pulse <= 50 || shiftVitals.pulse >= 91) news2 += 1;

  const news2Color = news2 >= 7 ? '#dc2626' : news2 >= 5 ? '#d97706' : '#10b981';
  const news2Bg    = news2 >= 7 ? '#fee2e2' : news2 >= 5 ? '#fef3c7' : '#f0fdf4';
  const news2Text  = news2 >= 7 ? 'HIGH RISK (NEWS2 >= 7)' : news2 >= 5 ? 'MEDIUM RISK (NEWS2 5-6)' : 'LOW RISK (NEWS2 0-4)';

  const handleSave = () => {
    setSavedNotes(true);
    setTimeout(() => setSavedNotes(false), 2000);
  };

  return (
    <div>
      {/* Form 71 — Nurse Care Plan */}
      <SectionCard title="Form 71 — Inpatient Nurse Care Plan">
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Nursing Diagnosis</label>
          <select
            value={carePlan.diagnosis}
            onChange={e => setCarePlan(c => ({ ...c, diagnosis: e.target.value }))}
            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 12.5, outline: 'none' }}
          >
            <option>Acute Pain related to surgical incision / tissue injury</option>
            <option>Ineffective Airway Clearance related to retained secretions</option>
            <option>Impaired Gas Exchange related to ventilation-perfusion mismatch</option>
            <option>Risk for Fall related to generalized weakness and sedative medications</option>
            <option>Fluid Volume Excess related to compromised regulatory mechanism</option>
            <option>Impaired Skin Integrity related to bed rest and reduced mobility</option>
            <option>Risk for Infection related to invasive lines and catheter</option>
          </select>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Expected Patient Goals &amp; Outcomes</label>
          <input
            type="text"
            value={carePlan.goal}
            onChange={e => setCarePlan(c => ({ ...c, goal: e.target.value }))}
            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 12.5, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Planned Nursing Interventions Checklist</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              ['vitalsQ4H', 'Monitor vital signs & SpO2 every 4 hours'],
              ['analgesicSchedule', 'Administer prescribed analgesics and monitor pain score'],
              ['reposition2H', 'Reposition patient every 2 hours and inspect pressure points'],
              ['fluidChart', 'Maintain strict 24-hour fluid intake & output ledger'],
              ['sideRailsUp', 'Keep bed side rails elevated and call bell within reach'],
              ['patientReassurance', 'Provide reassurance, patient education and relaxation cues'],
            ].map(([k, label]) => (
              <label key={k} style={{
                display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                padding: '8px 12px', borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0',
              }}>
                <input
                  type="checkbox"
                  checked={carePlan.interventions[k]}
                  onChange={e => setCarePlan(c => ({ ...c, interventions: { ...c.interventions, [k]: e.target.checked } }))}
                  style={{ accentColor: '#0d9488' }}
                />
                <span style={{ fontSize: 11.5, color: '#334155', fontWeight: 500 }}>{label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Care Plan Evaluation &amp; Progress</label>
          <textarea
            rows={2}
            value={carePlan.evaluation}
            onChange={e => setCarePlan(c => ({ ...c, evaluation: e.target.value }))}
            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 12.5, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
          />
        </div>
      </SectionCard>

      {/* Form 72 — Nurse Shift Progress Note & NEWS2 Early Warning */}
      <SectionCard title="Form 72 — Nurse Shift Progress Notes & NEWS2 Monitor">
        {/* Active shift buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>Active Shift:</span>
          {['Morning (07:00–15:00)', 'Evening (15:00–23:00)', 'Night (23:00–07:00)'].map(s => {
            const id = s.split(' ')[0];
            return (
              <button
                key={id}
                onClick={() => setShift(id)}
                style={{
                  padding: '5px 12px', borderRadius: 8, fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
                  border: `1.5px solid ${shift === id ? '#0d9488' : '#e2e8f0'}`,
                  background: shift === id ? '#f0fdfa' : '#fff',
                  color: shift === id ? '#0d9488' : '#64748b',
                }}
              >
                {s}
              </button>
            );
          })}
        </div>

        {/* Shift Vitals & Live NEWS2 Score */}
        <div style={{ marginBottom: 16, padding: '14px', borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#0f172a' }}>
              📊 Shift Vitals &amp; NEWS2 Calculator
            </div>
            <span style={{
              padding: '3px 12px', borderRadius: 20, fontSize: 11, fontWeight: 800,
              background: news2Bg, color: news2Color, border: `1px solid ${news2Color}40`,
            }}>
              NEWS2 Score: {news2} — {news2Text}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
            {[
              ['Systolic BP', shiftVitals.sysBP, 'sysBP', 'mmHg'],
              ['Pulse Rate', shiftVitals.pulse, 'pulse', 'bpm'],
              ['SpO₂', shiftVitals.spo2, 'spo2', '%'],
              ['Temp (°F)', shiftVitals.tempF, 'tempF', '°F'],
              ['Resp Rate', shiftVitals.rr, 'rr', '/min'],
            ].map(([lbl, val, key, u]) => (
              <div key={key} style={{ background: '#fff', padding: '6px 10px', borderRadius: 8, border: '1px solid #cbd5e1' }}>
                <span style={{ fontSize: 9.5, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 2 }}>{lbl}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <input
                    type="number"
                    value={val}
                    onChange={e => setShiftVitals(v => ({ ...v, [key]: Number(e.target.value) }))}
                    style={{ width: '100%', border: 'none', outline: 'none', fontSize: 13, fontWeight: 800, color: '#0f172a' }}
                  />
                  <span style={{ fontSize: 10, color: '#94a3b8' }}>{u}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pain Scale */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 8 }}>
            Wong-Baker Facial Pain Scale (0 = No pain, 10 = Worst pain)
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            {[0,1,2,3,4,5,6,7,8,9,10].map(s => (
              <button
                key={s}
                onClick={() => setPainScore(s)}
                style={{
                  width: 34, height: 34, borderRadius: 8, fontWeight: 800, fontSize: 12.5,
                  border: `2px solid ${painScore === s ? '#0d9488' : '#e2e8f0'}`,
                  background: painScore === s ? '#0d9488' : s >= 7 ? '#fff5f5' : '#f8fafc',
                  color: painScore === s ? '#fff' : s >= 7 ? '#dc2626' : '#334155',
                  cursor: 'pointer',
                }}
              >
                {s}
              </button>
            ))}
            <span style={{
              marginLeft: 8, padding: '4px 12px', borderRadius: 8, fontSize: 11.5, fontWeight: 700,
              background: painScore >= 7 ? '#fee2e2' : painScore >= 4 ? '#fef3c7' : '#f0fdf4',
              color: painScore >= 7 ? '#dc2626' : painScore >= 4 ? '#d97706' : '#16a34a',
            }}>
              {painScore >= 7 ? 'SEVERE PAIN' : painScore >= 4 ? 'MODERATE PAIN' : 'MILD / NO PAIN'} — Score {painScore}
            </span>
          </div>
        </div>

        {/* Shift Notes */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Shift Narrative Observations</label>
          <textarea
            rows={4}
            value={shiftNotes}
            onChange={e => setShiftNotes(e.target.value)}
            placeholder="Patient condition, interventions performed, responses observed, pending tasks..."
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 12.5, resize: 'vertical', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
            onFocus={e => e.target.style.borderColor = '#0d9488'}
            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
          />
        </div>

        {/* Nursing checklist */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
          {['Vitals recorded in chart', 'Medications administered & signed in MAR', 'IV line patent & site inspected', 'Pressure area care & repositioning done', 'Fluid balance balance documented', 'Patient orientation & safety confirmed'].map((item, i) => (
            <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '6px 10px', borderRadius: 7, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <input type="checkbox" defaultChecked style={{ accentColor: '#0d9488' }} />
              <span style={{ fontSize: 11.5, color: '#334155', fontWeight: 500 }}>{item}</span>
            </label>
          ))}
        </div>

        <button
          onClick={handleSave}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '9px 20px', borderRadius: 8,
            border: 'none', cursor: 'pointer', background: savedNotes ? '#10b981' : 'linear-gradient(135deg,#0d9488,#0f766e)',
            color: '#fff', fontSize: 12.5, fontWeight: 700, transition: 'background 0.2s',
          }}
        >
          {savedNotes ? <CheckCircle2 size={14} /> : <Save size={14} />}
          {savedNotes ? 'Shift Record Saved!' : 'Save Shift Record'}
        </button>
      </SectionCard>
    </div>
  );
}

// ─── Tab 5: Surgical & OT ────────────────────────────────────────────────────
function SurgicalOTTab() {
  const [pa, setPaState] = useState({
    mallampati: '', asa: '', npoHours: '', looseTeeth: false, dentures: false, riskAck: false,
  });
  const [otChecklist, setOTChecklist] = useState({
    siteMarking: false, jewellery: false, dentures2: false, voiding: false,
    consentVerified: false, crossmatch: false, siteConfirmed: false,
  });
  const [opNotes, setOpNotes] = useState({
    preOpNote: '', procedure: '', intraOpFindings: '', swabCount: false, postOpOrders: '',
  });

  const setPa = (k, v) => setPaState(p => ({ ...p, [k]: v }));
  const setOT = (k, v) => setOTChecklist(p => ({ ...p, [k]: v }));
  const setOp = (k, v) => setOpNotes(p => ({ ...p, [k]: v }));

  const mallampatiOpts = [
    { value: 'I',   label: 'Class I — Full visibility of tonsils, uvula, soft palate' },
    { value: 'II',  label: 'Class II — Partial visibility, upper tonsils obscured' },
    { value: 'III', label: 'Class III — Soft + hard palate visible, base of uvula only' },
    { value: 'IV',  label: 'Class IV — Only hard palate visible' },
  ];
  const asaOpts = [
    { value: 'I',   label: 'ASA I — Normal healthy patient' },
    { value: 'II',  label: 'ASA II — Mild systemic disease' },
    { value: 'III', label: 'ASA III — Severe systemic disease' },
    { value: 'IV',  label: 'ASA IV — Life-threatening systemic disease' },
    { value: 'V',   label: 'ASA V — Moribund, not expected to survive without surgery' },
    { value: 'VI',  label: 'ASA VI — Brain-dead, organ donation' },
  ];

  const radioGroup = (name, value, opts, setter, color) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
      {opts.map(o => (
        <label key={o.value} style={{
          display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer',
          padding: '7px 12px', borderRadius: 8,
          border: `1.5px solid ${value === o.value ? color : '#e2e8f0'}`,
          background: value === o.value ? `${color}12` : '#fff',
          fontSize: 11.5, fontWeight: value === o.value ? 700 : 500,
          color: value === o.value ? color : '#334155',
        }}>
          <input type="radio" name={name} value={o.value} checked={value === o.value}
            onChange={() => setter(o.value)} style={{ accentColor: color, marginTop: 1 }} />
          {o.label}
        </label>
      ))}
    </div>
  );

  const checkItem = (label, checked, onChange) => (
    <label style={{
      display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
      padding: '9px 14px', borderRadius: 9,
      border: `1.5px solid ${checked ? '#10b981' : '#e2e8f0'}`,
      background: checked ? '#f0fdf4' : '#fff',
    }}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
        style={{ accentColor: '#10b981', width: 16, height: 16 }} />
      <span style={{ fontSize: 12, fontWeight: checked ? 700 : 500, color: checked ? '#065f46' : '#334155' }}>
        {label}
      </span>
    </label>
  );

  const textArea = (label, val, setter, placeholder) => (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 5 }}>{label}</label>
      <textarea value={val} onChange={e => setter(e.target.value)} placeholder={placeholder}
        style={{ width: '100%', minHeight: 90, padding: '9px 12px', borderRadius: 9, border: '1.5px solid #e2e8f0',
          background: '#fff', fontSize: 12, color: '#0f172a', resize: 'vertical',
          fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }} />
    </div>
  );

  return (
    <div>
      <SectionCard title="📋 Form 15 / 151 — Pre-Anaesthesia Assessment">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Mallampati Airway Classification</div>
            {radioGroup('mallampati', pa.mallampati, mallampatiOpts, v => setPa('mallampati', v), '#6d28d9')}
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 4 }}>ASA Physical Status Grade</div>
            {radioGroup('asa', pa.asa, asaOpts, v => setPa('asa', v), '#0077b6')}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 5 }}>NPO Hours (fasting)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="number" value={pa.npoHours} onChange={e => setPa('npoHours', e.target.value)}
                min="0" max="24" placeholder="6"
                style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 12.5, outline: 'none' }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>hrs</span>
            </div>
          </div>
          <div style={{ marginTop: 18 }}>{checkItem('Loose teeth present', pa.looseTeeth, v => setPa('looseTeeth', v))}</div>
          <div style={{ marginTop: 18 }}>{checkItem('Dentures / prosthetics', pa.dentures, v => setPa('dentures', v))}</div>
        </div>

        <div style={{ marginTop: 14 }}>
          {checkItem('✅ Patient / guardian acknowledges anaesthetic risk and consents to procedure', pa.riskAck, v => setPa('riskAck', v))}
        </div>
      </SectionCard>

      <SectionCard title="✅ Form 54 — Preoperative OT Nursing Checklist">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {checkItem('Surgical site clearly marked by surgeon', otChecklist.siteMarking, v => setOT('siteMarking', v))}
          {checkItem('All jewellery / metal objects removed', otChecklist.jewellery, v => setOT('jewellery', v))}
          {checkItem('Dentures / prosthetics removed', otChecklist.dentures2, v => setOT('dentures2', v))}
          {checkItem('Preoperative voiding confirmed', otChecklist.voiding, v => setOT('voiding', v))}
          {checkItem('Consent form verified and signed', otChecklist.consentVerified, v => setOT('consentVerified', v))}
          {checkItem('Blood units crossmatched & arranged', otChecklist.crossmatch, v => setOT('crossmatch', v))}
          {checkItem('Operative site confirmed verbally with patient', otChecklist.siteConfirmed, v => setOT('siteConfirmed', v))}
        </div>
      </SectionCard>

      <SectionCard title="🔪 Operative Notes">
        {textArea('Surgeon Pre-Op Note', opNotes.preOpNote, v => setOp('preOpNote', v), 'Planned procedure, relevant history, patient positioning...')}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 5 }}>Procedure Performed</label>
          <input type="text" value={opNotes.procedure} onChange={e => setOp('procedure', e.target.value)}
            placeholder="e.g. Laparoscopic Appendectomy"
            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 12.5, boxSizing: 'border-box', outline: 'none' }} />
        </div>
        {textArea('Intraoperative Findings', opNotes.intraOpFindings, v => setOp('intraOpFindings', v), 'Findings, complications, blood loss...')}
        <div style={{ marginBottom: 14 }}>
          {checkItem('✅ Gauze / Swab Count verified and correct', opNotes.swabCount, v => setOp('swabCount', v))}
        </div>
        {textArea('Post-Op Recovery Orders', opNotes.postOpOrders, v => setOp('postOpOrders', v), 'Vitals frequency, pain management, diet, activity restrictions...')}
        <button style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '9px 20px', borderRadius: 9,
          border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#6d28d9,#5b21b6)',
          color: '#fff', fontSize: 12.5, fontWeight: 700,
        }}>
          💾 Save OT Record
        </button>
      </SectionCard>
    </div>
  );
}

// ─── Tab 6: Handovers & Transfers ─────────────────────────────────────────────
function HandoverTab() {
  const [sbar, setSbar] = useState({ situation: '', background: '', assessment: '', recommendation: '' });
  const [pendingTests, setPendingTests] = useState([
    { id: 1, test: 'CBC',    ordered: '2026-10-30', status: 'Pending'    },
    { id: 2, test: 'LFT',    ordered: '2026-10-30', status: 'Processing' },
  ]);
  const [transfer, setTransfer] = useState({
    ivAccessVerified: false, transportVitals: false, familyInformed: false,
    medicationsHanded: false, notesTransferred: false,
    destinationWard: '', transportVitalsBP: '', transportVitalsPulse: '',
  });
  const [newTest, setNewTest] = useState('');

  const setSBAR = (k, v) => setSbar(s => ({ ...s, [k]: v }));
  const setT = (k, v) => setTransfer(t => ({ ...t, [k]: v }));

  const statusColor = (s) => s === 'Done' ? '#10b981' : s === 'Processing' ? '#d97706' : '#64748b';
  const statusBg    = (s) => s === 'Done' ? '#f0fdf4' : s === 'Processing' ? '#fffbeb' : '#f8fafc';

  const sbarSection = (label, key, placeholder, color) => (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 11.5, fontWeight: 800, color, marginBottom: 6 }}>{label}</label>
      <textarea value={sbar[key]} onChange={e => setSBAR(key, e.target.value)} placeholder={placeholder}
        style={{ width: '100%', minHeight: 80, padding: '9px 12px', borderRadius: 9,
          border: `1.5px solid ${color}40`, background: `${color}08`,
          fontSize: 12, color: '#0f172a', resize: 'vertical',
          fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }} />
    </div>
  );

  return (
    <div>
      <SectionCard title="📞 SBAR — Structured Clinical Handover">
        <div style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 11.5, color: '#64748b' }}>
          Standardized communication framework for clinical handovers: Situation → Background → Assessment → Recommendation
        </div>
        {sbarSection('S — Situation (What is happening right now?)',   'situation',      'State the patient name, bed, current concern...', '#0077b6')}
        {sbarSection('B — Background (Clinical context)',              'background',     'Relevant history, admission diagnosis, key investigations, medications...', '#6d28d9')}
        {sbarSection('A — Assessment (Your clinical assessment)',      'assessment',     'Your judgment of the current situation, relevant vitals, NEWS2 score...', '#d97706')}
        {sbarSection('R — Recommendation (What action is needed?)',   'recommendation', 'What do you need from the receiving team? Orders, reviews, escalation...', '#dc2626')}
        <button style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '9px 20px', borderRadius: 9,
          border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#0077b6,#0369a1)',
          color: '#fff', fontSize: 12.5, fontWeight: 700,
        }}>
          📋 Sign &amp; Submit Handover
        </button>
      </SectionCard>

      <SectionCard title="🔬 Pending Investigations Tracker">
        <div style={{ marginBottom: 12, display: 'flex', gap: 8 }}>
          <input type="text" value={newTest} onChange={e => setNewTest(e.target.value)}
            placeholder="Add test name..."
            style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 12.5, outline: 'none' }} />
          <button
            onClick={() => {
              if (newTest.trim()) {
                setPendingTests(t => [...t, { id: Date.now(), test: newTest.trim(), ordered: new Date().toISOString().slice(0,10), status: 'Pending' }]);
                setNewTest('');
              }
            }}
            style={{ padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', background: '#0d9488', color: '#fff', fontSize: 12, fontWeight: 700 }}
          >
            + Add
          </button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
              {['Test Name', 'Ordered Date', 'Status', 'Action'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '6px 10px', fontSize: 11, fontWeight: 700, color: '#64748b' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pendingTests.map(row => (
              <tr key={row.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '8px 10px', fontWeight: 600, color: '#0f172a' }}>{row.test}</td>
                <td style={{ padding: '8px 10px', color: '#64748b' }}>{row.ordered}</td>
                <td style={{ padding: '8px 10px' }}>
                  <select value={row.status}
                    onChange={e => setPendingTests(t => t.map(x => x.id === row.id ? { ...x, status: e.target.value } : x))}
                    style={{ padding: '4px 8px', borderRadius: 6, border: `1.5px solid ${statusColor(row.status)}40`,
                      background: statusBg(row.status), color: statusColor(row.status), fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                    {['Pending','Processing','Done','Cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td style={{ padding: '8px 10px' }}>
                  <button onClick={() => setPendingTests(t => t.filter(x => x.id !== row.id))}
                    style={{ padding: '3px 10px', borderRadius: 6, border: '1px solid #fca5a5', background: '#fff', color: '#dc2626', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>

      <SectionCard title="🚑 Department Transfer Checklist">
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 5 }}>Destination Ward / Unit</label>
          <select value={transfer.destinationWard} onChange={e => setT('destinationWard', e.target.value)}
            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 12.5, outline: 'none' }}>
            <option value="">— Select destination —</option>
            {['ICU','HDU','OT','PACU','General Ward Male','General Ward Female','Semi-Private Ward','Private Room'].map(w => (
              <option key={w} value={w}>{w}</option>
            ))}
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 5 }}>Transport BP (mmHg)</label>
            <input type="text" value={transfer.transportVitalsBP} onChange={e => setT('transportVitalsBP', e.target.value)}
              placeholder="120/80" style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 12.5, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 5 }}>Transport Pulse (bpm)</label>
            <input type="number" value={transfer.transportVitalsPulse} onChange={e => setT('transportVitalsPulse', e.target.value)}
              placeholder="82" style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 12.5, outline: 'none', boxSizing: 'border-box' }} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            ['ivAccessVerified', 'IV access patent & site verified'],
            ['transportVitals',  'Transport vitals recorded above'],
            ['familyInformed',   'Family / next of kin informed'],
            ['medicationsHanded','Medications & infusions handed over'],
            ['notesTransferred', 'Clinical notes & investigation reports transferred'],
          ].map(([k, label]) => (
            <label key={k} style={{
              display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
              padding: '9px 14px', borderRadius: 9,
              border: `1.5px solid ${transfer[k] ? '#10b981' : '#e2e8f0'}`,
              background: transfer[k] ? '#f0fdf4' : '#fff',
            }}>
              <input type="checkbox" checked={!!transfer[k]} onChange={e => setT(k, e.target.checked)}
                style={{ accentColor: '#10b981', width: 16, height: 16 }} />
              <span style={{ fontSize: 12, fontWeight: transfer[k] ? 700 : 500, color: transfer[k] ? '#065f46' : '#334155' }}>
                {label}
              </span>
            </label>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

// ─── Tab 7: Discharge & Feedback ──────────────────────────────────────────────
function DischargeTab({ admission }) {
  const navigate = useNavigate();
  const [condition, setCondition] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [meds, setMeds] = useState([
    { id: 1, drug: 'Tab. Amoxicillin 500mg', dose: '500mg', freq: '3x/day', duration: '5 days', instructions: 'After food' },
  ]);
  const [newMed, setNewMed] = useState({ drug: '', dose: '', freq: '', duration: '', instructions: '' });
  const [ratings, setRatings] = useState({ nursing: 0, doctor: 0, cleanliness: 0, billing: 0 });
  const [submitted, setSubmitted] = useState(false);

  const CONDITIONS  = ['STABLE','IMPROVED','RELIEVED','LAMA','EXPIRED','TRANSFERRED'];
  const condColor   = { STABLE: '#10b981', IMPROVED: '#0077b6', RELIEVED: '#6d28d9', LAMA: '#d97706', EXPIRED: '#64748b', TRANSFERRED: '#0d9488' };
  const condBg      = { STABLE: '#f0fdf4', IMPROVED: '#eff6ff', RELIEVED: '#f5f3ff', LAMA: '#fffbeb', EXPIRED: '#f8fafc', TRANSFERRED: '#f0fdfa' };

  const addMed = () => {
    if (newMed.drug.trim()) {
      setMeds(m => [...m, { ...newMed, id: Date.now() }]);
      setNewMed({ drug: '', dose: '', freq: '', duration: '', instructions: '' });
    }
  };

  const StarRating = ({ category, label }) => (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 6 }}>{label}</div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 4 }}>
        {[1,2,3,4,5].map(s => (
          <button key={s} onClick={() => setRatings(r => ({ ...r, [category]: s }))}
            style={{
              fontSize: 20, background: 'none', border: 'none', cursor: 'pointer',
              transition: 'transform 0.1s',
              transform: ratings[category] >= s ? 'scale(1.2)' : 'scale(1)',
              filter: ratings[category] >= s ? 'none' : 'grayscale(1) opacity(0.4)',
            }}>
            ⭐
          </button>
        ))}
      </div>
      <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 3 }}>
        {['','Poor','Fair','Good','Very Good','Excellent'][ratings[category]] || 'Not rated'}
      </div>
    </div>
  );

  return (
    <div>
      <SectionCard title="🏥 Patient Condition at Discharge">
        <div style={{ fontSize: 11.5, color: '#64748b', marginBottom: 12 }}>
          Select the clinical condition at the time of discharge:
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {CONDITIONS.map(c => (
            <button key={c} onClick={() => setCondition(c)} style={{
              padding: '10px 22px', borderRadius: 10, cursor: 'pointer', fontWeight: 800, fontSize: 13,
              border: `2px solid ${condition === c ? condColor[c] : '#e2e8f0'}`,
              background: condition === c ? condBg[c] : '#fff',
              color: condition === c ? condColor[c] : '#94a3b8',
              transition: 'all 0.15s',
            }}>
              {c}
            </button>
          ))}
        </div>
        {condition && (
          <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 9,
            background: condBg[condition], border: `1.5px solid ${condColor[condition]}40` }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: condColor[condition] }}>Selected: {condition}</span>
          </div>
        )}
      </SectionCard>

      <SectionCard title="💊 Discharge Medications">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 14 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
              {['Drug & Strength','Dose','Frequency','Duration','Instructions',''].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '6px 8px', fontSize: 10.5, fontWeight: 700, color: '#64748b' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {meds.map(m => (
              <tr key={m.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '8px 8px', fontWeight: 600, color: '#0f172a' }}>{m.drug}</td>
                <td style={{ padding: '8px 8px', color: '#334155' }}>{m.dose}</td>
                <td style={{ padding: '8px 8px', color: '#334155' }}>{m.freq}</td>
                <td style={{ padding: '8px 8px', color: '#334155' }}>{m.duration}</td>
                <td style={{ padding: '8px 8px', color: '#64748b', fontStyle: 'italic' }}>{m.instructions}</td>
                <td style={{ padding: '8px 8px' }}>
                  <button onClick={() => setMeds(ms => ms.filter(x => x.id !== m.id))}
                    style={{ padding: '2px 8px', borderRadius: 5, border: '1px solid #fca5a5', background: '#fff', color: '#dc2626', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 2fr auto', gap: 8, alignItems: 'end' }}>
          {[
            ['drug','Drug & Strength','Tab. Paracetamol 500mg'],
            ['dose','Dose','500mg'],
            ['freq','Frequency','2x/day'],
            ['duration','Duration','5 days'],
            ['instructions','Instructions','After food'],
          ].map(([k, lbl, ph]) => (
            <div key={k}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>{lbl}</label>
              <input type="text" value={newMed[k]} onChange={e => setNewMed(m => ({ ...m, [k]: e.target.value }))}
                placeholder={ph}
                style={{ width: '100%', padding: '7px 9px', borderRadius: 7, border: '1.5px solid #e2e8f0', fontSize: 11.5, outline: 'none', boxSizing: 'border-box' }} />
            </div>
          ))}
          <button onClick={addMed}
            style={{ padding: '7px 14px', borderRadius: 7, border: 'none', background: '#0d9488', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', alignSelf: 'end' }}>
            + Add
          </button>
        </div>
      </SectionCard>

      <SectionCard title="📅 Follow-up Appointment">
        <div style={{ maxWidth: 280 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Follow-up Date</label>
          <input type="date" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)}
            style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
          {followUpDate && (
            <div style={{ marginTop: 8, fontSize: 12, color: '#0d9488', fontWeight: 700 }}>
              📅 {new Date(followUpDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          )}
        </div>
      </SectionCard>

      <SectionCard title="⭐ Patient Experience Feedback">
        {submitted ? (
          <div style={{ textAlign: 'center', padding: '32px 20px' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🙏</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#10b981', marginBottom: 6 }}>Thank you for your feedback!</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>Your response has been recorded anonymously.</div>
          </div>
        ) : (
          <>
            <div style={{ background: '#f8fafc', borderRadius: 9, padding: '10px 14px', marginBottom: 16, fontSize: 11.5, color: '#64748b' }}>
              📝 Feedback is <strong>optional and anonymous</strong> — આ સ્વૈચ્છિક અને ગુપ્ત છે
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <StarRating category="nursing"     label="👩‍⚕️ Nursing Responsiveness" />
              <StarRating category="doctor"      label="🩺 Doctor Explanation & Care" />
              <StarRating category="cleanliness" label="🧹 Ward Cleanliness" />
              <StarRating category="billing"     label="💰 Billing Transparency" />
            </div>
            <button onClick={() => setSubmitted(true)} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '10px 24px', borderRadius: 9,
              border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg,#d97706,#b45309)', color: '#fff', fontSize: 13, fontWeight: 700,
            }}>
              ⭐ Submit Feedback
            </button>
          </>
        )}
      </SectionCard>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
        <button
          onClick={() => navigate(`/ipd/admissions/${admission?.id || 'ADM-2026-001'}/discharge`)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 10,
            border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg,#0077b6,#0284c7)', color: '#fff', fontSize: 13, fontWeight: 800,
          }}
        >
          📄 Generate Discharge Summary
        </button>
        <button
          onClick={() => navigate(`/billing/ipd-settlement/${admission?.id || 'ADM-2026-001'}`)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 10,
            border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg,#d97706,#b45309)', color: '#fff', fontSize: 13, fontWeight: 800,
          }}
        >
          💰 Proceed to IPD Settlement
        </button>
      </div>
    </div>
  );
}

// ─── Main InpatientFolioPage ──────────────────────────────────────────────────
export default function InpatientFolioPage({ admission, onBack }) {
  const [activeTab, setActiveTab] = useState('intake');
  const p = admission?.patient || {};
  const bed = admission?.bed || {};

  return (
    <div style={{ background: '#f8fafc', minHeight: '100%' }}>
      {/* Patient Banner */}
      <div style={{
        background: '#fff', borderBottom: '1px solid #e2e8f0',
        padding: '14px 20px', position: 'sticky', top: 0, zIndex: 10,
      }}>
        {/* Back + patient info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <button
            onClick={onBack}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 8,
              background: '#f1f5f9', border: '1px solid #e2e8f0',
              color: '#334155', fontSize: 12, fontWeight: 700, cursor: 'pointer',
            }}
          >
            <ArrowLeft size={14} /> Back to Matrix
          </button>

          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'linear-gradient(135deg,#0d9488,#0f766e)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 14, fontWeight: 800,
            }}>
              {(p.name || 'P').charAt(0)}
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 900, color: '#0f172a' }}>{p.name || 'Patient Name'}</div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>
                {p.uhid || 'BS-XXXXXX'} • {bed.id || 'BED-XXX'} • {bed.wardName || 'Ward'} • Day {p.admDay || 1}
              </div>
            </div>
          </div>

          {/* Quick stat badges */}
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{ padding: '4px 10px', borderRadius: 7, background: '#f0fdf4', border: '1px solid #86efac', fontSize: 11, fontWeight: 700, color: '#15803d' }}>
              {p.doc || 'Dr. Sharma'}
            </span>
            <span style={{ padding: '4px 10px', borderRadius: 7, background: '#ede9fe', border: '1px solid #c4b5fd', fontSize: 11, fontWeight: 700, color: '#6d28d9' }}>
              IPD-{Math.floor(10000 + Math.random() * 89999)}
            </span>
            <button
              onClick={() => window.print()}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '4px 12px', borderRadius: 7,
                background: '#fff', border: '1.5px solid #e2e8f0',
                color: '#334155', fontSize: 11, fontWeight: 700, cursor: 'pointer',
              }}
            >
              🖨️ Print Face Sheet
            </button>
            {p.news2 >= 7 && (
              <span style={{ padding: '4px 10px', borderRadius: 7, background: '#fee2e2', border: '1px solid #fca5a5', fontSize: 11, fontWeight: 700, color: '#dc2626', display: 'flex', alignItems: 'center', gap: 4 }}>
                <AlertTriangle size={11} /> CRITICAL NEWS2: {p.news2}
              </span>
            )}
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 4, overflowX: 'auto' }}>
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 14px', borderRadius: 8, whiteSpace: 'nowrap',
                  border: isActive ? '1.5px solid #0d9488' : '1.5px solid transparent',
                  background: isActive ? '#f0fdfa' : 'transparent',
                  color: isActive ? '#0d9488' : '#64748b',
                  fontWeight: isActive ? 800 : 600, fontSize: 12, cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#f8fafc'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
              >
                <Icon size={13} strokeWidth={isActive ? 2.5 : 2} />
                {tab.shortLabel}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div style={{ padding: '20px 20px' }}>
        {activeTab === 'intake'    && <IntakeTab admission={admission} />}
        {activeTab === 'mar'       && <MARTab />}
        {activeTab === 'fluid'     && <FluidTab />}
        {activeTab === 'nursing'   && <NursingTab />}

        {/* Remaining tabs — Phase FE-4 placeholders */}
        {activeTab === 'surgical'  && <SurgicalOTTab />}
        {activeTab === 'handover'  && <HandoverTab />}
        {activeTab === 'discharge' && <DischargeTab admission={admission} />}
      </div>
    </div>
  );
}

