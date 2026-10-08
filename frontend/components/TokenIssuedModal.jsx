import React from 'react';
import { CheckCircle2, Printer, X, Sparkles, User, HeartPulse, Stethoscope, ArrowRight, Sun } from 'lucide-react';

export default function TokenIssuedModal({
  isOpen,
  tokenData,
  onClose
}) {
  if (!isOpen || !tokenData) return null;

  const { patient, visit, vitals } = tokenData;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ maxWidth: '580px' }} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-wrapper">
            <div className="modal-title-icon">
              <Sun size={24} strokeWidth={2.4} />
            </div>
            <div>
              <h2>Patient Registration Successful</h2>
              <p>OPD Token Generated & Triage Logged to Electronic Roster</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* Slip Body */}
        <div className="modal-body" style={{ padding: '2rem 1.75rem' }}>
          <div className="token-slip-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', color: '#854D0E' }}>
              <Sun size={18} color="var(--yellow-600)" />
              <span style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Bright Solutions Official OPD Token
              </span>
            </div>

            {/* Token Badge */}
            <div>
              <div className="token-big-badge">
                {visit?.queue_token || 'Q-101'}
              </div>
            </div>

            <div className="uhid-large">
              {patient?.uhid || 'UHID-2026-00001'}
            </div>

            {/* Detailed Slip Table */}
            <div className="token-slip-details">
              <div className="slip-row">
                <span>Patient Full Name</span>
                <span>{patient?.full_name}</span>
              </div>
              <div className="slip-row">
                <span>Demographics</span>
                <span>{patient?.gender} • {patient?.dob}</span>
              </div>
              <div className="slip-row">
                <span>Contact Phone</span>
                <span>{patient?.phone}</span>
              </div>
              <div className="slip-row">
                <span>Assigned Physician</span>
                <span style={{ color: 'var(--navy-900)', fontWeight: 700 }}>{visit?.doctor_name}</span>
              </div>
              <div className="slip-row">
                <span>Queue Status</span>
                <span style={{ color: '#059669', fontWeight: 700 }}>TRIAGED / READY</span>
              </div>

              {/* Vitals Summary */}
              {vitals && (vitals.systolic_bp || vitals.bmi) && (
                <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1.5px dashed var(--yellow-400)' }}>
                  <div className="slip-row">
                    <span>Blood Pressure</span>
                    <span>
                      {vitals.systolic_bp}/{vitals.diastolic_bp} mmHg 
                      {vitals.bp_stage && ` (${vitals.bp_stage})`}
                    </span>
                  </div>
                  <div className="slip-row">
                    <span>BMI Evaluation</span>
                    <span>
                      {vitals.bmi ? `${vitals.bmi} kg/m²` : '--'} 
                      {vitals.bmi_category && ` (${vitals.bmi_category})`}
                    </span>
                  </div>
                  {vitals.spo2_pct && (
                    <div className="slip-row">
                      <span>Oxygen Saturation</span>
                      <span>{vitals.spo2_pct}% SpO2</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{ fontSize: '0.78rem', color: '#64748B', fontStyle: 'italic' }}>
              Please ask patient to proceed to the designated consultation lounge.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <button type="button" className="btn btn-secondary" onClick={handlePrint}>
            <Printer size={16} />
            <span>Print Token Slip</span>
          </button>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            <span>View In OPD Queue</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
