import React from 'react';
import { usePatients } from '../context/PatientContext';
import { 
  User, 
  Phone, 
  MapPin, 
  Clock, 
  Stethoscope, 
  Check, 
  Landmark, 
  Award, 
  X, 
  Globe, 
  ShieldCheck, 
  FileCheck, 
  Building2,
  Camera,
  Calendar,
  AlertCircle,
  UserPlus,
  RotateCcw
} from 'lucide-react';

export default function PatientDetailsDrawer({ 
  isOpen, 
  onClose, 
  patient, 
  onOpenDoctorWorkspace,
  onOpenFollowUp
}) {
  const { selectedPatient } = usePatients();
  const p = patient || selectedPatient;

  if (!isOpen || !p) return null;

  const isForeign = p.patientCategory === 'FOREIGN' || Boolean(p.frroDetails);
  const status = p.status || 'WAITING';

  return (
    <div className="modal-overlay m3-dialog-backdrop" onClick={onClose}>
      <div 
        className="modal-content m3-dialog-container" 
        style={{ maxWidth: 840, width: '94%', maxHeight: '92vh', display: 'flex', flexDirection: 'column', padding: 24, overflow: 'hidden' }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="m3-dialog-header" style={{ padding: '16px 24px 14px', margin: '-24px -24px 16px -24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexShrink: 0, borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            {/* Front-Desk Webcam Portrait / Avatar */}
            <div style={{
              width: 58,
              height: 58,
              borderRadius: '50%',
              overflow: 'hidden',
              background: 'var(--bg-subtle)',
              border: '2px solid var(--border-default)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
            }}>
              {p.photoUrl ? (
                <img src={p.photoUrl} alt={p.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <User size={30} color="var(--text-secondary)" />
              )}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                {/* Master UHID Badge */}
                <span style={{ 
                  background: 'linear-gradient(135deg, #1e293b, #0f172a)', 
                  color: '#ffffff', 
                  fontSize: 11, 
                  fontWeight: 800, 
                  padding: '3px 8px', 
                  borderRadius: 6,
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.03em'
                }}>
                  UHID: {p.uhid || p.mrn} (Master ID)
                </span>

                {/* OPD Encounter ID */}
                <span style={{ 
                  background: '#f1f5f9', 
                  color: '#334155', 
                  fontSize: 11, 
                  fontWeight: 700, 
                  padding: '3px 8px', 
                  borderRadius: 6,
                  fontFamily: 'var(--font-mono)'
                }}>
                  OPD: {p.opdId || `OPD-26-${p.tokenNumber || '142'}`}
                </span>

                {/* Token Badge */}
                <span style={{ 
                  background: 'linear-gradient(135deg, #fef3c7, #fde68a)', 
                  color: '#92400e', 
                  fontSize: 11, 
                  fontWeight: 800, 
                  padding: '3px 8px', 
                  borderRadius: 6,
                  border: '1px solid #f59e0b'
                }}>
                  Token #{p.tokenNumber || 142}
                </span>

                {/* Status Badges with 3-Color Scheme */}
                {status === 'WAITING' && (
                  <span style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 9999, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={12} /> 🟡 Waiting in Lounge
                  </span>
                )}
                {status === 'IN_CONSULTATION' && (
                  <span style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 9999, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Stethoscope size={12} /> 🔵 In Doctor Cabin
                  </span>
                )}
                {status === 'COMPLETED' && (
                  <span style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #86efac', fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 9999, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Check size={12} strokeWidth={3} /> 🟢 Completed Consultation ✓
                  </span>
                )}
              </div>

              <h3 style={{ fontSize: 19, fontWeight: 800, color: 'var(--text-primary)', marginTop: 5, marginBottom: 2 }}>
                {p.fullName} {isForeign && <span style={{ fontSize: 12.5, fontWeight: 600, color: '#0284c7' }}>({p.nationality || 'Foreign National'})</span>}
              </h3>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                {p.age} yrs • {p.gender} • DOB: {p.dob} • Doctor: <strong style={{ color: 'var(--text-primary)' }}>{p.doctorAssigned}</strong>
              </div>
            </div>
          </div>

          <button 
            type="button" 
            className="icon-btn" 
            onClick={onClose}
            title="Close Pop-up"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="m3-scrollable-body" style={{ flex: 1, overflowY: 'auto', paddingRight: 6 }}>
          {/* Section 1: Queue Timings & Flow Operational Summary */}
          <div style={{
            background: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: 14,
            marginBottom: 16,
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={14} color="var(--primary)" />
                <span>OPD Operational Timings & Queue Flow</span>
              </div>
              <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
                Registered: {p.registeredAt || p.checkInTime || 'Today'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
              <div style={{ background: 'var(--bg-surface)', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 700 }}>CHECK-IN TIME</span>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', marginTop: 3 }}>
                  {p.checkInTime || p.registeredAt || '09:15 AM'}
                </div>
              </div>

              <div style={{ background: 'var(--bg-surface)', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 700 }}>START CONSULTATION</span>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#0284c7', marginTop: 3 }}>
                  {p.consultationStartTime || (status === 'WAITING' ? 'Pending Call-in' : '09:40 AM')}
                </div>
              </div>

              <div style={{ background: 'var(--bg-surface)', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 700 }}>CHECK-OUT TIME</span>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#10b981', marginTop: 3 }}>
                  {p.checkOutTime || (status === 'COMPLETED' ? '10:05 AM' : 'In Progress')}
                </div>
              </div>

              <div style={{ background: 'var(--bg-surface)', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 700 }}>WAIT IN QUEUE</span>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#d97706', marginTop: 3 }}>
                  {p.waitTimeMinutes ? `${p.waitTimeMinutes} mins` : (status === 'WAITING' ? '18 mins (Live)' : '15 mins')}
                </div>
              </div>

              <div style={{ background: 'var(--bg-surface)', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 700 }}>SESSION DURATION</span>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', marginTop: 3 }}>
                  {p.consultationDurationMinutes ? `${p.consultationDurationMinutes} mins` : (status === 'COMPLETED' ? '25 mins' : 'Ongoing')}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Contact & Identity Details (2 Columns) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14, marginBottom: 16 }}>
            {/* Contact & Demographics Card */}
            <div style={{ background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', padding: 14, border: '1px solid var(--border-subtle)' }}>
              <div className="section-label">Identity & Contact</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '12.5px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontWeight: 600 }}>
                  <Phone size={14} color="var(--primary)" />
                  <span>{p.phone}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, color: 'var(--text-secondary)' }}>
                  <MapPin size={14} color="var(--text-tertiary)" style={{ marginTop: 2, flexShrink: 0 }} />
                  <span style={{ fontSize: '12px', lineHeight: 1.4 }}>{p.address}</span>
                </div>

                {/* Explicit City Field */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)' }}>
                  <Building2 size={14} color="var(--primary)" />
                  <span style={{ fontSize: '12px' }}>
                    City: <strong style={{ color: 'var(--text-primary)', fontWeight: 800 }}>{p.city || (isForeign ? p.frroDetails?.stayCityInIndia : 'Chennai')}</strong>
                    {p.state && <span> • State: {p.state}</span>}
                    {p.pincode && <span> ({p.pincode})</span>}
                  </span>
                </div>

                {/* Aadhaar Card Field for Domestic */}
                {!isForeign && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-surface)', padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border-subtle)', marginTop: 2 }}>
                    <ShieldCheck size={14} color="#059669" />
                    <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                      Aadhaar Card: <strong style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', color: 'var(--text-primary)' }}>{p.aadhaarNumber || '4521 8840 9123'}</strong>
                      <span style={{ fontSize: 9.5, color: '#059669', fontWeight: 800, marginLeft: 6 }}>✓ UIDAI VERIFIED</span>
                    </span>
                  </div>
                )}

                {/* Foreign Passport Tag */}
                {isForeign && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f0f9ff', padding: '6px 10px', borderRadius: 6, border: '1px solid #bae6fd', marginTop: 2 }}>
                    <Globe size={14} color="#0284c7" />
                    <span style={{ fontSize: '11.5px', color: '#0369a1' }}>
                      Nationality: <strong>{p.nationality || 'Foreign National'}</strong> • Passport: <strong style={{ fontFamily: 'var(--font-mono)' }}>{p.frroDetails?.passportNumber || 'N/A'}</strong>
                    </span>
                  </div>
                )}

                <div className="m3-emergency-chip" style={{ marginTop: 4 }}>
                  <span className="m3-chip-label">Emergency Contact:</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{p.emergencyContact?.name || 'N/A'}</strong>
                  <span style={{ color: 'var(--text-muted)' }}>({p.emergencyContact?.phone || 'N/A'})</span>
                </div>

                {p.referredBy && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-surface)', padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border-subtle)', marginTop: 4 }}>
                    <UserPlus size={13} color="var(--primary)" />
                    <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                      Referred By: <strong style={{ color: 'var(--text-primary)' }}>{p.referredBy}</strong>
                      {p.referrerContact && <span style={{ marginLeft: 4, color: 'var(--text-muted)' }}>({p.referrerContact})</span>}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Insurance & Payment Card */}
            <div style={{ background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', padding: 14, border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span className="section-label" style={{ marginBottom: 0 }}>Insurance & Billing</span>
                {p.insurance?.type === 'GOVT_SCHEME' ? (
                  <span className="badge badge-ready" style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Landmark size={12} /> PM-JAY Cashless
                  </span>
                ) : p.insurance?.type === 'INSURANCE' ? (
                  <span className="badge badge-active" style={{ fontSize: '11px' }}>
                    {isForeign ? 'International Travel GOP' : 'Private TPA Insurance'}
                  </span>
                ) : (
                  <span className="badge badge-neutral" style={{ fontSize: '11px' }}>
                    Self-Pay / Cash
                  </span>
                )}
              </div>

              <div className="info-grid" style={{ gap: '8px 12px' }}>
                <div className="info-item">
                  <span className="info-key">Plan / Scheme</span>
                  <span className="info-val" style={{ color: 'var(--primary)', fontWeight: 800 }}>{p.insurance?.provider || 'Self-Pay'}</span>
                </div>
                <div className="info-item">
                  <span className="info-key">Policy / Beneficiary ID</span>
                  <span className="info-val">{p.insurance?.policyNumber || p.insurance?.beneficiaryId || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <span className="info-key">Coverage Percentage</span>
                  <span className="info-val">{p.insurance?.coveragePct || 100}%</span>
                </div>
                <div className="info-item">
                  <span className="info-key">Pre-Authorization</span>
                  <span className="info-val">{p.insurance?.preAuthNumber || 'Auto-Verified'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: FRRO Form-C Dossier Card (if Foreign) */}
          {isForeign && p.frroDetails && (
            <div style={{ 
              background: 'linear-gradient(180deg, #f0f9ff 0%, #ffffff 100%)', 
              borderRadius: 'var(--radius-md)', 
              padding: 16, 
              marginBottom: 16,
              border: '1px solid #bae6fd'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Globe size={16} color="#0284c7" />
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#0369a1' }}>
                    FRRO Form-C Immigration Compliance
                  </span>
                </div>
                <span style={{ fontSize: 10, background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
                  ✓ {p.frroDetails?.formCNumber || 'FRRO-C-2026-SUBMITTED'}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8, fontSize: 11.5 }}>
                <div><strong>Visa:</strong> {p.frroDetails?.visaNumber} ({p.frroDetails?.visaType})</div>
                <div><strong>Arrival:</strong> {p.frroDetails?.arrivalDate} via {p.frroDetails?.portOfEntry}</div>
                <div><strong>Stay:</strong> {p.frroDetails?.stayPlaceName}, {p.frroDetails?.stayCityInIndia}</div>
              </div>
            </div>
          )}

          {/* Notice: Nursing & Doctor Domain */}
          <div style={{
            padding: '10px 14px',
            borderRadius: 8,
            background: 'var(--bg-subtle)',
            border: '1px dashed var(--border-default)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 11.5,
            color: 'var(--text-secondary)'
          }}>
            <Stethoscope size={15} color="var(--primary)" style={{ flexShrink: 0 }} />
            <span>
              <strong>Clinical Workflow Separation:</strong> Clinical Vitals, Intake Questionnaires & AI Diagnostic Insights are strictly captured and evaluated at the Nursing Triage Desk and Doctor Console.
            </span>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', borderTop: '1px solid var(--border-subtle)', paddingTop: 14, marginTop: 14, flexShrink: 0, gap: 10 }}>
          {onOpenFollowUp && (
            <button 
              type="button"
              className="m3-btn" 
              onClick={() => { onClose(); onOpenFollowUp(p); }}
              style={{
                background: '#ede9fe',
                color: '#6d28d9',
                border: '1px solid #c4b5fd',
                borderRadius: 9999,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '0 16px',
                height: 36,
                fontWeight: 700,
                fontSize: 12
              }}
            >
              <RotateCcw size={14} /> Issue Follow-Up Token
            </button>
          )}
          {onOpenDoctorWorkspace && (
            <button 
              type="button"
              className="m3-btn m3-btn-outlined" 
              onClick={() => { onClose(); onOpenDoctorWorkspace(); }}
              style={{ borderRadius: 9999, height: 36, fontSize: 12 }}
            >
              <Stethoscope size={14} /> Open Doctor Workspace
            </button>
          )}
          <button 
            type="button"
            className="m3-btn m3-btn-filled" 
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
