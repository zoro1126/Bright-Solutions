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
  Check
} from 'lucide-react';
import SpeechMicButton from './SpeechMicButton';

const AVATAR_COLORS = [
  'linear-gradient(135deg, #0284c7, #0369a1)',
  'linear-gradient(135deg, #10b981, #059669)',
  'linear-gradient(135deg, #6366f1, #4f46e5)',
  'linear-gradient(135deg, #f59e0b, #d97706)',
  'linear-gradient(135deg, #ec4899, #db2777)'
];

export default function PatientQueue({ onOpenRegister, onPrintSlip, externalFilter = null, onOpenPatientDetails }) {
  const { patients, selectedPatientId, setSelectedPatientId } = usePatients();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'WAITING' | 'CONSULTATION' | 'COMPLETED'

  // Synchronize when externalFilter changes from outside
  useEffect(() => {
    if (!externalFilter) return;
    if (externalFilter === 'WAITING' || externalFilter === 'CONSULTATION' || externalFilter === 'COMPLETED') {
      setActiveFilter(externalFilter);
    } else {
      setActiveFilter('ALL');
    }
  }, [externalFilter]);

  // Handle local filter selection strictly without route redirects
  const handleFilterSelect = (filterKey) => {
    setActiveFilter(filterKey);
  };

  // Dynamic counts for clean operational categories
  const counts = useMemo(() => {
    return {
      all: patients.length,
      waiting: patients.filter(p => p.status === 'WAITING' || p.status === 'REGISTERED' || p.status === 'QUESTIONNAIRE_PENDING').length,
      consultation: patients.filter(p => p.status === 'IN_CONSULTATION' || p.status === 'INSIGHTS_READY' || p.status === 'INSIGHTS_GENERATING').length,
      completed: patients.filter(p => p.status === 'COMPLETED').length
    };
  }, [patients]);

  const filteredPatients = useMemo(() => {
    return patients.filter(patient => {
      const isWaiting = patient.status === 'WAITING' || patient.status === 'REGISTERED' || patient.status === 'QUESTIONNAIRE_PENDING';
      const isConsultation = patient.status === 'IN_CONSULTATION' || patient.status === 'INSIGHTS_READY' || patient.status === 'INSIGHTS_GENERATING';
      const isCompleted = patient.status === 'COMPLETED';

      const matchesSearch =
        patient.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (patient.uhid || patient.mrn)?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (patient.opdId || '')?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(patient.tokenNumber || '')?.includes(searchQuery) ||
        patient.phone?.includes(searchQuery);

      if (!matchesSearch) return false;

      if (activeFilter === 'ALL') return true;
      if (activeFilter === 'WAITING') return isWaiting;
      if (activeFilter === 'CONSULTATION') return isConsultation;
      if (activeFilter === 'COMPLETED') return isCompleted;

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
      <span className="badge" style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', fontWeight: 800 }}>
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
      <div className="queue-header">
        <div>
          <h3 className="section-title">All Patients Directory & Roster</h3>
          <div className="section-subtitle">
            {filteredPatients.length} of {patients.length} Active OPD Records
          </div>
        </div>
        <button 
          className="m3-btn m3-btn-filled m3-btn-sm" 
          onClick={onOpenRegister}
          title="Register new patient record"
          data-tour="new-patient-btn"
        >
          <UserPlus size={14} />
          <span>New Patient Registration</span>
        </button>
      </div>

      <div className="toolbar">
        <div className="search-box" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={16} color="var(--primary)" />
          <input
            type="text"
            placeholder="Search patient by UHID, OPD ID, name, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingRight: 34 }}
          />
          <SpeechMicButton 
            onTranscript={(text) => setSearchQuery(text)} 
            title="Voice search patient queue"
            style={{ position: 'absolute', right: 8 }}
          />
        </div>

        {/* Clean Operational Filters (No Intake/AI tabs, No blank page triggers) */}
        <div className="filter-tabs">
          <button
            type="button"
            className={`filter-tab ${activeFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => handleFilterSelect('ALL')}
          >
            All ({counts.all})
          </button>
          <button
            type="button"
            className={`filter-tab ${activeFilter === 'WAITING' ? 'active' : ''}`}
            onClick={() => handleFilterSelect('WAITING')}
            style={activeFilter === 'WAITING' ? { background: '#fef3c7', color: '#92400e', borderColor: '#f59e0b', fontWeight: 800 } : undefined}
          >
            🟡 Waiting ({counts.waiting})
          </button>
          <button
            type="button"
            className={`filter-tab ${activeFilter === 'CONSULTATION' ? 'active' : ''}`}
            onClick={() => handleFilterSelect('CONSULTATION')}
            style={activeFilter === 'CONSULTATION' ? { background: '#e0f2fe', color: '#0369a1', borderColor: '#0284c7', fontWeight: 800 } : undefined}
          >
            🔵 In Consultation ({counts.consultation})
          </button>
          <button
            type="button"
            className={`filter-tab ${activeFilter === 'COMPLETED' ? 'active' : ''}`}
            onClick={() => handleFilterSelect('COMPLETED')}
            style={activeFilter === 'COMPLETED' ? { background: '#dcfce7', color: '#15803d', borderColor: '#10b981', fontWeight: 800 } : undefined}
          >
            🟢 Completed ({counts.completed})
          </button>
        </div>
      </div>

      <div className="table-wrapper m3-scrollable-body" style={{ maxHeight: 'calc(100vh - 270px)', overflowY: 'auto' }}>
        <table className="patient-table">
          <thead>
            <tr>
              <th style={{ width: 130 }}>TOKEN / UHID</th>
              <th>PATIENT INFORMATION</th>
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
                    <p style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>No patients found matching current filter.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredPatients.map((patient, index) => {
                const isSelected = patient.id === selectedPatientId;
                const avatarBg = AVATAR_COLORS[index % AVATAR_COLORS.length];

                return (
                  <tr
                    key={patient.id}
                    className={`m3-row-animate ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedPatientId(patient.id);
                      if (onOpenPatientDetails) onOpenPatientDetails(patient);
                    }}
                    title="Click row to open Patient Details"
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
                            {patient.patientCategory === 'FOREIGN' || patient.frroDetails ? (
                              <span style={{ fontSize: 9.5, fontWeight: 800, padding: '1px 6px', borderRadius: 4, background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', letterSpacing: '0.02em' }}>
                                🌍 FRRO Form-C
                              </span>
                            ) : null}
                            {patient.referredBy && (
                              <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: '#f3f4f6', color: '#4b5563', border: '1px solid #e5e7eb' }}>
                                Ref: {patient.referredBy}
                              </span>
                            )}
                          </div>
                          <span className="patient-demographics-sub">
                            {patient.age}y {patient.gender} • <strong style={{ color: 'var(--text-secondary)' }}>{patient.city || (patient.frroDetails ? patient.frroDetails.stayCityInIndia : 'Chennai')}</strong> • <span style={{ color: 'var(--text-muted)' }}>{patient.phone}</span>
                            {patient.patientCategory === 'FOREIGN' || patient.frroDetails ? (
                              <span style={{ marginLeft: 6, color: '#0284c7', fontWeight: 600, fontSize: 10 }}>
                                • {patient.nationality || 'UK'} (Pass: {patient.frroDetails?.passportNumber || 'FRRO'})
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
                    <td style={{ width: 140, minWidth: 130, textAlign: 'right', paddingRight: 12, whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', justifyContent: 'flex-end', width: '100%', gap: 6 }}>
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
