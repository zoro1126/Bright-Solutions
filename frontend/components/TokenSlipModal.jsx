import React from 'react';
import { Printer, X, CheckCircle2, QrCode, Sun } from 'lucide-react';

export default function TokenSlipModal({ isOpen, patient, tokenNumber, onClose }) {
  if (!isOpen || !patient) return null;

  const handlePrint = () => {
    window.print();
  };

  const tokNum = tokenNumber || (patient.mrn ? patient.mrn.replace(/\D/g, '').slice(-3) : '142');

  return (
    <div className="m3-modal-backdrop" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: 16
    }}>
      <div className="card m3-dialog" style={{ width: '100%', maxWidth: 380, padding: 20, textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase' }}>
            Official OPD Token Slip
          </span>
          <button className="icon-btn" onClick={onClose} style={{ width: 24, height: 24 }}>
            <X size={15} />
          </button>
        </div>

        {/* Printable Slip Container */}
        <div className="printable-token-slip" style={{
          padding: 16,
          background: 'var(--bg-subtle)',
          borderRadius: 'var(--radius-md)',
          border: '1px dashed var(--border-default)',
          textAlign: 'center',
          marginBottom: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 4 }}>
            <div style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff'
            }}>
              <Sun size={14} strokeWidth={2.4} />
            </div>
            <strong style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-primary)' }}>Bright Solutions</strong>
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--text-secondary)' }}>
            General & Multispeciality OPD Clinic
          </div>

          <div style={{
            fontSize: 44,
            fontWeight: 900,
            color: 'var(--primary)',
            letterSpacing: '-0.02em',
            margin: '12px 0 6px',
            fontFamily: 'var(--font-mono)'
          }}>
            #{tokNum}
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>
            WALK-IN OPD CONSULTATION QUEUE
          </div>

          <div style={{
            margin: '12px 0',
            padding: '8px 0',
            borderTop: '1px solid var(--border-subtle)',
            borderBottom: '1px solid var(--border-subtle)',
            fontSize: 11.5,
            textAlign: 'left',
            display: 'flex',
            flexDirection: 'column',
            gap: 4
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Patient Name:</span>
              <strong style={{ color: 'var(--text-primary)' }}>{patient.fullName}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>UHID / MRN:</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{patient.mrn}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Assigned Doctor:</span>
              <strong style={{ color: 'var(--text-primary)' }}>{patient.doctorAssigned?.split('(')[0]}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Triage Vitals:</span>
              <span>BP {patient.vitals?.bp || '120/80'} • SpO2 {patient.vitals?.spo2 || '99'}%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Issued At:</span>
              <span>{patient.appointmentTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>

          <div style={{ fontSize: 10, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <CheckCircle2 size={12} color="#15803d" />
            <span>Please wait in Lounge A until your token number is called.</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button className="m3-btn m3-btn-tonal" onClick={onClose} style={{ flex: 1, height: 34, fontSize: 12 }}>
            Close
          </button>
          <button
            className="m3-btn m3-btn-filled"
            onClick={handlePrint}
            style={{ flex: 1, height: 34, fontSize: 12, background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
          >
            <Printer size={14} />
            <span>Print Token Slip</span>
          </button>
        </div>
      </div>
    </div>
  );
}
