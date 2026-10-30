/**
 * DischargeSummaryPage.jsx — TASK FE-5.1
 * Clinical Discharge Summary page.
 * Route: /ipd/admissions/:id/discharge
 * Accessed from IPD Folio → Discharge tab or Discharge Queue
 */
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import {
  ArrowLeft, FileText, CheckCircle2, Printer,
  AlertTriangle, Save, Calendar, Pill, Stethoscope,
} from 'lucide-react';

// Mock admission (replace with API call in production)
const MOCK_ADMISSION = {
  id: 'ADM-2026-001',
  patient: { name: 'Arjun Singh', uhid: 'BS-001005', age: 45, gender: 'Male', blood: 'B+' },
  bed: 'BED-105', ward: 'GWM-A', doctor: 'Dr. Mehta',
  admDate: '2026-10-26', days: 4,
  diagnosis: 'Hypertensive Crisis with target organ damage',
};

const CONDITIONS = ['STABLE','IMPROVED','RELIEVED','LAMA','EXPIRED','TRANSFERRED'];
const condColor = { STABLE:'#10b981', IMPROVED:'#0077b6', RELIEVED:'#6d28d9', LAMA:'#d97706', EXPIRED:'#64748b', TRANSFERRED:'#0d9488' };
const condBg    = { STABLE:'#f0fdf4', IMPROVED:'#eff6ff', RELIEVED:'#f5f3ff', LAMA:'#fffbeb', EXPIRED:'#f8fafc', TRANSFERRED:'#f0fdfa' };

function SectionCard({ title, children }) {
  return (
    <div style={{ background:'#fff', borderRadius:12, border:'1px solid #e2e8f0', marginBottom:16, overflow:'hidden' }}>
      <div style={{ padding:'12px 18px', borderBottom:'1px solid #f1f5f9', background:'#f8fafc' }}>
        <span style={{ fontSize:13, fontWeight:800, color:'#0f172a' }}>{title}</span>
      </div>
      <div style={{ padding:'16px 18px' }}>{children}</div>
    </div>
  );
}

