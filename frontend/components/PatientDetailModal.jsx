import React from 'react';
import { X, Printer, User, Phone, MapPin, HeartPulse, Activity, Stethoscope, Shield, Calendar } from 'lucide-react';

export default function PatientDetailModal({
  isOpen,
  patient,
  onClose
}) {
  if (!isOpen || !patient) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ maxWidth: '780px' }} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-wrapper">
            <div className="modal-title-icon">
              <User size={20} />
            </div>
            <div>
              <h2>Bright Solutions • Patient Triage Record</h2>
              <p>UHID: <strong style={{ color: 'var(--yellow-400)' }}>{patient.uhid}</strong> • Token: <strong>{patient.queue_token || 'N/A'}</strong></p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* Top Summary Banner */}
          <div style={{
            background: '#F0F4F8',
            borderRadius: '10px',
            padding: '1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            border: '1px solid #D9E2EC'
          }}>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0A2540', fontFamily: 'var(--font-serif)' }}>
                {patient.full_name}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#475569', display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
                <span>Age: <strong>{patient.age ? `${patient.age} yrs` : 'N/A'}</strong></span>
                <span>•</span>
                <span>Gender: <strong>{patient.gender}</strong></span>
                <span>•</span>
                <span>Blood: <strong>{patient.blood_group || 'Unknown'}</strong></span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="token-badge" style={{ fontSize: '1.1rem', padding: '0.4rem 1rem' }}>
                {patient.queue_token || 'Q-101'}
              </div>
              <div style={{
                background: '#ECFDF5',
                color: '#047857',
                border: '1px solid #A7F3D0',
                padding: '0.4rem 0.85rem',
                borderRadius: '6px',
                fontSize: '0.82rem',
                fontWeight: 700
              }}>
                {patient.visit_status || 'TRIAGED'}
              </div>
            </div>
          </div>

          {/* Section 1: Demographics & Contact */}
          <div className="form-section-title">
            <User size={18} color="#0055FF" />
            <span>Registration Profile & Demographics</span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem',
            fontSize: '0.88rem'
          }}>
            <div>
              <div style={{ color: '#64748B', fontSize: '0.78rem', fontWeight: 600 }}>CONTACT PHONE</div>
              <div style={{ fontWeight: 600, color: '#0A2540' }}>{patient.phone || 'N/A'}</div>
            </div>
            <div>
              <div style={{ color: '#64748B', fontSize: '0.78rem', fontWeight: 600 }}>EMAIL ADDRESS</div>
              <div style={{ fontWeight: 600, color: '#0A2540' }}>{patient.email || 'Not provided'}</div>
            </div>
            <div>
              <div style={{ color: '#64748B', fontSize: '0.78rem', fontWeight: 600 }}>BILLING / INSURANCE</div>
              <div style={{ fontWeight: 600, color: '#0A2540' }}>{patient.insurance_type || 'CASH'}</div>
            </div>
            <div>
              <div style={{ color: '#64748B', fontSize: '0.78rem', fontWeight: 600 }}>EMERGENCY CONTACT</div>
              <div style={{ fontWeight: 600, color: '#0A2540' }}>{patient.emergency_contact || 'None listed'}</div>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <div style={{ color: '#64748B', fontSize: '0.78rem', fontWeight: 600 }}>RESIDENTIAL ADDRESS</div>
              <div style={{ fontWeight: 600, color: '#0A2540' }}>{patient.address || 'Not recorded'}</div>
            </div>
          </div>

          {/* Section 2: Consultation & Doctor */}
          <div className="form-section-title">
            <Stethoscope size={18} color="#B89C14" />
            <span>Consultation & Assigned Physician</span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem',
            marginBottom: '1.5rem',
            fontSize: '0.88rem'
          }}>
            <div>
              <div style={{ color: '#64748B', fontSize: '0.78rem', fontWeight: 600 }}>ATTENDING DOCTOR</div>
              <div style={{ fontWeight: 700, color: '#0055FF', fontSize: '0.98rem' }}>
                {patient.doctor_name || 'Dr. Rajesh Kulkarni'}
              </div>
            </div>
            <div>
              <div style={{ color: '#64748B', fontSize: '0.78rem', fontWeight: 600 }}>ENCOUNTER TIMESTAMP</div>
              <div style={{ fontWeight: 600, color: '#0A2540' }}>
                {patient.visit_date ? new Date(patient.visit_date).toLocaleString() : 'Today'}
              </div>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <div style={{ color: '#64748B', fontSize: '0.78rem', fontWeight: 600 }}>CHIEF COMPLAINT</div>
              <div style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                padding: '0.65rem 0.85rem',
                borderRadius: '6px',
                marginTop: '0.25rem',
                color: '#1E293B'
              }}>
                {patient.chief_complaint || 'General OPD Consultation'}
              </div>
            </div>
          </div>

          {/* Section 3: Clinical Triage Vitals */}
          <div className="form-section-title">
            <HeartPulse size={18} color="#DC2626" />
            <span>Clinical Triage Vitals Snapshot</span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '0.85rem',
            marginBottom: '1rem'
          }}>
            {/* BP Card */}
            <div style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              padding: '0.75rem',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>BLOOD PRESSURE</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0A2540', marginTop: '0.2rem' }}>
                {patient.systolic_bp ? `${patient.systolic_bp}/${patient.diastolic_bp}` : '--'} <span style={{ fontSize: '0.75rem', fontWeight: 400 }}>mmHg</span>
              </div>
              <div style={{ marginTop: '0.25rem' }}>
                <span className="vital-chip alert-normal" style={{ fontSize: '0.72rem' }}>
                  {patient.bp_stage || 'Normal'}
                </span>
              </div>
            </div>

            {/* Pulse Card */}
            <div style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              padding: '0.75rem',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>PULSE RATE</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0A2540', marginTop: '0.2rem' }}>
                {patient.pulse_rate || '--'} <span style={{ fontSize: '0.75rem', fontWeight: 400 }}>bpm</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '0.25rem' }}>Normal Range (60-100)</div>
            </div>

            {/* Temp Card */}
            <div style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              padding: '0.75rem',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>TEMPERATURE</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0A2540', marginTop: '0.2rem' }}>
                {patient.temperature_f ? `${patient.temperature_f}°F` : '--'}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '0.25rem' }}>Oral / Axillary</div>
            </div>

            {/* SpO2 Card */}
            <div style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              padding: '0.75rem',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>SPO2 SATURATION</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0A2540', marginTop: '0.2rem' }}>
                {patient.spo2_pct ? `${patient.spo2_pct}%` : '--'}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 600, marginTop: '0.25rem' }}>Normal (≥95%)</div>
            </div>

            {/* BMI Card */}
            <div style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              padding: '0.75rem',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>BODY MASS INDEX</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0A2540', marginTop: '0.2rem' }}>
                {patient.bmi ? `${patient.bmi}` : '--'} <span style={{ fontSize: '0.75rem', fontWeight: 400 }}>kg/m²</span>
              </div>
              <div style={{ marginTop: '0.25rem' }}>
                <span className="bmi-badge bmi-normal" style={{ fontSize: '0.72rem' }}>
                  {patient.bmi_category || 'Normal'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          <button type="button" className="btn btn-primary" onClick={handlePrint}>
            <Printer size={16} />
            <span>Print Official OPD Sheet</span>
          </button>
        </div>
      </div>
    </div>
  );
}
