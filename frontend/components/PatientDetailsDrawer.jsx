import React from 'react';
import { usePatients } from '../context/PatientContext';
import { 
  User, 
  Phone, 
  MapPin, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Zap, 
  Stethoscope,
  SlidersHorizontal,
  Check,
  Landmark,
  Award,
  X,
  ClipboardList,
  Activity,
  Heart,
  Thermometer,
  Scale,
  Gauge,
  Wind
} from 'lucide-react';

export default function PatientDetailsDrawer({ 
  isOpen, 
  onClose, 
  patient, 
  onOpenQuestionnaire, 
  onOpenDoctorWorkspace 
}) {
  const { selectedPatient } = usePatients();
  const p = patient || selectedPatient;

  if (!isOpen || !p) return null;

  const isQuestionnaireDone = Boolean(p.questionnaire?.completed && p.questionnaire?.responses);
  const hasInsights = p.status === 'INSIGHTS_READY' && p.mlInsights && Array.isArray(p.mlInsights?.riskFlags);

  return (
    <div className="modal-overlay m3-dialog-backdrop" onClick={onClose}>
      <div 
        className="modal-content m3-dialog-container" 
        style={{ maxWidth: 860, width: '92%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: 24, overflow: 'hidden' }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="m3-dialog-header" style={{ padding: '16px 24px 14px', margin: '-24px -24px 16px -24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span className="mrn-tag">{p.mrn}</span>
              {p.status === 'INSIGHTS_READY' && (
                <span className="badge badge-ready">
                  <CheckCircle2 size={12} /> Ready for Oncologist
                </span>
              )}
              {p.status === 'INSIGHTS_GENERATING' && (
                <span className="badge badge-active m3-animate-pulse">
                  <Sparkles size={12} /> ML In-Flight
                </span>
              )}
              {p.status === 'QUESTIONNAIRE_PENDING' && (
                <span className="badge badge-pending">
                  <Clock size={12} /> Intake Needed
                </span>
              )}
              {p.status === 'IN_CONSULTATION' && (
                <span className="badge badge-active">
                  <Stethoscope size={12} /> In Session
                </span>
              )}
              {p.status === 'COMPLETED' && (
                <span className="badge badge-neutral">
                  <Check size={12} /> Finished
                </span>
              )}
              <span className="badge badge-ready" style={{ fontSize: 11 }}>
                <Award size={12} color="#059669" />
                ABHA: {p.abhaId || p.insurance?.abhaId || '91-4820-1928-3819'}
              </span>
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginTop: 6 }}>
              {p.fullName}
            </h3>
            <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 2 }}>
              {p.age} years • {p.gender} • DOB: {p.dob} • Consulting Doctor: <strong>{p.doctorAssigned}</strong>
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
          {/* Top 2-Column Cards: Contact & Insurance */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14, marginBottom: 16 }}>
            {/* Contact Card */}
            <div style={{ background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', padding: 14, border: 'none' }}>
              <div className="section-label">Contact & Emergency</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '12.5px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontWeight: 600 }}>
                  <Phone size={14} color="var(--primary)" />
                  <span>{p.phone}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, color: 'var(--text-secondary)' }}>
                  <MapPin size={14} color="var(--text-tertiary)" style={{ marginTop: 2, flexShrink: 0 }} />
                  <span style={{ fontSize: '12px', lineHeight: 1.4 }}>{p.address}</span>
                </div>
                <div className="m3-emergency-chip" style={{ marginTop: 4 }}>
                  <span className="m3-chip-label">Emergency:</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{p.emergencyContact.name}</strong>
                  <span style={{ color: 'var(--text-muted)' }}>({p.emergencyContact.phone})</span>
                </div>
              </div>
            </div>

            {/* Insurance Card */}
            <div style={{ background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', padding: 14, border: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span className="section-label" style={{ marginBottom: 0 }}>Billing & Coverage Overview</span>
                {p.insurance.type === 'GOVT_SCHEME' ? (
                  <span className="badge badge-ready" style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Landmark size={12} /> Govt PM-JAY Cashless
                  </span>
                ) : p.insurance.type === 'INSURANCE' ? (
                  <span className="badge badge-active" style={{ fontSize: '11px' }}>
                    Private TPA Insurance
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
                  <span className="info-val" style={{ color: 'var(--primary)', fontWeight: 800 }}>{p.insurance.provider}</span>
                </div>
                <div className="info-item">
                  <span className="info-key">Policy / Beneficiary ID</span>
                  <span className="info-val">{p.insurance.policyNumber || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <span className="info-key">Coverage Percentage</span>
                  <span className="info-val">{p.insurance.coveragePct}%</span>
                </div>
                <div className="info-item">
                  <span className="info-key">Annual Deductible</span>
                  <span className="info-val">₹{Number(p.insurance?.deductible || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Triage Vital Signs Card */}
          {p.vitals && (
            <div style={{ background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', padding: 14, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 6 }}>
                <span className="section-label" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Activity size={14} color="var(--primary)" />
                  <span>Triage Vital Signs & Biometrics</span>
                </span>
                <span className="m3-timestamp-tag">Recorded at {p.vitals.recordedAt || p.registeredAt} (Reception Desk)</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(95px, 1fr))', gap: 8 }}>
                <div style={{ background: 'var(--bg-surface)', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                  <div style={{ fontSize: 10.5, color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <Activity size={11} color="#ef4444" /> BP
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text-primary)', marginTop: 2 }}>
                    {p.vitals.bp || '120/80'} <span style={{ fontSize: 9.5, fontWeight: 500, color: 'var(--text-muted)' }}>mmHg</span>
                  </div>
                </div>

                <div style={{ background: 'var(--bg-surface)', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                  <div style={{ fontSize: 10.5, color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <Heart size={11} color="#ec4899" /> Pulse
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text-primary)', marginTop: 2 }}>
                    {p.vitals.pulse || '72'} <span style={{ fontSize: 9.5, fontWeight: 500, color: 'var(--text-muted)' }}>bpm</span>
                  </div>
                </div>

                <div style={{ background: 'var(--bg-surface)', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                  <div style={{ fontSize: 10.5, color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <Thermometer size={11} color="#f97316" /> Temp
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text-primary)', marginTop: 2 }}>
                    {p.vitals.temp || '98.6'} <span style={{ fontSize: 9.5, fontWeight: 500, color: 'var(--text-muted)' }}>°F</span>
                  </div>
                </div>

                <div style={{ background: 'var(--bg-surface)', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                  <div style={{ fontSize: 10.5, color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <Gauge size={11} color="#0284c7" /> SpO2
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text-primary)', marginTop: 2 }}>
                    {p.vitals.spo2 || '99'} <span style={{ fontSize: 9.5, fontWeight: 500, color: 'var(--text-muted)' }}>%</span>
                  </div>
                </div>

                <div style={{ background: 'var(--bg-surface)', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                  <div style={{ fontSize: 10.5, color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <Scale size={11} color="#6366f1" /> Weight
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text-primary)', marginTop: 2 }}>
                    {p.vitals.weight || '62'} <span style={{ fontSize: 9.5, fontWeight: 500, color: 'var(--text-muted)' }}>kg</span>
                  </div>
                </div>

                <div style={{ background: 'var(--bg-surface)', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                  <div style={{ fontSize: 10.5, color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <User size={11} color="#8b5cf6" /> Height
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text-primary)', marginTop: 2 }}>
                    {p.vitals.height || '165'} <span style={{ fontSize: 9.5, fontWeight: 500, color: 'var(--text-muted)' }}>cm</span>
                  </div>
                </div>

                <div style={{ background: 'var(--bg-surface)', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                  <div style={{ fontSize: 10.5, color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    BMI
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: '#059669', marginTop: 2 }}>
                    {p.vitals.bmi || '22.8'} <span style={{ fontSize: 9, fontWeight: 600, color: '#059669' }}>kg/m²</span>
                  </div>
                </div>

                <div style={{ background: 'var(--bg-surface)', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                  <div style={{ fontSize: 10.5, color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <Wind size={11} color="#0d9488" /> Resp Rate
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text-primary)', marginTop: 2 }}>
                    {p.vitals.respRate || '16'} <span style={{ fontSize: 9.5, fontWeight: 500, color: 'var(--text-muted)' }}>/min</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Intake & AI Insights */}
          <div style={{ border: 'none', borderRadius: 'var(--radius-md)', padding: 16, backgroundColor: 'var(--bg-subtle)', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span className="section-label" style={{ marginBottom: 0 }}>Oncology Intake & AI Insights</span>
              {isQuestionnaireDone && (
                <span className="m3-timestamp-tag">Logged at {p.questionnaire.completedAt}</span>
              )}
            </div>

            {!isQuestionnaireDone ? (
              <div className="m3-intake-pending-card">
                <p style={{ fontWeight: 700, color: '#92400e', fontSize: '13px' }}>
                  Intake Questionnaire Not Yet Submitted
                </p>
                <p style={{ fontSize: '12px', color: '#b45309', margin: '4px 0 14px' }}>
                  Administer standardized 20-question intake battery to capture clinical history and baseline symptoms for CDSS triage.
                </p>
                <button
                  className="m3-btn m3-btn-filled"
                  onClick={() => { onClose(); onOpenQuestionnaire(p); }}
                >
                  <ClipboardList size={15} />
                  <span>Launch Clinical Intake Questionnaire</span>
                </button>
              </div>
            ) : (
              <div className="m3-intake-unified-card">
                {/* Chief Complaint Presentation */}
                <div className="m3-intake-complaint-box">
                  <div className="m3-intake-complaint-meta">
                    <span className="m3-intake-site-chip">
                      {p.questionnaire?.responses?.primarySite || 'General'}
                    </span>
                    <span className="m3-intake-duration-chip">
                      {p.questionnaire?.responses?.durationMonths || '< 24 Hours'}
                    </span>
                    <span className="m3-intake-time">
                      {p.questionnaire?.completedAt || 'Just now'}
                    </span>
                  </div>
                  <div className="m3-intake-complaint-body">
                    "{p.questionnaire?.responses?.chiefComplaint || p.chiefComplaint || 'Clinical Consultation'}"
                  </div>
                </div>

                {/* AI Clinical Insights Section */}
                {hasInsights ? (
                  <div className="m3-ai-unified-section">
                    <div className="m3-ai-header">
                      <div className="m3-ai-title">
                        <Sparkles size={16} className="m3-sparkle-icon" />
                        <span>AI Clinical Synthesis</span>
                      </div>
                      <span className="m3-model-pill">
                        {p.mlInsights.modelVersion}
                      </span>
                    </div>

                    <p className="m3-ai-narrative">
                      {p.mlInsights.symptomSummary}
                    </p>

                    {/* Clean M3 Tonal Risk Signals */}
                    <div className="m3-risk-signals-unified">
                      {p.mlInsights.riskFlags.map((flag, idx) => {
                        const isHigh = flag.severity === 'HIGH';
                        const isMed = flag.severity === 'MEDIUM';
                        const tagType = isHigh ? 'high' : isMed ? 'caution' : 'info';
                        return (
                          <div key={idx} className={`m3-risk-row m3-risk-row-${tagType}`}>
                            <div className="m3-risk-row-header">
                              <span className={`m3-risk-tag m3-risk-tag-${tagType}`}>
                                {isHigh ? 'HIGH RISK' : isMed ? 'CAUTION' : 'NOTE'}
                              </span>
                              <span className="m3-risk-row-title">{flag.label}</span>
                            </div>
                            <p className="m3-risk-row-desc">{flag.note}</p>
                          </div>
                        );
                      })}
                    </div>

                    {/* Doctor Destination Footer */}
                    <div className="m3-ai-footer">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Stethoscope size={13} color="var(--primary)" />
                        <span>Assigned to: <strong>{p.doctorAssigned}</strong></span>
                      </div>
                      <span className="m3-status-dot-active" title="Connected to console" />
                    </div>
                  </div>
                ) : p.status === 'INSIGHTS_GENERATING' ? (
                  <div className="m3-ai-generating-banner">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '13px', color: '#0369a1', fontWeight: 800 }}>
                      <Sparkles size={16} className="m3-animate-pulse" />
                      <span>Processing Deep Learning Pipeline...</span>
                    </div>
                    <p style={{ fontSize: '12px', color: '#0369a1', marginTop: 4, lineHeight: 1.4 }}>
                      Parsing questionnaire patterns and compiling clinical insights for the oncologist.
                    </p>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: 14, marginTop: 14, flexShrink: 0 }}>
          <button 
            type="button"
            className="m3-btn m3-btn-outlined" 
            onClick={() => { onClose(); onOpenQuestionnaire(p); }}
          >
            <SlidersHorizontal size={14} /> Review / Modify Intake MCQ
          </button>
          <div style={{ display: 'flex', gap: 10 }}>
            {onOpenDoctorWorkspace && (
              <button 
                type="button"
                className="m3-btn m3-btn-filled" 
                onClick={() => { onClose(); onOpenDoctorWorkspace(); }}
              >
                <Stethoscope size={14} /> Open Doctor Workspace
              </button>
            )}
            <button 
              type="button"
              className="m3-btn m3-btn-tonal" 
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