export default function DischargeSummaryPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const adm = MOCK_ADMISSION;

  const [condition, setCondition] = useState('');
  const [course, setCourse] = useState('');
  const [finalDiagnosis, setFinalDiagnosis] = useState(adm.diagnosis);
  const [procedures, setProcedures] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [meds, setMeds] = useState([
    { id:1, drug:'Tab. Amlodipine 5mg', dose:'5mg', freq:'OD', duration:'30 days', instructions:'Morning after food' },
    { id:2, drug:'Tab. Losartan 50mg',  dose:'50mg', freq:'OD', duration:'30 days', instructions:'Morning after food' },
  ]);
  const [newMed, setNewMed] = useState({ drug:'', dose:'', freq:'', duration:'', instructions:'' });
  const [signed, setSigned] = useState(false);

  const addMed = () => {
    if (newMed.drug.trim()) {
      setMeds(m => [...m, { ...newMed, id: Date.now() }]);
      setNewMed({ drug:'', dose:'', freq:'', duration:'', instructions:'' });
    }
  };

  const handleSign = () => {
    if (!condition) { alert('Please select discharge condition.'); return; }
    if (!finalDiagnosis) { alert('Please enter final diagnosis.'); return; }
    setSigned(true);
  };

  const inputStyle = {
    width:'100%', padding:'9px 12px', borderRadius:9, border:'1.5px solid #e2e8f0',
    fontSize:12.5, outline:'none', boxSizing:'border-box', fontFamily:'inherit',
  };

  return (
    <div style={{ minHeight:'100vh', background:'#f8fafc', display:'flex', flexDirection:'column' }}>
      <Navbar dept="IPD" currentRole="doctor" onLogout={() => navigate('/login')} />

      <div style={{ maxWidth:900, margin:'0 auto', padding:'24px 20px', width:'100%', boxSizing:'border-box' }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
          <button onClick={() => navigate(-1)} style={{
            display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:9,
            background:'#fff', border:'1.5px solid #e2e8f0', color:'#334155', fontSize:12, fontWeight:700, cursor:'pointer',
          }}>
            <ArrowLeft size={14} /> Back
          </button>
          <div>
            <div style={{ fontSize:20, fontWeight:900, color:'#0f172a' }}>Clinical Discharge Summary</div>
            <div style={{ fontSize:12, color:'#64748b' }}>{adm.patient.name} • {adm.patient.uhid} • {adm.bed} • Day {adm.days}</div>
          </div>
          {signed && (
            <span style={{ marginLeft:'auto', padding:'6px 14px', borderRadius:9,
              background:'#f0fdf4', border:'1.5px solid #86efac', color:'#15803d', fontSize:12, fontWeight:800,
              display:'flex', alignItems:'center', gap:6 }}>
              <CheckCircle2 size={14} /> SIGNED & LOCKED
            </span>
          )}
        </div>

        {signed ? (
          /* Signed summary view */
          <div>
            <div style={{ background:'#fff', borderRadius:14, border:'1.5px solid #86efac', padding:'24px 28px', marginBottom:20 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
                <div>
                  <div style={{ fontSize:18, fontWeight:900, color:'#0f172a' }}>Bright Solutions Hospital</div>
                  <div style={{ fontSize:12, color:'#64748b' }}>Clinical Discharge Summary — {adm.id}</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:11, color:'#64748b' }}>Discharge Date</div>
                  <div style={{ fontSize:14, fontWeight:800, color:'#0f172a' }}>{new Date().toLocaleDateString('en-IN')}</div>
                </div>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14, marginBottom:20 }}>
                {[
                  ['Patient Name', adm.patient.name],
                  ['UHID', adm.patient.uhid],
                  ['Age / Gender', `${adm.patient.age}Y / ${adm.patient.gender}`],
                  ['Admission Date', adm.admDate],
                  ['Discharge Date', new Date().toLocaleDateString('en-IN')],
                  ['Duration', `${adm.days} days`],
                  ['Bed / Ward', `${adm.bed} / ${adm.ward}`],
                  ['Attending Doctor', adm.doctor],
                  ['Condition', condition],
                ].map(([label, value]) => (
                  <div key={label} style={{ background:'#f8fafc', borderRadius:9, padding:'10px 12px' }}>
                    <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8', marginBottom:3 }}>{label}</div>
                    <div style={{ fontSize:13, fontWeight:700, color: label === 'Condition' ? condColor[condition] : '#0f172a' }}>{value}</div>
                  </div>
                ))}
              </div>

              <div style={{ borderTop:'1px solid #e2e8f0', paddingTop:16, marginBottom:16 }}>
                <div style={{ fontSize:12, fontWeight:800, color:'#0f172a', marginBottom:8 }}>Final Diagnosis</div>
                <div style={{ fontSize:13, color:'#334155', padding:'10px 14px', background:'#f8fafc', borderRadius:9 }}>{finalDiagnosis}</div>
              </div>

              {course && (
                <div style={{ borderTop:'1px solid #e2e8f0', paddingTop:16, marginBottom:16 }}>
                  <div style={{ fontSize:12, fontWeight:800, color:'#0f172a', marginBottom:8 }}>Clinical Course</div>
                  <div style={{ fontSize:12, color:'#334155', padding:'10px 14px', background:'#f8fafc', borderRadius:9, whiteSpace:'pre-wrap' }}>{course}</div>
                </div>
              )}

              <div style={{ borderTop:'1px solid #e2e8f0', paddingTop:16 }}>
                <div style={{ fontSize:12, fontWeight:800, color:'#0f172a', marginBottom:8 }}>Discharge Medications</div>
                {meds.map(m => (
                  <div key={m.id} style={{ display:'flex', gap:16, padding:'7px 0', borderBottom:'1px solid #f1f5f9', fontSize:12 }}>
                    <span style={{ fontWeight:700, color:'#0f172a', minWidth:200 }}>{m.drug}</span>
                    <span style={{ color:'#334155' }}>{m.dose} — {m.freq} — {m.duration}</span>
                    <span style={{ color:'#64748b', fontStyle:'italic' }}>{m.instructions}</span>
                  </div>
                ))}
              </div>

              {followUpDate && (
                <div style={{ marginTop:14, padding:'10px 14px', background:'#eff6ff', borderRadius:9, fontSize:12, fontWeight:700, color:'#1e40af' }}>
                  📅 Follow-up: {new Date(followUpDate).toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
                </div>
              )}

              <div style={{ marginTop:20, paddingTop:16, borderTop:'1px solid #e2e8f0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div style={{ fontSize:11, color:'#64748b' }}>
                  Digitally signed by <strong>{adm.doctor}</strong> on {new Date().toLocaleString('en-IN')}
                </div>
                <div style={{ display:'flex', gap:10 }}>
                  <button onClick={() => window.print()} style={{
                    display:'flex', alignItems:'center', gap:6, padding:'9px 18px', borderRadius:9,
                    border:'1.5px solid #0077b6', background:'#fff', color:'#0077b6', fontSize:12, fontWeight:700, cursor:'pointer',
                  }}>
                    <Printer size={14} /> Print Summary
                  </button>
                  <button onClick={() => navigate(`/billing/ipd-settlement/${adm.id}`)} style={{
                    display:'flex', alignItems:'center', gap:6, padding:'9px 20px', borderRadius:9,
                    border:'none', background:'linear-gradient(135deg,#d97706,#b45309)', color:'#fff', fontSize:13, fontWeight:800, cursor:'pointer',
                  }}>
                    💰 Proceed to Billing Settlement
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Edit form */
          <div>
            <SectionCard title="🏥 Condition at Discharge">
              <div style={{ marginBottom:12, fontSize:11.5, color:'#64748b' }}>Select the clinical condition at time of discharge:</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
                {CONDITIONS.map(c => (
                  <button key={c} onClick={() => setCondition(c)} style={{
                    padding:'10px 22px', borderRadius:10, cursor:'pointer', fontWeight:800, fontSize:13,
                    border:`2px solid ${condition === c ? condColor[c] : '#e2e8f0'}`,
                    background: condition === c ? condBg[c] : '#fff',
                    color: condition === c ? condColor[c] : '#94a3b8', transition:'all 0.15s',
                  }}>{c}</button>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="🔬 Final Diagnosis">
              <div style={{ marginBottom:12 }}>
                <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#334155', marginBottom:6 }}>Primary ICD-10 Diagnosis</label>
                <input type="text" value={finalDiagnosis} onChange={e => setFinalDiagnosis(e.target.value)}
                  placeholder="Enter final confirmed diagnosis..." style={inputStyle} />
              </div>
              <div>
                <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#334155', marginBottom:6 }}>Procedures Performed (if any)</label>
                <input type="text" value={procedures} onChange={e => setProcedures(e.target.value)}
                  placeholder="e.g. IV Hydration, ECG, 2D Echo" style={inputStyle} />
              </div>
            </SectionCard>

            <SectionCard title="📋 Clinical Course of Hospitalisation">
              <textarea value={course} onChange={e => setCourse(e.target.value)} rows={6}
                placeholder="Describe the clinical course: presenting complaints, treatment given, patient response, complications, progress..."
                style={{ ...inputStyle, resize:'vertical', minHeight:120 }} />
            </SectionCard>

            <SectionCard title="💊 Discharge Medications">
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12, marginBottom:14 }}>
                <thead>
                  <tr style={{ borderBottom:'2px solid #e2e8f0' }}>
                    {['Drug & Strength','Dose','Frequency','Duration','Instructions',''].map(h => (
                      <th key={h} style={{ textAlign:'left', padding:'6px 8px', fontSize:10.5, fontWeight:700, color:'#64748b' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {meds.map(m => (
                    <tr key={m.id} style={{ borderBottom:'1px solid #f1f5f9' }}>
                      <td style={{ padding:'8px 8px', fontWeight:600, color:'#0f172a' }}>{m.drug}</td>
                      <td style={{ padding:'8px 8px', color:'#334155' }}>{m.dose}</td>
                      <td style={{ padding:'8px 8px', color:'#334155' }}>{m.freq}</td>
                      <td style={{ padding:'8px 8px', color:'#334155' }}>{m.duration}</td>
                      <td style={{ padding:'8px 8px', color:'#64748b', fontStyle:'italic' }}>{m.instructions}</td>
                      <td style={{ padding:'8px 8px' }}>
                        <button onClick={() => setMeds(ms => ms.filter(x => x.id !== m.id))}
                          style={{ padding:'2px 8px', borderRadius:5, border:'1px solid #fca5a5', background:'#fff', color:'#dc2626', fontSize:10, fontWeight:700, cursor:'pointer' }}>✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 2fr auto', gap:8, alignItems:'end' }}>
                {[['drug','Drug','Tab. Paracetamol'],['dose','Dose','500mg'],['freq','Freq','BD'],['duration','Duration','5 days'],['instructions','Instructions','After food']].map(([k,lbl,ph]) => (
                  <div key={k}>
                    <label style={{ display:'block', fontSize:10, fontWeight:700, color:'#64748b', marginBottom:3 }}>{lbl}</label>
                    <input type="text" value={newMed[k]} onChange={e => setNewMed(m => ({ ...m, [k]:e.target.value }))}
                      placeholder={ph} style={{ width:'100%', padding:'7px 9px', borderRadius:7, border:'1.5px solid #e2e8f0', fontSize:11.5, outline:'none', boxSizing:'border-box' }} />
                  </div>
                ))}
                <button onClick={addMed}
                  style={{ padding:'7px 14px', borderRadius:7, border:'none', background:'#0d9488', color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer', alignSelf:'end' }}>
                  + Add
                </button>
              </div>
            </SectionCard>

            <SectionCard title="📅 Follow-up Appointment">
              <div style={{ maxWidth:280 }}>
                <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#334155', marginBottom:6 }}>Follow-up Date</label>
                <input type="date" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)}
                  style={{ width:'100%', padding:'9px 12px', borderRadius:9, border:'1.5px solid #e2e8f0', fontSize:13, outline:'none', boxSizing:'border-box' }} />
              </div>
            </SectionCard>

            <div style={{ display:'flex', justifyContent:'flex-end', gap:12 }}>
              <button onClick={() => navigate(-1)} style={{
                padding:'10px 22px', borderRadius:9, border:'1.5px solid #e2e8f0', background:'#fff', color:'#64748b', fontSize:13, fontWeight:700, cursor:'pointer',
              }}>Cancel</button>
              <button onClick={handleSign} style={{
                display:'flex', alignItems:'center', gap:8, padding:'11px 28px', borderRadius:10,
                border:'none', cursor:'pointer', background:'linear-gradient(135deg,#0077b6,#0369a1)', color:'#fff', fontSize:14, fontWeight:800,
              }}>
                <CheckCircle2 size={16} /> Sign & Lock Discharge Summary
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
