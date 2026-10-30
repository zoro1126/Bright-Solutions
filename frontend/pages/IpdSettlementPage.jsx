/**
 * IpdSettlementPage.jsx — TASK FE-5.2, FE-5.3, FE-5.4
 * 10-Head IPD Billing Settlement page.
 * Route: /billing/ipd-settlement/:admissionId
 */
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import {
  ArrowLeft, ChevronDown, ChevronUp, CheckCircle2,
  Printer, CreditCard, Smartphone, Banknote, Building2,
  AlertTriangle, Receipt,
} from 'lucide-react';

const MOCK_BILLING = {
  admissionId: 'ADM-2026-001',
  patient: { name: 'Arjun Singh', uhid: 'BS-001005', age: 45, gender: 'Male' },
  bed: 'BED-105', ward: 'General Ward Male', doctor: 'Dr. Mehta', days: 4,
  admDate: '2026-10-26', dischargeDate: '2026-10-30',
  advance: 10000,
  heads: [
    { id: 1, name: 'Bed Rent / Room Charges',             amount: 6000,  items: ['General Ward: ₹1,500/day × 4 days'] },
    { id: 2, name: 'Doctor Consultation & Daily Rounds',  amount: 4000,  items: ['Admission consultation: ₹1,000', 'Daily rounds: ₹750 × 4 days'] },
    { id: 3, name: 'Nursing Care Charges',                amount: 2400,  items: ['Nursing care: ₹600/day × 4 days'] },
    { id: 4, name: 'Surgical & Medical Procedures',       amount: 0,     items: ['No surgical procedures performed'] },
    { id: 5, name: 'Inpatient Pharmacy & IV Fluids',      amount: 3850,  items: ['Tab. Amlodipine 5mg × 4', 'Inj. Labetalol 100mg × 2 vials', 'IV NS 500ml × 4 bags', 'IV line & consumables'] },
    { id: 6, name: 'Pathology & Laboratory',              amount: 2800,  items: ['CBC with ESR', 'RFT + LFT', 'Lipid profile', 'HbA1c', 'Urine routine'] },
    { id: 7, name: 'Operation Theatre (OT) Charges',      amount: 0,     items: ['Not applicable'] },
    { id: 8, name: 'Anaesthesia Fees',                    amount: 0,     items: ['Not applicable'] },
    { id: 9, name: 'Oxygen Therapy & Medical Equipment',  amount: 800,   items: ['Pulse oximeter monitoring: ₹200/day × 4 days'] },
    { id: 10, name: 'Consumables & Disposable Supplies',  amount: 1200,  items: ['IV cannula × 2', 'Syringes', 'Gloves', 'Gauze pads'] },
  ],
};

