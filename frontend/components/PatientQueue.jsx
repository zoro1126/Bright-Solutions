import React, { useState, useMemo, useEffect } from 'react';
import { usePatients } from '../context/PatientContext';
import { 
  Search, 
  UserPlus, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Sparkles, 
  Stethoscope, 
  Zap,
  ArrowRight,
  User,
  ClipboardList
} from 'lucide-react';
import SpeechMicButton from './SpeechMicButton';

const AVATAR_COLORS = [
  'linear-gradient(135deg, #0284c7, #0369a1)',
  'linear-gradient(135deg, #10b981, #059669)',
  'linear-gradient(135deg, #6366f1, #4f46e5)',
  'linear-gradient(135deg, #f59e0b, #d97706)',
  'linear-gradient(135deg, #ec4899, #db2777)'
];

export default function PatientQueue({ onOpenRegister, onOpenQuestionnaire, externalFilter = null, onFilterChange, onOpenPatientDetails }) {
  const { patients, selectedPatientId, setSelectedPatientId } = usePatients();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');

  // Synchronize when externalFilter changes from sidebar navigation
  useEffect(() => {
    if (!externalFilter) return;
    if (externalFilter === 'queue' || externalFilter === 'ALL') {
      setActiveFilter('ALL');
    } else if (externalFilter === 'pending' || externalFilter === 'PENDING') {
      setActiveFilter('PENDING');
    } else if (externalFilter === 'insights' || externalFilter === 'INSIGHTS') {
      setActiveFilter('INSIGHTS');
    } else if (externalFilter === 'doctors' || externalFilter === 'CONSULTATION') {
      setActiveFilter('CONSULTATION');
    } else if (externalFilter === 'billing' || externalFilter === 'COMPLETED') {
      setActiveFilter('COMPLETED');
    }
  }, [externalFilter]);

  const handleFilterSelect = (filterKey) => {
    setActiveFilter(filterKey);
    if (onFilterChange) {
      const tabMap = {
        'ALL': 'queue',
        'PENDING': 'pending',
        'INSIGHTS': 'insights',
        'CONSULTATION': 'doctors',
        'COMPLETED': 'billing'
      };
      onFilterChange(tabMap[filterKey] || filterKey);
    }
  };

  // Dynamic counts for each filter category
  const counts = useMemo(() => {
    return {
      all: patients.length,
      pending: patients.filter(p => p.status === 'QUESTIONNAIRE_PENDING' || p.status === 'REGISTERED').length,
      insights: patients.filter(p => p.status === 'INSIGHTS_READY' || p.status === 'INSIGHTS_GENERATING').length,
      consultation: patients.filter(p => p.status === 'IN_CONSULTATION').length,
      completed: patients.filter(p => p.status === 'COMPLETED').length
    };
  }, [patients]);

  const filteredPatients = useMemo(() => {
    return (patients || []).filter(patient => {
      if (!patient) return false;
      const pName = (patient.fullName || patient.full_name || '').toLowerCase();
      const pMrn = (patient.mrn || patient.uhid || '').toLowerCase();
      const pPhone = (patient.phone || '');
      const q = (searchQuery || '').toLowerCase();
      const matchesSearch =
        pName.includes(q) ||
        pMrn.includes(q) ||
        pPhone.includes(q);

      if (!matchesSearch) return false;

      if (activeFilter === 'ALL') return true;
      if (activeFilter === 'PENDING') return patient.status === 'QUESTIONNAIRE_PENDING' || patient.status === 'REGISTERED';
      if (activeFilter === 'INSIGHTS') return patient.status === 'INSIGHTS_READY' || patient.status === 'INSIGHTS_GENERATING';
      if (activeFilter === 'CONSULTATION') return patient.status === 'IN_CONSULTATION';
      if (activeFilter === 'COMPLETED') return patient.status === 'COMPLETED';

      return true;
    });
  }, [patients, searchQuery, activeFilter]);

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'INSIGHTS_READY':
        return (
          <span className="badge badge-ready m3-animate-fade">
            <CheckCircle2 size={13} strokeWidth={2.4} /> Insights Ready
          </span>
        );
      case 'INSIGHTS_GENERATING':
        return (
          <span className="badge badge-active m3-animate-pulse">
            <Sparkles size={13} strokeWidth={2.4} /> Running AI...
          </span>
        );
      case 'QUESTIONNAIRE_PENDING':
        return (
          <span className="badge badge-pending m3-animate-fade">
            <Clock size={13} strokeWidth={2.4} /> Needs Intake
          </span>
        );
      case 'REGISTERED':
        return (
          <span className="badge badge-neutral m3-animate-fade">
            <FileText size={13} /> Registered
          </span>
        );
      case 'IN_CONSULTATION':
        return (
          <span className="badge badge-active m3-animate-fade">
            <Stethoscope size={13} /> In Session
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="badge badge-neutral">
            ✓ Finished
          </span>
        );
      default:
        return <span className="badge badge-neutral">{status}</span>;
    }
  };

  const getInitials = (name) => {
    const parts = name.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="card m3-table-card">
      <div className="card-header">
        <div className="card-title-group">
          <div>
            <h2 className="card-title">Patient Queue & Triage</h2>
            <div className="card-subtitle-count">{filteredPatients.length} Active Clinic Records</div>
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
            placeholder="Search patient by full name, phone number, or MRN..."
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
            className={`filter-tab ${activeFilter === 'PENDING' ? 'active' : ''}`}
            onClick={() => handleFilterSelect('PENDING')}
          >
            Pending Intake ({counts.pending})
          </button>
          <button
            type="button"
            className={`filter-tab ${activeFilter === 'INSIGHTS' ? 'active' : ''}`}
            onClick={() => handleFilterSelect('INSIGHTS')}
          >
            Insights Ready ({counts.insights})
          </button>
          <button
            type="button"
            className={`filter-tab ${activeFilter === 'CONSULTATION' ? 'active' : ''}`}
            onClick={() => handleFilterSelect('CONSULTATION')}
          >
            In Consultation ({counts.consultation})
          </button>
          <button
            type="button"
            className={`filter-tab ${activeFilter === 'COMPLETED' ? 'active' : ''}`}
            onClick={() => handleFilterSelect('COMPLETED')}
          >
            Billed ({counts.completed})
          </button>
        </div>
      </div>

      <div className="table-wrapper m3-scrollable-body" style={{ maxHeight: 'calc(100vh - 270px)', overflowY: 'auto' }}>
        <table className="patient-table">
          <thead>
            <tr>
              <th style={{ width: 80, minWidth: 70 }}>MRN</th>
              <th style={{ minWidth: 150 }}>Patient Information</th>
              <th style={{ width: 75, minWidth: 65 }}>Time</th>
              <th style={{ minWidth: 110 }}>Consulting Doctor</th>
              <th style={{ minWidth: 95 }}>Billing Mode</th>
              <th style={{ minWidth: 95 }}>Status</th>
              <th style={{ width: 135, minWidth: 125, textAlign: 'right', paddingRight: 10 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPatients.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="empty-state">
                    <AlertCircle size={36} className="empty-icon" />
                    <p style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 14 }}>No matching patients found</p>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 4 }}>
                      Adjust your search query or select another filter tab.
                    </p>
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
                    title="Click row to open Patient Details & AI Dossier Pop-up"
                  >
                    <td>
                      <span className="mrn-tag">{patient.mrn}</span>
                    </td>
                    <td>
                      <div className="patient-cell-wrapper">
                        <div className="patient-avatar-chip" style={{ background: avatarBg }}>
                          {getInitials(patient?.fullName || patient?.full_name || 'PT')}
                        </div>
                        <div className="patient-name-cell">
                          <span className="patient-name">{patient?.fullName || patient?.full_name || 'Unknown Patient'}</span>
                          <span className="patient-demographics-sub">
                            {patient.age}y {patient.gender} • <span style={{ color: 'var(--text-muted)' }}>{patient.phone}</span>
                            {patient.vitals && (
                              <span style={{ marginLeft: 6, color: '#059669', fontWeight: 600 }}>
                                • BP {patient.vitals.bp} | HR {patient.vitals.pulse}
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        <Clock size={11} color="var(--primary)" />
                        <span>{patient.appointmentTime}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {patient.doctorAssigned.split(' ')[0]} {patient.doctorAssigned.split(' ')[1]}
                      </div>
                      <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 500 }}>
                        {patient.doctorAssigned.split('(')[1]?.replace(')', '') || 'Oncology'}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '10.5px', fontWeight: 700, color: patient.insurance.type === 'CASH' ? '#b45309' : '#0369a1' }}>
                        {patient.insurance.type === 'CASH' ? 'Self-Pay / Cash' : patient.insurance.provider.split(' ')[0]}
                      </div>
                      {patient.insurance.type !== 'CASH' && (
                        <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 600 }}>
                          {patient.insurance.coveragePct}% Covered
                        </div>
                      )}
                    </td>
                    <td>{renderStatusBadge(patient.status)}</td>
                    <td style={{ width: 135, minWidth: 125, textAlign: 'right', paddingRight: 8, whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', justifyContent: 'flex-end', width: '100%', gap: 4 }}>
                        <button
                          type="button"
                          className="m3-btn m3-btn-outlined"
                          style={{ height: 26, fontSize: 10, padding: '0 7px', gap: 3 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPatientId(patient.id);
                            if (onOpenPatientDetails) onOpenPatientDetails(patient);
                          }}
                          title="Open Patient Demographics & Details Pop-up"
                        >
                          <User size={11} />
                          <span>Details</span>
                        </button>

                        {(!patient.questionnaire?.completed && !patient.questionnaire_completed) ? (
                          <button
                            type="button"
                            className="m3-btn m3-btn-intake"
                            style={{ height: 26, fontSize: 10, padding: '0 7px', gap: 3 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPatientId(patient.id);
                              onOpenQuestionnaire(patient);
                            }}
                            title="Launch Clinical Intake & Triage Questionnaire"
                          >
                            <ClipboardList size={11} className="intake-btn-icon" />
                            <span>Intake</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="m3-btn m3-btn-tonal"
                            style={{ height: 26, fontSize: 10, padding: '0 7px', gap: 3 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPatientId(patient.id);
                              if (onOpenPatientDetails) onOpenPatientDetails(patient);
                            }}
                            title="Open Patient Clinical AI Dossier"
                          >
                            <Sparkles size={11} color="var(--primary)" />
                            <span>AI Dossier</span>
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
