import React, { useState, useMemo } from 'react';
import { usePatients } from '../context/PatientContext';
import { 
  Users, 
  Clock, 
  Stethoscope, 
  CheckCircle2, 
  Check, 
  Search, 
  UserCheck, 
  Edit3, 
  Printer, 
  ArrowRight, 
  Filter, 
  UserPlus, 
  Calendar, 
  AlertCircle,
  Building2,
  Globe,
  Camera,
  RotateCcw,
  Sparkles,
  ChevronDown,
  X
} from 'lucide-react';
import FollowUpPatientModal from './FollowUpPatientModal';

const DOCTOR_CABINS = [
  { name: 'Dr. Kiran Patel (General & Internal Medicine)', cabin: 'Cabin 01' },
  { name: 'Dr. Swaminathan (General & Laparoscopic Surgery)', cabin: 'Cabin 02' },
  { name: 'Dr. Priya Sharma (Medical Oncology & Hematology)', cabin: 'Cabin 03' },
  { name: 'Dr. Ananya Roy (Radiation Oncology)', cabin: 'Cabin 04' }
];

export default function TokenQueueManagementView({ 
  onOpenRegister, 
  onPrintSlip, 
  onOpenPatientDetails,
  onOpenFollowUp 
}) {
  const { 
    patients, 
    updatePatientStatus, 
    updatePatientDoctor, 
    updatePatientTiming,
    addToast 
  } = usePatients();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'WAITING' | 'IN_CONSULTATION' | 'COMPLETED'
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState('ALL');

  // Follow-Up modal state
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [followUpInitialPatient, setFollowUpInitialPatient] = useState(null);
  
  // Timing Edit Modal State
  const [editingPatient, setEditingPatient] = useState(null);
  const [timingForm, setTimingForm] = useState({
    checkInTime: '',
    consultationStartTime: '',
    checkOutTime: '',
    waitTimeMinutes: '',
    consultationDurationMinutes: '',
    status: 'WAITING'
  });

  // Calculate live statistics
  const stats = useMemo(() => {
    const total = patients.length;
    const waiting = patients.filter(p => p.status === 'WAITING' || p.status === 'REGISTERED' || p.status === 'QUESTIONNAIRE_PENDING').length;
    const inConsultation = patients.filter(p => p.status === 'IN_CONSULTATION' || p.status === 'INSIGHTS_READY' || p.status === 'INSIGHTS_GENERATING').length;
    const completed = patients.filter(p => p.status === 'COMPLETED').length;

    // Calculate average wait time
    const waitTimes = patients.map(p => Number(p.waitTimeMinutes) || (p.status === 'WAITING' ? 15 : 12)).filter(Boolean);
    const avgWait = waitTimes.length ? Math.round(waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length) : 0;

    return { total, waiting, inConsultation, completed, avgWait };
  }, [patients]);

  // Doctor-wise queue breakdown
  const doctorLoad = useMemo(() => {
    const map = {};
    DOCTOR_CABINS.forEach(d => {
      map[d.name] = {
        cabin: d.cabin,
        waiting: 0,
        inConsultation: 0,
        completed: 0,
        total: 0
      };
    });

    patients.forEach(p => {
      const doc = p.doctorAssigned || DOCTOR_CABINS[0].name;
      if (!map[doc]) {
        map[doc] = { cabin: 'OPD Cabin', waiting: 0, inConsultation: 0, completed: 0, total: 0 };
      }
      map[doc].total += 1;
      if (p.status === 'WAITING' || p.status === 'REGISTERED' || p.status === 'QUESTIONNAIRE_PENDING') {
        map[doc].waiting += 1;
      } else if (p.status === 'IN_CONSULTATION' || p.status === 'INSIGHTS_READY' || p.status === 'INSIGHTS_GENERATING') {
        map[doc].inConsultation += 1;
      } else if (p.status === 'COMPLETED') {
        map[doc].completed += 1;
      }
    });

    return map;
  }, [patients]);

  // Filtered patients
  const filteredPatients = useMemo(() => {
    return patients.filter(p => {
      // Normalizing status categories
      const isWaiting = p.status === 'WAITING' || p.status === 'REGISTERED' || p.status === 'QUESTIONNAIRE_PENDING';
      const isConsultation = p.status === 'IN_CONSULTATION' || p.status === 'INSIGHTS_READY' || p.status === 'INSIGHTS_GENERATING';
      const isCompleted = p.status === 'COMPLETED';

      // Status filter
      if (statusFilter === 'WAITING' && !isWaiting) return false;
      if (statusFilter === 'IN_CONSULTATION' && !isConsultation) return false;
      if (statusFilter === 'COMPLETED' && !isCompleted) return false;

      // Doctor filter
      if (selectedDoctorFilter !== 'ALL' && p.doctorAssigned !== selectedDoctorFilter) {
        return false;
      }

      // Search query (matches Name, Master UHID, OPD ID, Token Number, Phone)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.fullName?.toLowerCase().includes(q);
        const matchesUhid = (p.uhid || p.mrn)?.toLowerCase().includes(q);
        const matchesOpd = p.opdId?.toLowerCase().includes(q);
        const matchesToken = String(p.tokenNumber || '').includes(q);
        const matchesPhone = p.phone?.includes(q);
        return matchesName || matchesUhid || matchesOpd || matchesToken || matchesPhone;
      }

      return true;
    });
  }, [patients, statusFilter, selectedDoctorFilter, searchQuery]);

  // Open Timing Edit Modal
  const handleOpenEditTiming = (patient) => {
    setEditingPatient(patient);
    setTimingForm({
      checkInTime: patient.checkInTime || patient.registeredAt || '09:15 AM',
      consultationStartTime: patient.consultationStartTime || (patient.status === 'WAITING' ? '' : '09:40 AM'),
      checkOutTime: patient.checkOutTime || (patient.status === 'COMPLETED' ? '10:05 AM' : ''),
      waitTimeMinutes: patient.waitTimeMinutes ?? (patient.status === 'WAITING' ? 18 : 15),
      consultationDurationMinutes: patient.consultationDurationMinutes ?? (patient.status === 'COMPLETED' ? 25 : 0),
      status: patient.status || 'WAITING'
    });
  };

  // Save Timing Overrides
  const handleSaveTiming = (e) => {
    e.preventDefault();
    if (!editingPatient) return;

    updatePatientTiming(editingPatient.id, {
      checkInTime: timingForm.checkInTime,
      consultationStartTime: timingForm.consultationStartTime || null,
      checkOutTime: timingForm.checkOutTime || null,
      waitTimeMinutes: Number(timingForm.waitTimeMinutes) || 0,
      consultationDurationMinutes: Number(timingForm.consultationDurationMinutes) || 0,
      status: timingForm.status
    });

    setEditingPatient(null);
  };

  // Handle Quick Status Advance
  const handleAdvanceStatus = (patient) => {
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (patient.status === 'WAITING' || patient.status === 'REGISTERED' || patient.status === 'QUESTIONNAIRE_PENDING') {
      // Call in to doctor cabin
      updatePatientTiming(patient.id, {
        status: 'IN_CONSULTATION',
        consultationStartTime: nowTime,
        waitTimeMinutes: patient.waitTimeMinutes || 20
      });
      addToast(`Token #${patient.tokenNumber} (${patient.fullName}) called into ${patient.doctorAssigned?.split('(')[0]} cabin.`, 'success');
    } else if (patient.status === 'IN_CONSULTATION' || patient.status === 'INSIGHTS_READY' || patient.status === 'INSIGHTS_GENERATING') {
      // Complete consultation
      updatePatientTiming(patient.id, {
        status: 'COMPLETED',
        checkOutTime: nowTime,
        consultationDurationMinutes: patient.consultationDurationMinutes || 22
      });
      addToast(`Token #${patient.tokenNumber} (${patient.fullName}) consultation completed. Routed to Cashier & Pharmacy.`, 'success');
    }
  };

  // Handle Doctor Transfer
  const handleDoctorChange = (patientId, newDoctor) => {
    updatePatientDoctor(patientId, newDoctor);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* ======================================================== */}
      {/* 1. TOP STATS BAR: Live Queue Counters with Color Codes   */}
      {/* ======================================================== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14 }}>
        {/* Total Tokens */}
        <div style={{
          background: 'var(--bg-surface)',
          borderRadius: 12,
          padding: '14px 18px',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Total Tokens Issued
            </div>
            <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--text-primary)', marginTop: 2 }}>
              {stats.total}
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>Today's OPD Roster</div>
          </div>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#334155' }}>
            <Users size={22} />
          </div>
        </div>

        {/* Color 1: Waiting in Lounge (Amber) */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'WAITING' ? 'ALL' : 'WAITING')}
          style={{
            background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
            borderRadius: 12,
            padding: '14px 18px',
            border: statusFilter === 'WAITING' ? '2px solid #d97706' : '1px solid #fde68a',
            boxShadow: '0 2px 8px rgba(217, 119, 6, 0.1)',
            cursor: 'pointer',
            transition: 'transform 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#92400e', textTransform: 'uppercase' }}>
                🟡 Waiting in Lounge
              </div>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#b45309', marginTop: 2 }}>
                {stats.waiting}
              </div>
              <div style={{ fontSize: 10.5, color: '#b45309', fontWeight: 600 }}>Color 1 • Queue Active</div>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706', boxShadow: '0 2px 6px rgba(217, 119, 6, 0.15)' }}>
              <Clock size={22} />
            </div>
          </div>
        </div>

        {/* Color 2: In Consultation (Cobalt Blue) */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'IN_CONSULTATION' ? 'ALL' : 'IN_CONSULTATION')}
          style={{
            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
            borderRadius: 12,
            padding: '14px 18px',
            border: statusFilter === 'IN_CONSULTATION' ? '2px solid #0284c7' : '1px solid #bae6fd',
            boxShadow: '0 2px 8px rgba(2, 132, 199, 0.1)',
            cursor: 'pointer',
            transition: 'transform 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#0369a1', textTransform: 'uppercase' }}>
                🔵 In Doctor Cabin
              </div>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#0284c7', marginTop: 2 }}>
                {stats.inConsultation}
              </div>
              <div style={{ fontSize: 10.5, color: '#0369a1', fontWeight: 600 }}>Color 2 • Active Session</div>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7', boxShadow: '0 2px 6px rgba(2, 132, 199, 0.15)' }}>
              <Stethoscope size={22} />
            </div>
          </div>
        </div>

        {/* Color 3: Completed (Emerald Green with Tick) */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'COMPLETED' ? 'ALL' : 'COMPLETED')}
          style={{
            background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
            borderRadius: 12,
            padding: '14px 18px',
            border: statusFilter === 'COMPLETED' ? '2px solid #059669' : '1px solid #a7f3d0',
            boxShadow: '0 2px 8px rgba(5, 150, 105, 0.1)',
            cursor: 'pointer',
            transition: 'transform 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#166534', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>🟢 Consulted (✓)</span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#15803d', marginTop: 2 }}>
                {stats.completed}
              </div>
              <div style={{ fontSize: 10.5, color: '#166534', fontWeight: 600 }}>Color 3 • Completed Tick ✓</div>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', boxShadow: '0 2px 6px rgba(5, 150, 105, 0.15)' }}>
              <CheckCircle2 size={24} strokeWidth={2.5} />
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. DOCTOR CABIN WORKLOAD INDICATOR STRIP                */}
      {/* ======================================================== */}
      <div style={{
        background: 'var(--bg-surface)',
        borderRadius: 10,
        padding: '12px 16px',
        border: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Building2 size={16} color="var(--primary)" />
          <span style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--text-primary)' }}>Doctor Cabin Live Loads:</span>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', flex: 1, justifyContent: 'flex-start' }}>
          {DOCTOR_CABINS.map(d => {
            const load = doctorLoad[d.name] || { waiting: 0, inConsultation: 0 };
            const isSelected = selectedDoctorFilter === d.name;
            return (
              <button
                key={d.name}
                type="button"
                onClick={() => setSelectedDoctorFilter(isSelected ? 'ALL' : d.name)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  border: isSelected ? '1.5px solid var(--primary)' : '1px solid var(--border-default)',
                  background: isSelected ? 'var(--bg-subtle)' : 'var(--bg-surface)',
                  fontSize: 11.5,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  textAlign: 'left'
                }}
              >
                <div>
                  <strong style={{ color: 'var(--text-primary)', display: 'block', fontSize: 11.5 }}>
                    {d.cabin}: {d.name.split('(')[0]}
                  </strong>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                    🟡 {load.waiting} waiting • 🔵 {load.inConsultation} inside
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {selectedDoctorFilter !== 'ALL' && (
          <button 
            type="button" 
            onClick={() => setSelectedDoctorFilter('ALL')}
            className="m3-btn m3-btn-sm m3-btn-text"
            style={{ fontSize: 11 }}
          >
            Clear Doctor Filter
          </button>
        )}
      </div>

      {/* ======================================================== */}
      {/* 3. CONTROLS: Color Filters & Master Search               */}
      {/* ======================================================== */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12
      }}>
        {/* Color-based filter buttons */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            style={{
              height: 32,
              padding: '0 16px',
              borderRadius: 9999,
              fontSize: 11.5,
              fontWeight: 800,
              cursor: 'pointer',
              background: statusFilter === 'ALL' ? 'var(--primary)' : 'var(--bg-surface)',
              color: statusFilter === 'ALL' ? '#ffffff' : 'var(--text-secondary)',
              border: statusFilter === 'ALL' ? '1px solid var(--primary)' : '1px solid var(--border-default)',
              boxShadow: statusFilter === 'ALL' ? '0 2px 6px rgba(247, 127, 0, 0.3)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            All Queue ({stats.total})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('WAITING')}
            style={{
              height: 32,
              padding: '0 16px',
              borderRadius: 9999,
              fontSize: 11.5,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: statusFilter === 'WAITING' ? '#f59e0b' : '#fef3c7',
              color: statusFilter === 'WAITING' ? '#ffffff' : '#92400e',
              border: '1px solid #f59e0b',
              boxShadow: statusFilter === 'WAITING' ? '0 2px 6px rgba(245, 158, 11, 0.3)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <span>🟡 Waiting ({stats.waiting})</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('IN_CONSULTATION')}
            style={{
              height: 32,
              padding: '0 16px',
              borderRadius: 9999,
              fontSize: 11.5,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: statusFilter === 'IN_CONSULTATION' ? '#0284c7' : '#e0f2fe',
              color: statusFilter === 'IN_CONSULTATION' ? '#ffffff' : '#0369a1',
              border: '1px solid #0284c7',
              boxShadow: statusFilter === 'IN_CONSULTATION' ? '0 2px 6px rgba(2, 132, 199, 0.3)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <span>🔵 In Consultation ({stats.inConsultation})</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('COMPLETED')}
            style={{
              height: 32,
              padding: '0 16px',
              borderRadius: 9999,
              fontSize: 11.5,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: statusFilter === 'COMPLETED' ? '#10b981' : '#dcfce7',
              color: statusFilter === 'COMPLETED' ? '#ffffff' : '#15803d',
              border: '1px solid #10b981',
              boxShadow: statusFilter === 'COMPLETED' ? '0 2px 6px rgba(16, 185, 129, 0.3)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <Check size={13} strokeWidth={3} />
            <span>🟢 Completed ({stats.completed})</span>
          </button>
        </div>

        {/* Master UHID / OPD Search Bar + Actions */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: 260 }}>
            <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text"
              placeholder="Search by UHID, OPD ID, Token, Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 10px 6px 32px',
                fontSize: 12,
                borderRadius: 9999,
                border: '1px solid var(--border-default)',
                background: 'var(--bg-surface)',
                outline: 'none'
              }}
            />
            {searchQuery && (
              <button 
                type="button" 
                onClick={() => setSearchQuery('')}
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', cursor: 'pointer' }}
              >
                <X size={13} color="var(--text-muted)" />
              </button>
            )}
          </div>

          <button
            type="button"
            className="m3-btn"
            onClick={() => {
              setFollowUpInitialPatient(null);
              setIsFollowUpModalOpen(true);
            }}
            style={{
              height: 32,
              padding: '0 14px',
              fontSize: 11.5,
              fontWeight: 800,
              borderRadius: 9999,
              background: '#ede9fe',
              color: '#6d28d9',
              border: '1px solid #c4b5fd',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer'
            }}
            title="Issue Follow-Up Consultation Token for an existing registered patient"
          >
            <RotateCcw size={13} />
            <span>🔁 Issue Follow-Up Token</span>
          </button>

          <button
            type="button"
            className="m3-btn m3-btn-filled"
            onClick={onOpenRegister}
            style={{ height: 32, fontSize: 11.5, borderRadius: 9999, display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <UserPlus size={14} />
            <span>Issue New Token</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. PATIENT QUEUE LIST WITH COLOR CODING & OPERATIONAL TIMES*/}
      {/* ======================================================== */}
      {filteredPatients.length === 0 ? (
        <div style={{
          background: 'var(--bg-surface)',
          padding: 40,
          borderRadius: 12,
          textAlign: 'center',
          border: '1px dashed var(--border-default)'
        }}>
          <Users size={36} color="var(--text-muted)" style={{ margin: '0 auto 10px' }} />
          <h4 style={{ margin: 0, color: 'var(--text-primary)' }}>No Patients Found in Current Filter</h4>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '6px 0 16px' }}>
            Adjust your color filter or clear the search criteria to inspect all tokens.
          </p>
          <button 
            type="button" 
            className="m3-btn m3-btn-outlined" 
            onClick={() => { setStatusFilter('ALL'); setSelectedDoctorFilter('ALL'); setSearchQuery(''); }}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredPatients.map(patient => {
            const isWaiting = patient.status === 'WAITING' || patient.status === 'REGISTERED' || patient.status === 'QUESTIONNAIRE_PENDING';
            const isConsultation = patient.status === 'IN_CONSULTATION' || patient.status === 'INSIGHTS_READY' || patient.status === 'INSIGHTS_GENERATING';
            const isCompleted = patient.status === 'COMPLETED';

            // Distinct Border and Background Tint based on 3-Color Scheme
            const cardStyle = isWaiting ? {
              borderLeft: '5px solid #f59e0b',
              background: '#ffffff',
              boxShadow: '0 2px 8px rgba(245, 158, 11, 0.08)'
            } : isConsultation ? {
              borderLeft: '5px solid #0284c7',
              background: '#f8fafc',
              boxShadow: '0 2px 8px rgba(2, 132, 199, 0.08)'
            } : {
              borderLeft: '5px solid #10b981',
              background: '#fafdfb',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.08)'
            };

            const isForeign = patient.patientCategory === 'FOREIGN' || Boolean(patient.frroDetails);

            return (
              <div 
                key={patient.id}
                style={{
                  borderRadius: 12,
                  borderTop: '1px solid var(--border-subtle)',
                  borderRight: '1px solid var(--border-subtle)',
                  borderBottom: '1px solid var(--border-subtle)',
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 16,
                  transition: 'background 0.2s ease',
                  ...cardStyle
                }}
              >
                {/* Column A: Token Number + Biometric Photo + Identity */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 280, flex: '1 1 300px' }}>
                  {/* Token Number Box */}
                  <div style={{
                    width: 52,
                    height: 52,
                    borderRadius: 10,
                    background: isWaiting ? '#fef3c7' : isConsultation ? '#e0f2fe' : '#dcfce7',
                    border: isWaiting ? '1.5px solid #f59e0b' : isConsultation ? '1.5px solid #0284c7' : '1.5px solid #10b981',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <span style={{ fontSize: 9, fontWeight: 800, color: isWaiting ? '#92400e' : isConsultation ? '#0369a1' : '#15803d', textTransform: 'uppercase' }}>
                      TOKEN
                    </span>
                    <span style={{ fontSize: 18, fontWeight: 900, color: isWaiting ? '#b45309' : isConsultation ? '#0284c7' : '#10b981', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>
                      #{patient.tokenNumber || 142}
                    </span>
                  </div>

                  {/* Biometric Webcam Photo or Avatar */}
                  <div style={{
                    width: 46,
                    height: 46,
                    borderRadius: '50%',
                    overflow: 'hidden',
                    background: 'var(--bg-subtle)',
                    border: '1.5px solid var(--border-default)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {patient.photoUrl ? (
                      <img src={patient.photoUrl} alt={patient.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-secondary)' }}>
                        {patient.fullName?.slice(0, 2).toUpperCase() || 'PT'}
                      </span>
                    )}
                  </div>

                  {/* Patient Info */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: 15, color: 'var(--text-primary)', fontWeight: 800 }}>
                        {patient.fullName}
                      </strong>
                      
                      {/* Master UHID (Master ID) */}
                      <span style={{
                        fontSize: 10,
                        fontWeight: 800,
                        padding: '1px 6px',
                        borderRadius: 4,
                        background: '#0f172a',
                        color: '#ffffff',
                        fontFamily: 'var(--font-mono)'
                      }} title="Lifetime Master Identifier across all hospital visits">
                        UHID: {patient.uhid || patient.mrn} (Master)
                      </span>

                      {/* OPD ID */}
                      <span style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: 4,
                        background: '#f1f5f9',
                        color: '#475569',
                        fontFamily: 'var(--font-mono)'
                      }} title="Visit Outpatient Encounter Registration Number">
                        OPD: {patient.opdId || `OPD-26-${patient.tokenNumber || 142}`}
                      </span>

                      {/* Category */}
                      {isForeign ? (
                        <span style={{ fontSize: 9.5, padding: '1px 6px', borderRadius: 4, background: '#e0f2fe', color: '#0369a1', fontWeight: 800 }}>
                          🌍 Foreign (FRRO)
                        </span>
                      ) : (
                        <span style={{ fontSize: 9.5, padding: '1px 6px', borderRadius: 4, background: '#ecfdf5', color: '#047857', fontWeight: 700 }}>
                          🇮🇳 Domestic
                        </span>
                      )}

                      {/* Follow-Up Indicator Badge */}
                      {(patient.isFollowUp || patient.visitType === 'FOLLOW_UP') && (
                        <span style={{ fontSize: 9.5, padding: '1px 6px', borderRadius: 4, background: '#ede9fe', color: '#6d28d9', fontWeight: 800, border: '1px solid #ddd6fe' }} title={`Follow-Up: ${patient.followUpReason || 'Routine review'}`}>
                          🔁 Follow-Up
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 2 }}>
                      {patient.age} yrs • {patient.gender} • City: <strong>{patient.city || (isForeign ? patient.frroDetails?.stayCityInIndia : 'Chennai')}</strong> • Ph: {patient.phone}
                      {patient.referredBy && (
                        <span style={{ marginLeft: 6, fontSize: 10.5, color: 'var(--primary)', fontWeight: 700 }}>
                          • Ref: {patient.referredBy}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Column B: Exact Operational Timings Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, minmax(75px, 1fr))',
                  gap: 8,
                  background: 'var(--bg-subtle)',
                  padding: '8px 12px',
                  borderRadius: 8,
                  fontSize: 11,
                  border: '1px solid var(--border-subtle)',
                  flex: '2 1 420px'
                }}>
                  {/* Check-In */}
                  <div>
                    <span style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 700, display: 'block' }}>CHECK-IN</span>
                    <strong style={{ color: 'var(--text-primary)', fontSize: 11.5 }}>
                      {patient.checkInTime || patient.registeredAt || '09:15 AM'}
                    </strong>
                  </div>

                  {/* Consultation Start */}
                  <div>
                    <span style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 700, display: 'block' }}>START TIME</span>
                    <strong style={{ color: '#0284c7', fontSize: 11.5 }}>
                      {patient.consultationStartTime || (isWaiting ? 'Pending' : '09:40 AM')}
                    </strong>
                  </div>

                  {/* Check-Out */}
                  <div>
                    <span style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 700, display: 'block' }}>CHECK-OUT</span>
                    <strong style={{ color: '#10b981', fontSize: 11.5 }}>
                      {patient.checkOutTime || (isCompleted ? '10:05 AM' : 'In Progress')}
                    </strong>
                  </div>

                  {/* Total Wait in Queue */}
                  <div>
                    <span style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 700, display: 'block' }}>WAIT IN QUEUE</span>
                    <span style={{ color: '#d97706', fontWeight: 800, fontSize: 11.5 }}>
                      {patient.waitTimeMinutes ? `${patient.waitTimeMinutes} mins` : (isWaiting ? '18m (Wait)' : '15 mins')}
                    </span>
                  </div>

                  {/* Total Consultation Took */}
                  <div>
                    <span style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 700, display: 'block' }}>SESSION TOOK</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: 11.5 }}>
                      {patient.consultationDurationMinutes ? `${patient.consultationDurationMinutes} mins` : (isCompleted ? '25 mins' : 'Ongoing')}
                    </span>
                  </div>
                </div>

                {/* Column C: Doctor Cabin + On-The-Fly Doctor Transfer */}
                <div style={{ minWidth: 200, flex: '1 1 200px' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 700, marginBottom: 2 }}>
                    ASSIGNED DOCTOR QUEUE:
                  </div>
                  <select
                    value={patient.doctorAssigned || DOCTOR_CABINS[0].name}
                    onChange={(e) => handleDoctorChange(patient.id, e.target.value)}
                    style={{
                      width: '100%',
                      padding: '5px 8px',
                      fontSize: 11,
                      fontWeight: 700,
                      borderRadius: 6,
                      border: '1px solid var(--border-default)',
                      background: 'var(--bg-surface)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer'
                    }}
                    title="Change doctor queue on-the-fly"
                  >
                    {DOCTOR_CABINS.map(d => (
                      <option key={d.name} value={d.name}>
                        {d.cabin}: {d.name.split('(')[0]}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Column D: Status Chip & Action Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {/* Status Chip */}
                  {isWaiting && (
                    <span style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', fontSize: 10.5, fontWeight: 800, padding: '4px 8px', borderRadius: 9999 }}>
                      🟡 Waiting
                    </span>
                  )}
                  {isConsultation && (
                    <span style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', fontSize: 10.5, fontWeight: 800, padding: '4px 8px', borderRadius: 9999 }}>
                      🔵 In Cabin
                    </span>
                  )}
                  {isCompleted && (
                    <span style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #86efac', fontSize: 10.5, fontWeight: 800, padding: '4px 8px', borderRadius: 9999, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                      <Check size={11} strokeWidth={3} /> 🟢 Consulted ✓
                    </span>
                  )}

                  {/* Advance Queue Button */}
                  {!isCompleted && (
                    <button
                      type="button"
                      onClick={() => handleAdvanceStatus(patient)}
                      style={{
                        height: 30,
                        padding: '0 10px',
                        fontSize: 11,
                        fontWeight: 800,
                        borderRadius: 6,
                        border: 'none',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        background: isWaiting ? 'linear-gradient(135deg, #0284c7, #0369a1)' : 'linear-gradient(135deg, #10b981, #059669)',
                        color: '#ffffff',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                    >
                      {isWaiting ? (
                        <>
                          <Stethoscope size={12} />
                          <span>Call In</span>
                        </>
                      ) : (
                        <>
                          <Check size={13} strokeWidth={3} />
                          <span>Mark Done ✓</span>
                        </>
                      )}
                    </button>
                  )}

                  {/* Edit Timings Button */}
                  <button
                    type="button"
                    onClick={() => handleOpenEditTiming(patient)}
                    className="m3-btn m3-btn-sm m3-btn-tonal"
                    style={{ height: 30, fontSize: 11, padding: '0 8px' }}
                    title="Receptionist manual override for check-in / check-out times"
                  >
                    <Edit3 size={12} />
                    <span>Times</span>
                  </button>

                  {/* Print Slip Button */}
                  {onPrintSlip && (
                    <button
                      type="button"
                      onClick={() => onPrintSlip(patient)}
                      className="icon-btn"
                      style={{ width: 30, height: 30 }}
                      title="Print Token Slip"
                    >
                      <Printer size={13} />
                    </button>
                  )}

                  {/* Follow-Up Quick Action Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setFollowUpInitialPatient(patient);
                      setIsFollowUpModalOpen(true);
                    }}
                    className="m3-btn m3-btn-sm"
                    style={{
                      height: 30,
                      fontSize: 10.5,
                      padding: '0 8px',
                      background: '#ede9fe',
                      color: '#6d28d9',
                      border: '1px solid #c4b5fd',
                      borderRadius: 6,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                    title="Issue Follow-Up OPD Token for this patient"
                  >
                    <RotateCcw size={11} />
                    <span>Follow-Up</span>
                  </button>

                  {/* View Details Button */}
                  {onOpenPatientDetails && (
                    <button
                      type="button"
                      onClick={() => onOpenPatientDetails(patient)}
                      className="m3-btn m3-btn-sm m3-btn-outlined"
                      style={{ height: 30, fontSize: 11, padding: '0 8px' }}
                    >
                      Details
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. RECEPTIONIST MANUAL EDIT TIMINGS MODAL                */}
      {/* ======================================================== */}
      {editingPatient && (
        <div className="modal-overlay m3-dialog-backdrop" onClick={() => setEditingPatient(null)}>
          <div 
            className="modal-content m3-dialog-container" 
            style={{ maxWidth: 460, padding: 22 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
                  Manual Timings Override (Receptionist)
                </h3>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                  Patient: <strong>{editingPatient.fullName}</strong> • Token #{editingPatient.tokenNumber}
                </span>
              </div>
              <button className="icon-btn" onClick={() => setEditingPatient(null)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveTiming} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Status override */}
              <div className="m3-form-field">
                <label className="m3-field-label">Current Queue Status</label>
                <select
                  value={timingForm.status}
                  onChange={(e) => setTimingForm(prev => ({ ...prev, status: e.target.value }))}
                  className="m3-select"
                  style={{ width: '100%' }}
                >
                  <option value="WAITING">🟡 Waiting in Lounge</option>
                  <option value="IN_CONSULTATION">🔵 In Doctor Cabin (In Consultation)</option>
                  <option value="COMPLETED">🟢 Consultation Completed (✓)</option>
                </select>
              </div>

              {/* Check-In Time */}
              <div className="m3-form-field">
                <label className="m3-field-label">Check-in Time (Arrival at Clinic)</label>
                <input 
                  type="text"
                  placeholder="e.g. 09:15 AM"
                  value={timingForm.checkInTime}
                  onChange={(e) => setTimingForm(prev => ({ ...prev, checkInTime: e.target.value }))}
                  className="m3-input"
                />
              </div>

              {/* Consultation Start Time */}
              <div className="m3-form-field">
                <label className="m3-field-label">Consultation Start Time (Cabin Entry)</label>
                <input 
                  type="text"
                  placeholder="e.g. 09:40 AM"
                  value={timingForm.consultationStartTime}
                  onChange={(e) => setTimingForm(prev => ({ ...prev, consultationStartTime: e.target.value }))}
                  className="m3-input"
                />
              </div>

              {/* Check-Out Time */}
              <div className="m3-form-field">
                <label className="m3-field-label">Check-out Time (Consultation End)</label>
                <input 
                  type="text"
                  placeholder="e.g. 10:05 AM"
                  value={timingForm.checkOutTime}
                  onChange={(e) => setTimingForm(prev => ({ ...prev, checkOutTime: e.target.value }))}
                  className="m3-input"
                />
              </div>

              {/* Total Wait in Queue (minutes) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="m3-form-field">
                  <label className="m3-field-label">Queue Wait (mins)</label>
                  <input 
                    type="number"
                    placeholder="e.g. 25"
                    value={timingForm.waitTimeMinutes}
                    onChange={(e) => setTimingForm(prev => ({ ...prev, waitTimeMinutes: e.target.value }))}
                    className="m3-input"
                  />
                </div>

                <div className="m3-form-field">
                  <label className="m3-field-label">Session Duration (mins)</label>
                  <input 
                    type="number"
                    placeholder="e.g. 25"
                    value={timingForm.consultationDurationMinutes}
                    onChange={(e) => setTimingForm(prev => ({ ...prev, consultationDurationMinutes: e.target.value }))}
                    className="m3-input"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" className="m3-btn m3-btn-tonal" onClick={() => setEditingPatient(null)}>
                  Cancel
                </button>
                <button type="submit" className="m3-btn m3-btn-filled">
                  Save Timing Overrides
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Follow-Up Patient Encounter Modal */}
      <FollowUpPatientModal
        isOpen={isFollowUpModalOpen}
        onClose={() => {
          setIsFollowUpModalOpen(false);
          setFollowUpInitialPatient(null);
        }}
        initialPatient={followUpInitialPatient}
        onSuccess={(encounter) => {
          if (onPrintSlip) {
            onPrintSlip(encounter);
          }
        }}
      />
    </div>
  );
}