function BillingHead({ head }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ border:'1px solid #e2e8f0', borderRadius:10, overflow:'hidden', marginBottom:8 }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width:'100%', display:'flex', justifyContent:'space-between', alignItems:'center',
        padding:'12px 16px', background: head.amount > 0 ? '#fff' : '#f8fafc',
        border:'none', cursor:'pointer',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{
            width:24, height:24, borderRadius:6, fontSize:10, fontWeight:900,
            background: head.amount > 0 ? '#0d9488' : '#e2e8f0',
            color: head.amount > 0 ? '#fff' : '#94a3b8',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>{head.id}</span>
          <span style={{ fontSize:13, fontWeight: head.amount > 0 ? 700 : 500, color: head.amount > 0 ? '#0f172a' : '#94a3b8' }}>
            {head.name}
          </span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:14, fontWeight:900, color: head.amount > 0 ? '#0f172a' : '#94a3b8' }}>
            {head.amount > 0 ? `₹${head.amount.toLocaleString('en-IN')}` : '—'}
          </span>
          {open ? <ChevronUp size={15} color="#94a3b8" /> : <ChevronDown size={15} color="#94a3b8" />}
        </div>
      </button>
      {open && (
        <div style={{ padding:'10px 16px', background:'#f8fafc', borderTop:'1px solid #f1f5f9' }}>
          {head.items.map((item, i) => (
            <div key={i} style={{ fontSize:11.5, color:'#475569', padding:'3px 0', display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ color:'#94a3b8' }}>•</span> {item}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function IpdSettlementPage() {
  const { admissionId } = useParams();
  const navigate = useNavigate();
  const billing = MOCK_BILLING;

  const gross = billing.heads.reduce((s, h) => s + h.amount, 0);
  const gst = Math.round(gross * 0.05); // 5% GST (hospital services)
  const discount = 0;
  const totalPayable = gross + gst - discount;
  const balanceDue = totalPayable - billing.advance;

  const [payMode, setPayMode] = useState('cash');
  const [payAmounts, setPayAmounts] = useState({ cash:'', upi:'', card:'', neft:'' });
  const [upiRef, setUpiRef] = useState('');
  const [cardAuth, setCardAuth] = useState('');
  const [neftRef, setNeftRef] = useState('');
  const [waiverPin, setWaiverPin] = useState('');
  const [waiver, setWaiver] = useState(0);
  const [settled, setSettled] = useState(false);
  const [loading, setLoading] = useState(false);

  const totalPaid = Object.values(payAmounts).reduce((s, v) => s + (parseFloat(v) || 0), 0);
  const remaining = balanceDue - waiver - totalPaid;
  const canSettle = Math.abs(remaining) < 1;

  const handleSettle = async () => {
    if (!canSettle) { alert(`Balance mismatch: ₹${remaining.toFixed(2)} remaining. Please reconcile payment.`); return; }
    setLoading(true);
    try {
      await fetch(`/api/v1/ipd/admissions/${admissionId || 'ADM-2026-001'}/discharge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settlementAmount: totalPayable,
          paidAmount: totalPaid,
          advanceDeducted: billing.advance,
          waiverAmount: waiver,
          paymentBreakdown: payAmounts,
          settledAt: new Date().toISOString(),
        }),
      });
    } catch (err) {
      console.warn('Discharge API offline, mock fallback applied:', err);
    } finally {
      setLoading(false);
      setSettled(true);
    }
  };

  const PayRow = ({ mode, icon: Icon, label, refLabel, refValue, onRefChange }) => (
    <div style={{ background: payMode === mode ? '#f0fdfa' : '#f8fafc', borderRadius:10,
      border:`1.5px solid ${payMode === mode ? '#0d9488' : '#e2e8f0'}`, padding:'12px 16px', marginBottom:10 }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom: payMode === mode ? 10 : 0 }}>
        <input type="radio" checked={payMode === mode} onChange={() => setPayMode(mode)} style={{ accentColor:'#0d9488' }} />
        <Icon size={16} color={payMode === mode ? '#0d9488' : '#94a3b8'} />
        <span style={{ fontSize:13, fontWeight: payMode === mode ? 700 : 500, color: payMode === mode ? '#0d9488' : '#334155' }}>{label}</span>
        {payMode === mode && (
          <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:11, color:'#64748b' }}>Amount (₹)</span>
            <input type="number" value={payAmounts[mode]} onChange={e => setPayAmounts(p => ({ ...p, [mode]: e.target.value }))}
              placeholder={`₹${balanceDue.toLocaleString('en-IN')}`}
              style={{ width:140, padding:'6px 10px', borderRadius:7, border:'1.5px solid #0d9488', fontSize:13, fontWeight:700, outline:'none', textAlign:'right' }} />
          </div>
        )}
      </div>
      {payMode === mode && refLabel && (
        <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:8 }}>
          <span style={{ fontSize:11, fontWeight:700, color:'#64748b', minWidth:100 }}>{refLabel}</span>
          <input type="text" value={refValue} onChange={e => onRefChange(e.target.value)}
            placeholder="Enter reference..." style={{ flex:1, padding:'6px 10px', borderRadius:7, border:'1.5px solid #e2e8f0', fontSize:12, outline:'none' }} />
        </div>
      )}
    </div>
  );

  return (
    <div style={{ height: '100vh', maxHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Navbar dept="IPD" currentRole="cashier" onLogout={() => navigate('/login')} />

      <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', paddingBottom: 40 }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 20px', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
          <button onClick={() => navigate(-1)} style={{
            display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:9,
            background:'#fff', border:'1.5px solid #e2e8f0', color:'#334155', fontSize:12, fontWeight:700, cursor:'pointer',
          }}>
            <ArrowLeft size={14} /> Back
          </button>
          <div>
            <div style={{ fontSize:20, fontWeight:900, color:'#0f172a' }}>IPD Billing Settlement</div>
            <div style={{ fontSize:12, color:'#64748b' }}>{billing.patient.name} • {billing.patient.uhid} • {billing.bed} • {billing.days} days</div>
          </div>
          {settled && (
            <span style={{ marginLeft:'auto', padding:'6px 14px', borderRadius:9,
              background:'#f0fdf4', border:'1.5px solid #86efac', color:'#15803d', fontSize:12, fontWeight:800,
              display:'flex', alignItems:'center', gap:6 }}>
              <CheckCircle2 size={14} /> SETTLED
            </span>
          )}
        </div>

        {settled ? (
          /* Receipt view */
          <div style={{ background:'#fff', borderRadius:14, border:'1.5px solid #86efac', padding:'28px 32px' }}>
            <div style={{ textAlign:'center', marginBottom:24 }}>
              <div style={{ fontSize:22, fontWeight:900, color:'#0f172a' }}>Bright Solutions Hospital</div>
              <div style={{ fontSize:12, color:'#64748b' }}>GSTIN: 24AAACB1234F1Z5 | Reg. No: MH/DHA/2019/001</div>
              <div style={{ fontSize:16, fontWeight:800, color:'#0d9488', marginTop:8 }}>FINAL DISCHARGE INVOICE</div>
              <div style={{ fontSize:11, color:'#64748b' }}>Invoice #: INV-{Date.now().toString().slice(-6)}</div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20 }}>
              {[['Patient', billing.patient.name],['UHID', billing.patient.uhid],
                ['Bed / Ward', `${billing.bed} / ${billing.ward}`],['Doctor', billing.doctor],
                ['Admission', billing.admDate],['Discharge', billing.dischargeDate],
              ].map(([l,v]) => (
                <div key={l} style={{ fontSize:12 }}>
                  <span style={{ fontWeight:700, color:'#64748b' }}>{l}: </span>
                  <span style={{ color:'#0f172a' }}>{v}</span>
                </div>
              ))}
            </div>

            <table style={{ width:'100%', borderCollapse:'collapse', marginBottom:16, fontSize:12 }}>
              <tbody>
                {billing.heads.filter(h => h.amount > 0).map(h => (
                  <tr key={h.id} style={{ borderBottom:'1px solid #f1f5f9' }}>
                    <td style={{ padding:'6px 0', color:'#334155' }}>{h.id}. {h.name}</td>
                    <td style={{ padding:'6px 0', textAlign:'right', fontWeight:700, color:'#0f172a' }}>₹{h.amount.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
                <tr style={{ borderTop:'2px solid #e2e8f0' }}>
                  <td style={{ padding:'8px 0', fontWeight:700, color:'#0f172a' }}>Subtotal</td>
                  <td style={{ padding:'8px 0', textAlign:'right', fontWeight:800, color:'#0f172a' }}>₹{gross.toLocaleString('en-IN')}</td>
                </tr>
                <tr><td style={{ padding:'4px 0', color:'#64748b' }}>GST @ 5%</td><td style={{ textAlign:'right', color:'#64748b' }}>₹{gst.toLocaleString('en-IN')}</td></tr>
                <tr><td style={{ padding:'4px 0', color:'#10b981' }}>Advance Paid</td><td style={{ textAlign:'right', color:'#10b981', fontWeight:700 }}>— ₹{billing.advance.toLocaleString('en-IN')}</td></tr>
                <tr style={{ borderTop:'2px solid #0d9488' }}>
                  <td style={{ padding:'10px 0', fontSize:15, fontWeight:900, color:'#0d9488' }}>TOTAL SETTLED</td>
                  <td style={{ textAlign:'right', fontSize:18, fontWeight:900, color:'#0d9488' }}>₹{totalPayable.toLocaleString('en-IN')}</td>
                </tr>
              </tbody>
            </table>

            <div style={{ display:'flex', justifyContent:'center', gap:12, marginTop:20 }}>
              <button onClick={() => window.print()} style={{
                display:'flex', alignItems:'center', gap:6, padding:'10px 22px', borderRadius:9,
                border:'1.5px solid #0077b6', background:'#fff', color:'#0077b6', fontSize:13, fontWeight:700, cursor:'pointer',
              }}>
                <Printer size={15} /> Print Invoice
              </button>
              <button onClick={() => navigate('/ipd')} style={{
                display:'flex', alignItems:'center', gap:6, padding:'10px 22px', borderRadius:9,
                border:'none', background:'linear-gradient(135deg,#0d9488,#0f766e)', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer',
              }}>
                ✅ Done — Back to Ward
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 380px', gap:20 }}>
            {/* 10-Head Breakdown */}
            <div>
              <div style={{ fontSize:14, fontWeight:800, color:'#0f172a', marginBottom:14 }}>10-Head NABH Cost Breakdown</div>
              {billing.heads.map(h => <BillingHead key={h.id} head={h} />)}
            </div>

            {/* Payment Panel */}
            <div>
              {/* Summary card */}
              <div style={{ background:'#fff', borderRadius:12, border:'1px solid #e2e8f0', padding:'16px 18px', marginBottom:16 }}>
                <div style={{ fontSize:13, fontWeight:800, color:'#0f172a', marginBottom:12 }}>Bill Summary</div>
                {[
                  ['Gross Charges', `₹${gross.toLocaleString('en-IN')}`, '#0f172a'],
                  ['GST (5%)', `+ ₹${gst.toLocaleString('en-IN')}`, '#64748b'],
                  ['Discount', discount > 0 ? `— ₹${discount.toLocaleString('en-IN')}` : '—', '#10b981'],
                  ['Total Payable', `₹${totalPayable.toLocaleString('en-IN')}`, '#0f172a'],
                  ['Advance Paid', `— ₹${billing.advance.toLocaleString('en-IN')}`, '#0d9488'],
                ].map(([l, v, c]) => (
                  <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:'1px solid #f8fafc', fontSize:12 }}>
                    <span style={{ color:'#64748b' }}>{l}</span>
                    <span style={{ fontWeight:700, color:c }}>{v}</span>
                  </div>
                ))}
                <div style={{ display:'flex', justifyContent:'space-between', padding:'10px 0 0', marginTop:4, borderTop:'2px solid #e2e8f0' }}>
                  <span style={{ fontSize:14, fontWeight:800, color:'#0f172a' }}>Balance Due</span>
                  <span style={{ fontSize:18, fontWeight:900, color: balanceDue <= 0 ? '#10b981' : '#dc2626' }}>
                    ₹{balanceDue.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Payment modes */}
              <div style={{ background:'#fff', borderRadius:12, border:'1px solid #e2e8f0', padding:'16px 18px', marginBottom:16 }}>
                <div style={{ fontSize:13, fontWeight:800, color:'#0f172a', marginBottom:12 }}>Payment Collection</div>
                <PayRow mode="cash" icon={Banknote} label="Cash" />
                <PayRow mode="upi" icon={Smartphone} label="UPI" refLabel="UTR Reference" refValue={upiRef} onRefChange={setUpiRef} />
                <PayRow mode="card" icon={CreditCard} label="Credit / Debit Card" refLabel="Auth Code" refValue={cardAuth} onRefChange={setCardAuth} />
                <PayRow mode="neft" icon={Building2} label="Cheque / NEFT / RTGS" refLabel="Ref / Cheque No" refValue={neftRef} onRefChange={setNeftRef} />

                {/* Waiver */}
                <div style={{ borderTop:'1px solid #f1f5f9', marginTop:12, paddingTop:12 }}>
                  <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, fontWeight:600, color:'#334155', marginBottom:8 }}>
                    <input type="checkbox" onChange={e => !e.target.checked && setWaiver(0)} style={{ accentColor:'#dc2626' }} />
                    Authorised Financial Waiver
                  </label>
                  <div style={{ display:'flex', gap:8 }}>
                    <input type="number" value={waiver} onChange={e => setWaiver(parseFloat(e.target.value) || 0)}
                      placeholder="Waiver amount ₹" style={{ flex:1, padding:'7px 10px', borderRadius:7, border:'1.5px solid #fca5a5', fontSize:12, outline:'none' }} />
                    <input type="password" value={waiverPin} onChange={e => setWaiverPin(e.target.value)}
                      placeholder="Admin PIN" style={{ width:100, padding:'7px 10px', borderRadius:7, border:'1.5px solid #fca5a5', fontSize:12, outline:'none' }} />
                  </div>
                </div>

                {/* Reconciliation */}
                <div style={{ marginTop:14, padding:'12px 14px', borderRadius:10,
                  background: canSettle ? '#f0fdf4' : Math.abs(remaining) < 50 ? '#fffbeb' : '#fee2e2',
                  border: `1.5px solid ${canSettle ? '#86efac' : Math.abs(remaining) < 50 ? '#fde68a' : '#fca5a5'}` }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:12 }}>
                    <span style={{ fontWeight:700, color:'#334155' }}>Amount Entered</span>
                    <span style={{ fontWeight:800, color:'#0f172a' }}>₹{totalPaid.toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginTop:6 }}>
                    <span style={{ fontWeight:700, color:'#334155' }}>Remaining</span>
                    <span style={{ fontWeight:900, color: canSettle ? '#10b981' : '#dc2626' }}>
                      {canSettle ? '✅ RECONCILED' : `₹${Math.abs(remaining).toFixed(2)} ${remaining > 0 ? 'short' : 'excess'}`}
                    </span>
                  </div>
                </div>
              </div>

              <button onClick={handleSettle} disabled={!canSettle || loading} style={{
                width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                padding:'14px', borderRadius:11, border:'none', cursor: (canSettle && !loading) ? 'pointer' : 'not-allowed',
                background: (canSettle && !loading) ? 'linear-gradient(135deg,#10b981,#059669)' : '#e2e8f0',
                color: (canSettle && !loading) ? '#fff' : '#94a3b8', fontSize:14, fontWeight:900,
              }}>
                <Receipt size={16} /> {loading ? 'Processing Settlement...' : canSettle ? 'Complete Settlement & Release Bed' : 'Enter payment to settle'}
              </button>
            </div>
          </div>
        )}
      </div>
      </main>
    </div>
  );
}
