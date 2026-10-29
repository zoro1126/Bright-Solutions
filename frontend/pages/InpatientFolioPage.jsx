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
        <InputField label="Provisional Diagnosis" placeholder="ICD-10 code or description" />
        <InputField label="Allergies" placeholder="Drug / food allergies (NKDA if none)" />
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

// ─── Tab 4: Nursing & Care (Form 72) ─────────────────────────────────────────
function NursingTab() {
  const [painScore, setPainScore] = useState(0);
  const [shiftNotes, setShiftNotes] = useState('');

  return (
    <div>
      <SectionCard title="Form 72 — Nurse Shift Progress Note">
        {/* Pain Scale */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 10 }}>
            Wong-Baker Pain Scale (0 = No pain, 10 = Worst pain)
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {[0,1,2,3,4,5,6,7,8,9,10].map(s => (
              <button
                key={s}
                onClick={() => setPainScore(s)}
                style={{
                  width: 36, height: 36, borderRadius: 8, fontWeight: 800, fontSize: 13,
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
              marginLeft: 8, padding: '4px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700,
              background: painScore >= 7 ? '#fee2e2' : painScore >= 4 ? '#fef3c7' : '#f0fdf4',
              color: painScore >= 7 ? '#dc2626' : painScore >= 4 ? '#d97706' : '#16a34a',
            }}>
              {painScore >= 7 ? 'SEVERE' : painScore >= 4 ? 'MODERATE' : 'MILD / NONE'} — Score {painScore}
            </span>
          </div>
        </div>

        {/* Shift Notes */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Shift Narrative Notes</label>
          <textarea
            rows={5}
            value={shiftNotes}
            onChange={e => setShiftNotes(e.target.value)}
            placeholder="Patient condition, interventions performed, responses observed, pending tasks..."
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 13, resize: 'vertical', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
            onFocus={e => e.target.style.borderColor = '#0d9488'}
            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
          />
        </div>

        {/* Nursing checklist */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {['Vitals recorded', 'Medications administered', 'IV line patent & site checked', 'Pressure area care done', 'Fluid balance documented', 'Patient repositioned (2-hourly)'].map((item, i) => (
            <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '6px 10px', borderRadius: 7, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <input type="checkbox" style={{ accentColor: '#0d9488' }} />
              <span style={{ fontSize: 12, color: '#334155', fontWeight: 500 }}>{item}</span>
            </label>
          ))}
        </div>
      </SectionCard>
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
        {['surgical', 'handover', 'discharge'].includes(activeTab) && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 360, gap: 16, color: '#64748b' }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: '#f1f5f9', border: '1.5px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {activeTab === 'surgical'  && <Scissors size={26} color="#6d28d9" strokeWidth={1.5} />}
              {activeTab === 'handover'  && <ArrowRightLeft size={26} color="#0d9488" strokeWidth={1.5} />}
              {activeTab === 'discharge' && <LogOut size={26} color="#d97706" strokeWidth={1.5} />}
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                {TABS.find(t => t.id === activeTab)?.label}
              </div>
              <div style={{ fontSize: 13, color: '#94a3b8' }}>Coming in Phase FE-4</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

