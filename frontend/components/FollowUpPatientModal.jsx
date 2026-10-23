import React, { useState, useEffect, useMemo } from 'react';
import { usePatients } from '../context/PatientContext';
import { 
  X, 
  Search, 
  RotateCcw, 
  User, 
  Phone, 
  MapPin, 
  Clock, 
  Stethoscope, 
  Building2, 
  ShieldCheck, 
  CheckCircle2, 
  Printer,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

const DOCTOR_CABINS = [
  { cabin: 'Cabin 01', name: 'Dr. Kiran Patel (General & Internal Medicine)', spec: 'General & Internal Medicine' },
  { cabin: 'Cabin 02', name: 'Dr. Swaminathan (General & Laparoscopic Surgery)', spec: 'General & Laparoscopic Surgery' },
  { cabin: 'Cabin 03', name: 'Dr. Priya Sharma (Obstetrics & Gynecology)', spec: 'Obstetrics & Gynecology' },
  { cabin: 'Cabin 04', name: 'Dr. Ananya Roy (Cardiology & Heart Failure)', spec: 'Cardiology & Heart Failure' },
  { cabin: 'Cabin 05', name: 'Dr. Anand Deshmukh (Pulmonology & Critical Care)', spec: 'Pulmonology & Critical Care' },
  { cabin: 'Cabin 06', name: 'Dr. Radhika Sen (Pediatrics & Neonatology)', spec: 'Pediatrics & Neonatology' }
];

const QUICK_REASONS = [
  '📋 Review Lab & Diagnostic Reports',
  '💊 Post-Medication Response & Refill',
  '🩹 Post-Procedure / Wound Healing Check',
  '🩺 Chronic Disease BP & Sugar Monitoring',
  '⚠️ Persistent / Recurrent Symptoms Evaluation',
  '👨‍⚕️ Specialist Follow-Up Re-Consultation'
];

export default function FollowUpPatientModal({ 
  isOpen, 
  onClose, 
  initialPatient = null, 
  onSuccess 
}) {
  const { patients, issueFollowUpToken } = usePatients();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [doctorAssigned, setDoctorAssigned] = useState('');
  const [followUpReason, setFollowUpReason] = useState('📋 Review Lab & Diagnostic Reports');
  const [customReason, setCustomReason] = useState('');
  const [billingType, setBillingType] = useState('Standard Follow-Up OPD (₹200)');
  const [priority, setPriority] = useState('STANDARD');

  // Sync initial patient or reset on open
  useEffect(() => {
    if (isOpen) {
      if (initialPatient) {
        setSelectedPatient(initialPatient);
        setDoctorAssigned(initialPatient.doctorAssigned || DOCTOR_CABINS[0].name);
        if (initialPatient.insurance?.type === 'GOVT_SCHEME') {
          setBillingType('Ayushman PM-JAY Cashless (₹0)');
        } else if (initialPatient.insurance?.type === 'INSURANCE') {
          setBillingType('Corporate Insurance / TPA Pre-Auth');
        } else {
          setBillingType('Standard Follow-Up OPD (₹200)');
        }
      } else {
        setSelectedPatient(null);
        setDoctorAssigned(DOCTOR_CABINS[0].name);
        setBillingType('Standard Follow-Up OPD (₹200)');
      }
      setSearchQuery('');
      setCustomReason('');
      setPriority('STANDARD');
    }
  }, [isOpen, initialPatient]);

  // Unique list of master patients for selection
  const selectablePatients = useMemo(() => {
    // Deduplicate by UHID
    const seenUhids = new Set();
    const uniqueList = [];
    for (const p of patients) {
      const uhid = p.uhid || p.mrn || p.id;
      if (!seenUhids.has(uhid)) {
        seenUhids.add(uhid);
        uniqueList.push(p);
      }
    }

    if (!searchQuery.trim()) return uniqueList;
    const q = searchQuery.toLowerCase().trim();
    return uniqueList.filter(p => 
      p.fullName?.toLowerCase().includes(q) ||
      (p.uhid || p.mrn)?.toLowerCase().includes(q) ||
      (p.opdId || '')?.toLowerCase().includes(q) ||
      p.phone?.includes(q) ||
      (p.city || '')?.toLowerCase().includes(q)
    );
  }, [patients, searchQuery]);

  const handleSelectPatient = (p) => {
    setSelectedPatient(p);
    setDoctorAssigned(p.doctorAssigned || DOCTOR_CABINS[0].name);
    if (p.insurance?.type === 'GOVT_SCHEME') {
      setBillingType('Ayushman PM-JAY Cashless (₹0)');
    } else if (p.insurance?.type === 'INSURANCE') {
      setBillingType('Corporate Insurance / TPA Pre-Auth');
    } else {
      setBillingType('Standard Follow-Up OPD (₹200)');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedPatient) return;

    const resolvedReason = customReason.trim() ? customReason.trim() : followUpReason;

    const newEncounter = issueFollowUpToken(selectedPatient.id, {
      doctorAssigned,
      followUpReason: resolvedReason,
      billingType,
      priority
    });

    if (newEncounter) {
      if (onSuccess) {
        onSuccess(newEncounter);
      }
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="modal-overlay m3-dialog-backdrop"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: 16
      }}
      onClick={onClose}
    >
      <div 
        className="card m3-dialog-container"
        style={{
          maxWidth: 680,
          width: '100%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          borderRadius: 16,
          overflow: 'hidden',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.25)'
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div style={{
          padding: '16px 22px',
          background: 'linear-gradient(90deg, #7c3aed 0%, #9333ea 50%, #7c3aed 100%)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          boxShadow: '0 2px 8px rgba(124, 58, 237, 0.25)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <RotateCcw size={19} color="#ffffff" strokeWidth={2.5} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, letterSpacing: '-0.01em', color: '#ffffff' }}>
                OPD Follow-Up Encounter & Token Issuance
              </h3>
              <div style={{ fontSize: 11, opacity: 0.9, marginTop: 1, color: '#f5f3ff' }}>
                Lookup registered Master UHID & issue an active follow-up queue token
              </div>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="icon-btn"
            style={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="m3-scrollable-body" style={{ padding: 22, overflowY: 'auto', flex: 1 }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            
            {/* Step 1: Search / Select Patient */}
            {!selectedPatient ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    1. Search Existing Patient Record
                  </label>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                    {selectablePatients.length} Registered Patients
                  </span>
                </div>

                <div style={{ position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }} />
                  <input
                    type="text"
                    placeholder="Search by Master UHID, patient name, phone, or OPD ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '10px 14px 10px 38px',
                      borderRadius: 10,
                      border: '1.5px solid var(--border-default)',
                      background: 'var(--bg-subtle)',
                      fontSize: 13,
                      outline: 'none',
                      color: 'var(--text-primary)'
                    }}
                  />
                  {searchQuery && (
                    <button 
                      type="button" 
                      onClick={() => setSearchQuery('')}
                      style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer' }}
                    >
                      <X size={14} color="var(--text-muted)" />
                    </button>
                  )}
                </div>

                {/* Patient Suggestions List */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  maxHeight: 260,
                  overflowY: 'auto',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 10,
                  padding: 8,
                  background: 'var(--bg-subtle)'
                }}>
                  {selectablePatients.length === 0 ? (
                    <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12.5 }}>
                      No registered patient matches "{searchQuery}". Ensure spelling or search by Master UHID.
                    </div>
                  ) : (
                    selectablePatients.map(pt => {
                      const isFrro = pt.patientCategory === 'FOREIGN' || Boolean(pt.frroDetails);
                      return (
                        <div
                          key={pt.id}
                          onClick={() => handleSelectPatient(pt)}
                          style={{
                            padding: '10px 14px',
                            borderRadius: 8,
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border-default)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 12,
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.borderColor = '#7c3aed'}
                          onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-default)'}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{
                              width: 38,
                              height: 38,
                              borderRadius: '50%',
                              background: '#ede9fe',
                              color: '#6d28d9',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: 13,
                              flexShrink: 0
                            }}>
                              {pt.fullName?.slice(0, 2).toUpperCase() || 'PT'}
                            </div>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <strong style={{ fontSize: 13.5, color: 'var(--text-primary)' }}>{pt.fullName}</strong>
                                <span style={{
                                  fontSize: 10,
                                  fontWeight: 800,
                                  padding: '1px 6px',
                                  borderRadius: 4,
                                  background: '#0f172a',
                                  color: '#ffffff',
                                  fontFamily: 'var(--font-mono)'
                                }}>
                                  {pt.uhid || pt.mrn}
                                </span>
                                {isFrro ? (
                                  <span style={{ fontSize: 9.5, padding: '1px 5px', borderRadius: 4, background: '#e0f2fe', color: '#0369a1', fontWeight: 700 }}>
                                    🌍 FRRO
                                  </span>
                                ) : (
                                  <span style={{ fontSize: 9.5, padding: '1px 5px', borderRadius: 4, background: '#fef3c7', color: '#92400e', fontWeight: 700 }}>
                                    🇮🇳 Domestic
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                                {pt.age}y {pt.gender} • {pt.city || 'Chennai'} • 📞 {pt.phone}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 11, color: '#7c3aed', fontWeight: 700 }}>Select →</span>
                            <ChevronRight size={15} color="#7c3aed" />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ) : (
              /* Selected Patient Summary Card */
              <div style={{
                background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)',
                borderRadius: 12,
                border: '1.5px solid #d8b4fe',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: '#7c3aed',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    fontSize: 15,
                    flexShrink: 0
                  }}>
                    {selectedPatient.fullName?.slice(0, 2).toUpperCase() || 'PT'}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: 15, color: '#4c1d95', fontWeight: 800 }}>
                        {selectedPatient.fullName}
                      </strong>
                      <span style={{
                        fontSize: 10.5,
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: 9999,
                        background: '#581c87',
                        color: '#ffffff',
                        fontFamily: 'var(--font-mono)'
                      }}>
                        Master UHID: {selectedPatient.uhid || selectedPatient.mrn}
                      </span>
                      {selectedPatient.isFollowUp && (
                        <span style={{ fontSize: 9.5, padding: '2px 6px', borderRadius: 4, background: '#ede9fe', color: '#6d28d9', fontWeight: 800 }}>
                          🔁 Prior Follow-Up Encounter
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11.5, color: '#6b21a8', marginTop: 3 }}>
                      {selectedPatient.age}y {selectedPatient.gender} • {selectedPatient.city || 'Chennai'} • 📞 {selectedPatient.phone}
                    </div>
                    <div style={{ fontSize: 10.5, color: '#7e22ce', marginTop: 2 }}>
                      Previous Assigned: <strong>{selectedPatient.doctorAssigned || 'General OPD'}</strong>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedPatient(null)}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #c084fc',
                    borderRadius: 8,
                    padding: '5px 12px',
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#6b21a8',
                    cursor: 'pointer'
                  }}
                >
                  Change Patient
                </button>
              </div>
            )}

            {/* Step 2: Follow-Up Encounter Configuration (Only when patient is selected) */}
            {selectedPatient && (
              <>
                {/* Consulting Doctor Assignment */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', display: 'block', marginBottom: 6 }}>
                    2. Consulting OPD Doctor & Cabin
                  </label>
                  <select
                    value={doctorAssigned}
                    onChange={(e) => setDoctorAssigned(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 8,
                      border: '1.5px solid var(--border-default)',
                      background: 'var(--bg-surface)',
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      outline: 'none'
                    }}
                  >
                    {DOCTOR_CABINS.map(d => (
                      <option key={d.name} value={d.name}>
                        {d.cabin}: {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Reason for Follow-Up */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', display: 'block', marginBottom: 6 }}>
                    3. Reason for Follow-Up Visit
                  </label>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                    {QUICK_REASONS.map(r => {
                      const isSel = followUpReason === r && !customReason;
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => {
                            setFollowUpReason(r);
                            setCustomReason('');
                          }}
                          style={{
                            padding: '5px 10px',
                            borderRadius: 9999,
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer',
                            background: isSel ? '#7c3aed' : 'var(--bg-subtle)',
                            color: isSel ? '#ffffff' : 'var(--text-secondary)',
                            border: isSel ? '1px solid #7c3aed' : '1px solid var(--border-default)',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {r}
                        </button>
                      );
                    })}
                  </div>
                  <input
                    type="text"
                    placeholder="Or type specific follow-up notes / doctor's clinical instructions..."
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--border-default)',
                      background: 'var(--bg-subtle)',
                      fontSize: 12,
                      color: 'var(--text-primary)',
                      outline: 'none'
                    }}
                  />
                </div>

                {/* Follow-Up Billing & Priority Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--text-primary)', display: 'block', marginBottom: 5 }}>
                      OPD Billing / Follow-Up Fee
                    </label>
                    <select
                      value={billingType}
                      onChange={(e) => setBillingType(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: 8,
                        border: '1px solid var(--border-default)',
                        background: 'var(--bg-surface)',
                        fontSize: 11.5,
                        color: 'var(--text-primary)',
                        outline: 'none'
                      }}
                    >
                      <option value="Complimentary Follow-Up (Within 7 Days) — ₹0">Complimentary Follow-Up (Within 7 Days) — ₹0</option>
                      <option value="Standard Follow-Up OPD (₹200)">Standard Follow-Up OPD (₹200)</option>
                      <option value="Ayushman PM-JAY Cashless (₹0)">Ayushman PM-JAY Cashless (₹0)</option>
                      <option value="Corporate Insurance / TPA Pre-Auth">Corporate Insurance / TPA Pre-Auth</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--text-primary)', display: 'block', marginBottom: 5 }}>
                      Encounter Queue Priority
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: 8,
                        border: '1px solid var(--border-default)',
                        background: 'var(--bg-surface)',
                        fontSize: 11.5,
                        color: 'var(--text-primary)',
                        outline: 'none'
                      }}
                    >
                      <option value="STANDARD">Normal Queue</option>
                      <option value="SENIOR_CITIZEN">Senior Citizen Priority</option>
                      <option value="URGENT">Fast-Track / Urgent</option>
                    </select>
                  </div>
                </div>

                <div style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  background: '#f8fafc',
                  border: '1px dashed #cbd5e1',
                  fontSize: 11,
                  color: '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <AlertCircle size={15} color="#7c3aed" style={{ flexShrink: 0 }} />
                  <span>
                    Issuing this token will retain the patient's lifetime <strong>Master UHID ({selectedPatient.uhid || selectedPatient.mrn})</strong> while creating a fresh OPD Encounter token for today's clinic schedule.
                  </span>
                </div>
              </>
            )}

            {/* Modal Actions */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
              <button
                type="button"
                onClick={onClose}
                className="m3-btn m3-btn-outlined"
                style={{ height: 36, padding: '0 16px', fontSize: 12, borderRadius: 9999 }}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={!selectedPatient}
                className="m3-btn"
                style={{
                  height: 36,
                  padding: '0 20px',
                  fontSize: 12,
                  fontWeight: 800,
                  borderRadius: 9999,
                  background: selectedPatient ? 'linear-gradient(135deg, #7c3aed, #9333ea)' : '#cbd5e1',
                  color: '#ffffff',
                  border: 'none',
                  cursor: selectedPatient ? 'pointer' : 'not-allowed',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: selectedPatient ? '0 4px 12px rgba(124, 58, 237, 0.35)' : 'none'
                }}
              >
                <Printer size={14} />
                <span>Issue Follow-Up Token & Print Slip →</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
