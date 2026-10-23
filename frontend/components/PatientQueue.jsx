import React, { useState, useMemo, useEffect } from 'react';
import { usePatients } from '../context/PatientContext';
import { 
  Search, 
  UserPlus, 
  Clock, 
  Stethoscope, 
  User, 
  Printer,
  CheckCircle2,
  Check,
  RotateCcw
} from 'lucide-react';
import SpeechMicButton from './SpeechMicButton';

const AVATAR_COLORS = [
  'linear-gradient(135deg, #0284c7, #0369a1)',
  'linear-gradient(135deg, #10b981, #059669)',
  'linear-gradient(135deg, #6366f1, #4f46e5)',
  'linear-gradient(135deg, #f59e0b, #d97706)',
  'linear-gradient(135deg, #ec4899, #db2777)'
];

export default function PatientQueue({ 
  onOpenRegister, 
  onPrintSlip, 
  externalFilter = null, 
  onOpenPatientDetails,
  onOpenFollowUp 
}) {
  const { patients, selectedPatientId, setSelectedPatientId } = usePatients();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Patient Records based filter: 'ALL' | 'DOMESTIC' | 'FOREIGN' | 'INSURANCE' | 'GOVT_SCHEME' | 'CASH' | 'FOLLOW_UP'
  const [activeFilter, setActiveFilter] = useState('ALL');

  // Synchronize when externalFilter changes from outside
  useEffect(() => {
    if (!externalFilter) return;
    if (['ALL', 'DOMESTIC', 'FOREIGN', 'INSURANCE', 'GOVT_SCHEME', 'CASH', 'FOLLOW_UP'].includes(externalFilter)) {
      setActiveFilter(externalFilter);
    } else {
      setActiveFilter('ALL');
    }
  }, [externalFilter]);

  // Handle local filter selection strictly without route redirects
  const handleFilterSelect = (filterKey) => {
    setActiveFilter(filterKey);
  };

  // Dynamic counts for actual patient master records
  const recordCounts = useMemo(() => {
    return {
      all: patients.length,
      domestic: patients.filter(p => p.patientCategory === 'DOMESTIC' || (!p.frroDetails && p.patientCategory !== 'FOREIGN')).length,
      foreign: patients.filter(p => p.patientCategory === 'FOREIGN' || Boolean(p.frroDetails)).length,
      insurance: patients.filter(p => p.insurance?.type === 'INSURANCE').length,
      govt: patients.filter(p => p.insurance?.type === 'GOVT_SCHEME').length,
      cash: patients.filter(p => p.insurance?.type === 'CASH' || (!p.insurance?.type && !p.insurance?.provider)).length,
      followUp: patients.filter(p => Boolean(p.isFollowUp || p.visitType === 'FOLLOW_UP')).length
    };
  }, [patients]);

  const filteredPatients = useMemo(() => {
    return patients.filter(patient => {
      const isDomestic = patient.patientCategory === 'DOMESTIC' || (!patient.frroDetails && patient.patientCategory !== 'FOREIGN');
      const isForeign = patient.patientCategory === 'FOREIGN' || Boolean(patient.frroDetails);
      const isInsurance = patient.insurance?.type === 'INSURANCE';
      const isGovt = patient.insurance?.type === 'GOVT_SCHEME';
      const isCash = patient.insurance?.type === 'CASH' || (!patient.insurance?.type && !patient.insurance?.provider);
      const isFollowUp = Boolean(patient.isFollowUp || patient.visitType === 'FOLLOW_UP');

      const matchesSearch =
        patient.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (patient.uhid || patient.mrn)?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (patient.opdId || '')?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(patient.tokenNumber || '')?.includes(searchQuery) ||
        (patient.city || '')?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.phone?.includes(searchQuery);

      if (!matchesSearch) return false;

      if (activeFilter === 'ALL') return true;
      if (activeFilter === 'DOMESTIC') return isDomestic;
      if (activeFilter === 'FOREIGN') return isForeign;
      if (activeFilter === 'INSURANCE') return isInsurance;
      if (activeFilter === 'GOVT_SCHEME') return isGovt;
      if (activeFilter === 'CASH') return isCash;
      if (activeFilter === 'FOLLOW_UP') return isFollowUp;

      return true;
    });
  }, [patients, searchQuery, activeFilter]);

  const renderStatusBadge = (status) => {
    if (status === 'IN_CONSULTATION' || status === 'INSIGHTS_READY' || status === 'INSIGHTS_GENERATING') {
      return (
        <span className="badge badge-active m3-animate-fade" style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', fontWeight: 800 }}>
          <Stethoscope size={12} /> 🔵 In Cabin
        </span>
      );
    }
    if (status === 'COMPLETED') {
      return (
        <span className="badge" style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #86efac', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
          <Check size={11} strokeWidth={3} /> 🟢 Done ✓
        </span>
      );
    }
    return (
      <span className="badge" style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', fontWeight: 800 }}>
        🟡 Waiting
      </span>
    );
  };

  const getInitials = (name) => {
    if (!name) return 'PT';
    const parts = name.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="card queue-container">
      {/* Header with Title on Left and Action Buttons on Far Right */}
      <div 
        className="queue-header" 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 16,
          width: '100%'
        }}
      >
        <div>
          <h3 className="section-title" style={{ margin: 0, fontSize: 18, fontWeight: 900, color: 'var(--text-primary)' }}>
            All Patients Directory & Roster
          </h3>
          <div className="section-subtitle" style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
            {filteredPatients.length} of {patients.length} Registered Master Patient Records
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {onOpenFollowUp && (
            <button 
              type="button"
              className="m3-btn" 
              onClick={() => onOpenFollowUp(null)}
              title="Issue Follow-Up Token for existing patient"
              style={{
                height: 34,
                padding: '0 16px',
                fontSize: 12,
                fontWeight: 700,
                borderRadius: 9999,
                background: '#ede9fe',
                color: '#6d28d9',
                border: '1px solid #c4b5fd',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer'
              }}
            >
              <RotateCcw size={13} />
              <span>Issue Follow-Up Token</span>
            </button>
          )}

          <button 
            type="button"
            className="m3-btn m3-btn-filled" 
            onClick={onOpenRegister}
            title="Register new patient record"
            data-tour="new-patient-btn"
            style={{
              height: 34,
              padding: '0 18px',
              fontSize: 12,
              fontWeight: 700,
              borderRadius: 9999,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <UserPlus size={14} />
            <span>New Patient Registration</span>
          </button>
        </div>
      </div>

      <div className="toolbar" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', width: '100%' }}>
          <div className="search-box" style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: '1 1 320px' }}>
            <Search size={16} color="var(--primary)" />
            <input
              type="text"
              placeholder="Search patient by UHID, OPD ID, name, city, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingRight: 34, borderRadius: 9999 }}
            />
            <SpeechMicButton 
              onTranscript={(text) => setSearchQuery(text)} 
              title="Voice search patient directory"
              style={{ position: 'absolute', right: 8 }}
            />
          </div>
        </div>

        {/* Patient Records-Based Filters (Capsule / Pill Buttons with Matching Color Aesthetics) */}
        <div className="filter-tabs" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            className="filter-tab"
            onClick={() => handleFilterSelect('ALL')}
            style={{
              borderRadius: 9999,
              height: 32,
              padding: '0 15px',
              fontSize: 11.5,
              fontWeight: 800,
              cursor: 'pointer',
              background: activeFilter === 'ALL' ? 'var(--primary)' : 'var(--bg-surface)',
              color: activeFilter === 'ALL' ? '#ffffff' : 'var(--text-secondary)',
              border: activeFilter === 'ALL' ? '1px solid var(--primary)' : '1px solid var(--border-default)',
              boxShadow: activeFilter === 'ALL' ? '0 2px 6px rgba(247, 127, 0, 0.25)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            All Records ({recordCounts.all})
          </button>

          <button
            type="button"
            className="filter-tab"
            onClick={() => handleFilterSelect('DOMESTIC')}
            style={{
              borderRadius: 9999,
              height: 32,
              padding: '0 15px',
              fontSize: 11.5,
              fontWeight: 800,
              cursor: 'pointer',
              background: activeFilter === 'DOMESTIC' ? '#0284c7' : '#f0f9ff',
              color: activeFilter === 'DOMESTIC' ? '#ffffff' : '#0369a1',
              border: '1px solid #0284c7',
              boxShadow: activeFilter === 'DOMESTIC' ? '0 2px 6px rgba(2, 132, 199, 0.25)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            🇮🇳 Domestic ({recordCounts.domestic})
          </button>

          <button
            type="button"
            className="filter-tab"
            onClick={() => handleFilterSelect('FOREIGN')}
            style={{
              borderRadius: 9999,
              height: 32,
              padding: '0 15px',
              fontSize: 11.5,
              fontWeight: 800,
              cursor: 'pointer',
              background: activeFilter === 'FOREIGN' ? '#7c3aed' : '#f5f3ff',
              color: activeFilter === 'FOREIGN' ? '#ffffff' : '#6d28d9',
              border: '1px solid #7c3aed',
              boxShadow: activeFilter === 'FOREIGN' ? '0 2px 6px rgba(124, 58, 237, 0.25)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            🌍 Foreign (FRRO) ({recordCounts.foreign})
          </button>

          <button
            type="button"
            className="filter-tab"
            onClick={() => handleFilterSelect('INSURANCE')}
            style={{
              borderRadius: 9999,
              height: 32,
              padding: '0 15px',
              fontSize: 11.5,
              fontWeight: 800,
              cursor: 'pointer',
              background: activeFilter === 'INSURANCE' ? '#0d9488' : '#f0fdfa',
              color: activeFilter === 'INSURANCE' ? '#ffffff' : '#0f766e',
              border: '1px solid #0d9488',
              boxShadow: activeFilter === 'INSURANCE' ? '0 2px 6px rgba(13, 148, 136, 0.25)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            🛡️ Insurance / TPA ({recordCounts.insurance})
          </button>

          <button
            type="button"
            className="filter-tab"
            onClick={() => handleFilterSelect('GOVT_SCHEME')}
            style={{
              borderRadius: 9999,
              height: 32,
              padding: '0 15px',
              fontSize: 11.5,
              fontWeight: 800,
              cursor: 'pointer',
              background: activeFilter === 'GOVT_SCHEME' ? '#16a34a' : '#f0fdf4',
              color: activeFilter === 'GOVT_SCHEME' ? '#ffffff' : '#15803d',
              border: '1px solid #16a34a',
              boxShadow: activeFilter === 'GOVT_SCHEME' ? '0 2px 6px rgba(22, 163, 74, 0.25)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            🏛️ PM-JAY Cashless ({recordCounts.govt})
          </button>

          <button
            type="button"
            className="filter-tab"
            onClick={() => handleFilterSelect('CASH')}
            style={{
              borderRadius: 9999,
              height: 32,
              padding: '0 15px',
              fontSize: 11.5,
              fontWeight: 800,
              cursor: 'pointer',
              background: activeFilter === 'CASH' ? '#ea580c' : '#fff7ed',
              color: activeFilter === 'CASH' ? '#ffffff' : '#c2410c',
              border: '1px solid #ea580c',
              boxShadow: activeFilter === 'CASH' ? '0 2px 6px rgba(234, 88, 12, 0.25)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            💵 Self-Pay / Cash ({recordCounts.cash})
          </button>

          <button
            type="button"
            className="filter-tab"
            onClick={() => handleFilterSelect('FOLLOW_UP')}
            style={{
              borderRadius: 9999,
              height: 32,
              padding: '0 15px',
              fontSize: 11.5,
              fontWeight: 800,
              cursor: 'pointer',
              background: activeFilter === 'FOLLOW_UP' ? '#9333ea' : '#faf5ff',
              color: activeFilter === 'FOLLOW_UP' ? '#ffffff' : '#7e22ce',
              border: '1px solid #9333ea',
              boxShadow: activeFilter === 'FOLLOW_UP' ? '0 2px 6px rgba(147, 51, 234, 0.25)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            🔁 Follow-Up ({recordCounts.followUp})
          </button>
        </div>
      </div>

      <div className="table-wrapper m3-scrollable-body" style={{ maxHeight: 'calc(100vh - 240px)', overflowY: 'auto' }}>
        <table className="patient-table">
          <thead>
            <tr>
              <th style={{ width: 130 }}>TOKEN / UHID</th>
              <th>PATIENT RECORD & IDENTIFIERS</th>
              <th style={{ width: 100 }}>TIME</th>
              <th>CONSULTING DOCTOR</th>
              <th>BILLING MODE</th>
              <th style={{ width: 120 }}>STATUS</th>
              <th style={{ textAlign: 'right', paddingRight: 16 }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredPatients.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '40px 0' }}>
                  <div className="empty-state">
                    <p style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>No patient records found matching current directory filter.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredPatients.map((patient, index) => {
                const isSelected = patient.id === selectedPatientId;
                const avatarBg = AVATAR_COLORS[index % AVATAR_COLORS.length];
                const isForeign = patient.patientCategory === 'FOREIGN' || Boolean(patient.frroDetails);
                const isFollowUp = Boolean(patient.isFollowUp || patient.visitType === 'FOLLOW_UP');

                return (
                  <tr
                    key={patient.id}
                    className={`m3-row-animate ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedPatientId(patient.id);
                      if (onOpenPatientDetails) onOpenPatientDetails(patient);
                    }}
                    title="Click row to inspect complete patient record"
                  >
                    <td>
                      <span className="mrn-tag">#{patient.tokenNumber || 142}</span>
                      <div style={{ fontSize: 9.5, fontWeight: 800, color: '#0f172a', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                        {patient.uhid || patient.mrn}
                      </div>
                      <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {patient.opdId || `OPD-26-${patient.tokenNumber || 142}`}
                      </div>
                    </td>
                    <td>
                      <div className="patient-cell-wrapper">
                        <div className="patient-avatar-chip" style={{ background: avatarBg, overflow: 'hidden' }}>
                          {patient.photoUrl ? (
                            <img src={patient.photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            getInitials(patient.fullName)
                          )}
                        </div>
                        <div className="patient-name-cell">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <span className="patient-name">{patient.fullName}</span>
                            
                            {/* Record Category Badge */}
                            {isForeign ? (
                              <span style={{ fontSize: 9.5, fontWeight: 800, padding: '1px 6px', borderRadius: 4, background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', letterSpacing: '0.02em' }}>
                                🌍 FRRO Form-C
                              </span>
                            ) : null}

                            {/* Follow-Up Encounter Badge */}
                            {isFollowUp && (
                              <span style={{ fontSize: 9.5, fontWeight: 800, padding: '1px 6px', borderRadius: 4, background: '#ede9fe', color: '#6d28d9', border: '1px solid #ddd6fe', letterSpacing: '0.02em' }}>
                                🔁 Follow-Up
                              </span>
                            )}

                            {patient.referredBy && (
                              <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: '#f3f4f6', color: '#4b5563', border: '1px solid #e5e7eb' }}>
                                Ref: {patient.referredBy}
                              </span>
                            )}
                          </div>
                          <span className="patient-demographics-sub">
                            {patient.age}y {patient.gender} • <strong style={{ color: 'var(--text-secondary)' }}>{patient.city || (isForeign ? patient.frroDetails?.stayCityInIndia : 'Chennai')}</strong> • <span style={{ color: 'var(--text-muted)' }}>{patient.phone}</span>
                            {isForeign ? (
                              <span style={{ marginLeft: 6, color: '#0284c7', fontWeight: 600, fontSize: 10 }}>
                                • {patient.nationality || 'Overseas'} (Pass: {patient.frroDetails?.passportNumber || 'FRRO'})
                              </span>
                            ) : (
                              patient.aadhaarNumber && (
                                <span style={{ marginLeft: 6, color: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }}>
                                  • Aadhaar: •••• {patient.aadhaarNumber.slice(-4)}
                                </span>
                              )
                            )}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '10.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        <Clock size={11} color="var(--primary)" />
                        <span>{patient.checkInTime || patient.appointmentTime || '09:00 AM'}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {patient.doctorAssigned?.split('(')[0]}
                      </div>
                      <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 500 }}>
                        {patient.doctorAssigned?.split('(')[1]?.replace(')', '') || 'General OPD'}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '10.5px', fontWeight: 700, color: patient.insurance?.type === 'CASH' ? '#b45309' : '#0369a1' }}>
                        {patient.insurance?.type === 'CASH' ? 'Self-Pay / Cash' : (patient.insurance?.provider?.split(' ')[0] || 'Insurance')}
                      </div>
                      {patient.insurance?.type !== 'CASH' && (
                        <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 600 }}>
                          {patient.insurance?.coveragePct || 80}% Covered
                        </div>
                      )}
                    </td>
                    <td>{renderStatusBadge(patient.status)}</td>
                    <td style={{ width: 175, minWidth: 160, textAlign: 'right', paddingRight: 12, whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', justifyContent: 'flex-end', width: '100%', gap: 6 }}>
                        {onOpenFollowUp && (
                          <button
                            type="button"
                            className="m3-btn m3-btn-sm"
                            style={{
                              height: 26,
                              fontSize: 10.5,
                              padding: '0 8px',
                              gap: 3,
                              background: '#ede9fe',
                              color: '#6d28d9',
                              border: '1px solid #c4b5fd',
                              borderRadius: 6,
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenFollowUp(patient);
                            }}
                            title="Issue Follow-Up Token for this patient record"
                          >
                            <RotateCcw size={10} />
                            <span>Follow-Up</span>
                          </button>
                        )}

                        <button
                          type="button"
                          className="m3-btn m3-btn-outlined"
                          style={{ height: 26, fontSize: 10.5, padding: '0 8px', gap: 3 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPatientId(patient.id);
                            if (onOpenPatientDetails) onOpenPatientDetails(patient);
                          }}
                          title="Open Patient Demographics & Details"
                        >
                          <User size={11} />
                          <span>Details</span>
                        </button>

                        {onPrintSlip && (
                          <button
                            type="button"
                            className="m3-btn m3-btn-tonal"
                            style={{ height: 26, fontSize: 10.5, padding: '0 8px', gap: 3 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              onPrintSlip(patient);
                            }}
                            title="Reprint OPD Token Slip"
                          >
                            <Printer size={11} />
                            <span>Slip</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
