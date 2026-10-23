import React from 'react';
import { Printer, X, CheckCircle2, Sun, User, Clock, Stethoscope } from 'lucide-react';

export default function TokenSlipModal({ isOpen, patient, tokenNumber, onClose }) {
  if (!isOpen || !patient) return null;

  const handlePrint = () => {
    window.print();
  };

  const tokNum = tokenNumber || patient.tokenNumber || (patient.mrn ? patient.mrn.replace(/\D/g, '').slice(-3) : '142');

  return (
    <div className="m3-modal-backdrop" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.55)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: 16
    }}>
      <div className="card m3-dialog" style={{ width: '100%', maxWidth: 400, padding: 22, textAlign: 'center', borderRadius: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 2 }}>
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
            <strong style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-primary)' }}>Bright Solutions Hospital</strong>
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--text-secondary)' }}>
            Outpatient Department • Queue Token & Slip
          </div>

          {/* Photo Thumbnail + Token Number */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, margin: '12px 0 6px' }}>
            {patient.photoUrl ? (
              <div style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                overflow: 'hidden',
                border: '2px solid #f59e0b',
                flexShrink: 0
              }}>
                <img src={patient.photoUrl} alt="Patient" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ) : null}

            <div>
              <div style={{
                fontSize: 42,
                fontWeight: 900,
                color: 'var(--primary)',
                letterSpacing: '-0.02em',
                lineHeight: 1,
                fontFamily: 'var(--font-mono)'
              }}>
                #{tokNum}
              </div>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#b45309', background: '#fef3c7', padding: '2px 8px', borderRadius: 9999, marginTop: 4 }}>
                🟡 STATUS: WAITING IN LOUNGE
              </div>
              {(patient.isFollowUp || patient.visitType === 'FOLLOW_UP') && (
                <div style={{ fontSize: 10, fontWeight: 800, color: '#6d28d9', background: '#ede9fe', padding: '2px 8px', borderRadius: 9999, marginTop: 3 }}>
                  🔁 OPD FOLLOW-UP VISIT
                </div>
              )}
            </div>
          </div>

          <div style={{
            margin: '12px 0',
            padding: '10px 0',
            borderTop: '1px solid var(--border-subtle)',
            borderBottom: '1px solid var(--border-subtle)',
            fontSize: 11.5,
            textAlign: 'left',
            display: 'flex',
            flexDirection: 'column',
            gap: 5
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Patient Name:</span>
              <strong style={{ color: 'var(--text-primary)' }}>{patient.fullName}</strong>
            </div>

            {/* Master UHID */}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Master UHID:</span>
              <strong style={{ fontFamily: 'var(--font-mono)', color: '#0f172a' }}>
                {patient.uhid || patient.mrn}
              </strong>
            </div>

            {/* OPD Encounter ID */}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>OPD Encounter ID:</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', fontWeight: 700 }}>
                {patient.opdId || `OPD-26-${tokNum}`}
              </span>
            </div>

            {/* City Field */}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>City:</span>
              <strong style={{ color: 'var(--primary)' }}>
                {patient.city || (patient.frroDetails ? patient.frroDetails.stayCityInIndia : 'Chennai')}
              </strong>
            </div>

            {/* Category and Identity Credentials */}
            {patient.patientCategory === 'FOREIGN' || patient.frroDetails ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Category / Origin:</span>
                  <span style={{ color: '#0284c7', fontWeight: 700 }}>
                    🌍 Foreign ({patient.nationality || patient.frroDetails?.passportCountry || 'Overseas'})
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Passport / Visa:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 10.5 }}>
                    {patient.frroDetails?.passportNumber || 'N/A'} • {patient.frroDetails?.visaType || 'MED'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>FRRO Form-C:</span>
                  <span style={{ color: '#059669', fontWeight: 700, fontSize: 10.5 }}>
                    {patient.frroDetails?.formCNumber || 'FRRO-C-SUBMITTED'}
                  </span>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Aadhaar Card:</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {patient.aadhaarNumber || '4521 8840 9123'}
                </span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Assigned Doctor:</span>
              <strong style={{ color: 'var(--text-primary)' }}>{patient.doctorAssigned?.split('(')[0]}</strong>
            </div>

            {patient.referredBy && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Referred By:</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 11 }}>
                  {patient.referredBy} {patient.referrerContact ? `(${patient.referrerContact})` : ''}
                </span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Check-in Time:</span>
              <span style={{ fontWeight: 700, color: '#059669' }}>
                {patient.checkInTime || patient.registeredAt || '09:15 AM'}
              </span>
            </div>

            {(patient.isFollowUp || patient.visitType === 'FOLLOW_UP') && (
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #ddd6fe', paddingTop: 4, marginTop: 2 }}>
                <span style={{ color: '#6d28d9', fontWeight: 700 }}>Follow-Up Reason:</span>
                <span style={{ fontWeight: 700, color: '#7c3aed', fontSize: 11, textAlign: 'right', maxWidth: 220 }}>
                  {patient.followUpReason || 'Routine Review'}
                </span>
              </div>
            )}
          </div>

          <div style={{ fontSize: 10.5, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
            <CheckCircle2 size={13} color="#15803d" />
            <span>Please take a seat in Lounge A. Your token will be announced.</span>
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
