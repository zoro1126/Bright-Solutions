import React, { useState } from 'react';
import { Search, Eye, Filter, UserCheck, AlertTriangle, ArrowUpDown, Clock } from 'lucide-react';

export default function PatientQueueTable({
  patients,
  searchTerm,
  onSearchChange,
  onViewPatient,
  onOpenRegisterModal
}) {
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'NORMAL' | 'ELEVATED'

  // Filter patients based on tab selection
  const filteredPatients = (patients || []).filter((p) => {
    if (filterType === 'NORMAL') {
      return (
        !p.bp_stage || 
        p.bp_stage.toLowerCase().includes('normal')
      );
    }
    if (filterType === 'ELEVATED') {
      return (
        p.bp_stage && 
        (p.bp_stage.toLowerCase().includes('stage') || 
         p.bp_stage.toLowerCase().includes('crisis') || 
         p.bp_stage.toLowerCase().includes('elevated'))
      );
    }
    return true;
  });

  const getBpChipClass = (stage) => {
    if (!stage) return 'alert-normal';
    const s = stage.toLowerCase();
    if (s.includes('crisis') || s.includes('stage 2')) return 'alert-high';
    if (s.includes('stage 1') || s.includes('elevated')) return 'alert-elevated';
    return 'alert-normal';
  };

  const getBmiBadgeClass = (category) => {
    if (!category) return 'bmi-normal';
    const c = category.toLowerCase();
    if (c.includes('obese')) return 'bmi-obese';
    if (c.includes('overweight')) return 'bmi-overweight';
    if (c.includes('underweight')) return 'bmi-underweight';
    return 'bmi-normal';
  };

  return (
    <div className="table-card">
      {/* Table Toolbar */}
      <div className="table-toolbar">
        <div className="table-toolbar-left">
          <div className="search-input-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search by Patient Name, UHID, or Mobile Number..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="filter-tabs">
          <button
            type="button"
            className={`filter-tab ${filterType === 'ALL' ? 'active' : ''}`}
            onClick={() => setFilterType('ALL')}
          >
            All Registered ({patients?.length || 0})
          </button>
          <button
            type="button"
            className={`filter-tab ${filterType === 'NORMAL' ? 'active' : ''}`}
            onClick={() => setFilterType('NORMAL')}
          >
            Normal Vitals
          </button>
          <button
            type="button"
            className={`filter-tab ${filterType === 'ELEVATED' ? 'active' : ''}`}
            onClick={() => setFilterType('ELEVATED')}
          >
            High BP / Alert
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="data-table-container">
        {filteredPatients.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1.5rem', color: '#64748B' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0A2540', marginBottom: '0.5rem', fontFamily: 'var(--font-serif)' }}>
              No Registered Patients Found
            </div>
            <p style={{ fontSize: '0.88rem', marginBottom: '1.25rem' }}>
              {searchTerm 
                ? `No patient records match the query "${searchTerm}".`
                : 'No patients have been registered in this OPD session yet.'}
            </p>
            <button className="btn btn-primary" onClick={onOpenRegisterModal}>
              + Register New Patient
            </button>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Token</th>
                <th>Patient Profile</th>
                <th>Blood & Contact</th>
                <th>Assigned Doctor</th>
                <th>Triage Vitals Snapshot</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map((patient) => (
                <tr key={patient.patient_id || patient.uhid}>
                  {/* Token */}
                  <td>
                    <span className="token-badge">
                      {patient.queue_token || 'Q-101'}
                    </span>
                  </td>

                  {/* Patient Name & Demographics */}
                  <td>
                    <div className="patient-cell">
                      <span className="patient-name">{patient.full_name}</span>
                      <div className="patient-sub">
                        <span className="uhid-code">{patient.uhid}</span>
                        <span>•</span>
                        <span>{patient.age ? `${patient.age}y` : '--'}, {patient.gender}</span>
                      </div>
                    </div>
                  </td>

                  {/* Blood Group & Contact */}
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <span className="blood-badge">{patient.blood_group || 'UNKNOWN'}</span>
                      <span style={{ fontSize: '0.8rem', color: '#475569' }}>{patient.phone}</span>
                    </div>
                  </td>

                  {/* Assigned Physician */}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <UserCheck size={16} color="#0055FF" />
                      <div>
                        <div style={{ fontWeight: 600, color: '#0A2540', fontSize: '0.88rem' }}>
                          {patient.doctor_name || 'Dr. Rajesh Kulkarni'}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#64748B' }}>Internal Medicine</div>
                      </div>
                    </div>
                  </td>

                  {/* Triage Vitals */}
                  <td>
                    <div className="vitals-snapshot">
                      {/* BP Chip */}
                      {patient.systolic_bp ? (
                        <span className={`vital-chip ${getBpChipClass(patient.bp_stage)}`}>
                          BP: {patient.systolic_bp}/{patient.diastolic_bp}
                        </span>
                      ) : (
                        <span className="vital-chip">BP: --</span>
                      )}

                      {/* Pulse Chip */}
                      {patient.pulse_rate && (
                        <span className="vital-chip">
                          {patient.pulse_rate} bpm
                        </span>
                      )}

                      {/* SpO2 Chip */}
                      {patient.spo2_pct && (
                        <span className="vital-chip" style={{ color: patient.spo2_pct < 95 ? '#DC2626' : '#059669' }}>
                          {patient.spo2_pct}% SpO2
                        </span>
                      )}

                      {/* BMI Badge */}
                      {patient.bmi && (
                        <span className={`bmi-badge ${getBmiBadgeClass(patient.bmi_category)}`}>
                          BMI {patient.bmi}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Status */}
                  <td>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      background: '#ECFDF5',
                      color: '#047857',
                      border: '1px solid #A7F3D0',
                      padding: '0.2rem 0.55rem',
                      borderRadius: '9999px',
                      fontSize: '0.74rem',
                      fontWeight: 700
                    }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#059669' }} />
                      {patient.visit_status || 'TRIAGED'}
                    </span>
                  </td>

                  {/* Actions */}
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => onViewPatient(patient)}
                      title="View full intake record and printable slip"
                    >
                      <Eye size={14} />
                      <span>View Slip</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
