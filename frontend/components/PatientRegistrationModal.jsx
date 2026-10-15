import React, { useState } from 'react';
import { usePatients } from '../context/PatientContext';
import { COMMON_INSURERS, ONCOLOGISTS, GOVT_SCHEMES } from '../utils/mockData';
import { 
  X, 
  User, 
  Phone, 
  MapPin, 
  Shield, 
  Check, 
  Calendar, 
  Zap, 
  HeartHandshake, 
  CreditCard,
  Building2,
  Stethoscope,
  Landmark,
  Award,
  ClipboardList,
  Activity,
  Heart,
  Thermometer,
  Scale,
  Gauge,
  Wind
} from 'lucide-react';
import SpeechMicButton from './SpeechMicButton';

export default function PatientRegistrationModal({ isOpen, onClose, onRegisteredAndStartIntake }) {
  const { registerPatient } = usePatients();

  const [formData, setFormData] = useState({
    fullName: '',
    dob: '',
    age: '',
    gender: 'Female',
    phone: '',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    doctorAssigned: ONCOLOGISTS[0],
    // Clinical Vital Signs & Triage Biometrics
    weight: '', // kg
    height: '', // cm
    bmi: '',    // kg/m²
    bp: '',     // mmHg (e.g. 120/80)
    pulse: '',  // bpm
    temp: '',   // °F
    spo2: '',   // %
    respRate: '',// breaths/min
    insuranceType: 'INSURANCE', // 'INSURANCE' | 'GOVT_SCHEME' | 'CASH'
    insuranceProvider: COMMON_INSURERS[0],
    policyNumber: '',
    groupNumber: '',
    coveragePct: '80',
    deductible: '5000',
    preAuthNumber: '',
    govtSchemeName: GOVT_SCHEMES[0],
    beneficiaryId: '',
    abhaId: '',
    abhaAddress: ''
  });

  const [errors, setErrors] = useState({});
  const [isAbhaVerified, setIsAbhaVerified] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const getBmiCategory = (bmiVal) => {
    const num = parseFloat(bmiVal);
    if (!num || isNaN(num)) return null;
    if (num < 18.5) return { label: 'Underweight', color: '#0284c7', bg: '#eff6ff', border: '#bae6fd' };
    if (num < 25) return { label: 'Normal', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' };
    if (num < 30) return { label: 'Overweight', color: '#d97706', bg: '#fffbeb', border: '#fde68a' };
    return { label: 'Obese', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' };
  };

  const handleFillNormalVitals = () => {
    setFormData(prev => ({
      ...prev,
      weight: '62',
      height: '165',
      bmi: '22.8',
      bp: '120/80',
      pulse: '72',
      temp: '98.4',
      spo2: '99',
      respRate: '16'
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      if (name === 'dob' && value) {
        const birthYear = new Date(value).getFullYear();
        const currentYear = new Date().getFullYear();
        if (birthYear && birthYear > 1900 && birthYear <= currentYear) {
          updated.age = String(currentYear - birthYear);
        }
      }
      // Live BMI calculation when weight or height changes
      if (name === 'weight' || name === 'height') {
        const w = parseFloat(name === 'weight' ? value : prev.weight);
        const h = parseFloat(name === 'height' ? value : prev.height) / 100;
        if (w > 0 && h > 0) {
          updated.bmi = (w / (h * h)).toFixed(1);
        } else if (!value) {
          updated.bmi = '';
        }
      }
      return updated;
    });
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Patient full name is required';
    if (!formData.phone.trim()) newErrors.phone = 'Contact phone number is required';
    if (!formData.dob) newErrors.dob = 'Date of birth is required';
    if (formData.insuranceType === 'INSURANCE' && !formData.policyNumber.trim()) {
      newErrors.policyNumber = 'Policy number is required for insurance billing';
    }
    if (formData.insuranceType === 'GOVT_SCHEME' && !formData.beneficiaryId.trim() && !formData.policyNumber.trim()) {
      newErrors.beneficiaryId = 'PM-JAY Golden Card / Beneficiary ID is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (startIntake = false) => {
    if (!validate() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const newPatient = await registerPatient(formData);
      onClose();
      if (startIntake && onRegisteredAndStartIntake && newPatient) {
        onRegisteredAndStartIntake(newPatient);
      }
    } catch (err) {
      console.error('Registration failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePresetGovt = () => {
    setIsAbhaVerified(true);
    setFormData({
      fullName: 'Sangeetha Krishnan',
      dob: '1974-06-18',
      age: '52',
      gender: 'Female',
      phone: '+91 98400 98210',
      address: 'Plot 44, Gandhi Road, Tambaram, Chennai',
      emergencyContactName: 'Murali Krishnan (Son)',
      emergencyContactPhone: '+91 98400 98211',
      doctorAssigned: 'DevDoc (Consultant Physician)',
      // Vitals
      weight: '58',
      height: '160',
      bmi: '22.7',
      bp: '124/82',
      pulse: '76',
      temp: '98.6',
      spo2: '98',
      respRate: '16',
      insuranceType: 'GOVT_SCHEME',
      insuranceProvider: 'Ayushman Bharat — PM-JAY (AB-PMJAY)',
      policyNumber: 'PMJAY-TN-9821034',
      groupNumber: 'NHA-ABDM-01',
      coveragePct: '100',
      deductible: '0',
      preAuthNumber: 'PMJAY-PREAUTH-APPROVED',
      govtSchemeName: 'Ayushman Bharat — PM-JAY (AB-PMJAY)',
      beneficiaryId: 'PMJAY-TN-9821034',
      abhaId: '91-4820-1928-3819',
      abhaAddress: 'sangeetha.krishnan@abdm'
    });
    setErrors({});
  };

  const handlePresetInsurance = () => {
    setIsAbhaVerified(true);
    setFormData({
      fullName: 'Anand Sharma',
      dob: '1978-11-22',
      age: '48',
      gender: 'Male',
      phone: '+91 98840 55123',
      address: 'Flat 302, Green Meadows, Velachery, Chennai',
      emergencyContactName: 'Radha Sharma (Spouse)',
      emergencyContactPhone: '+91 98840 55124',
      doctorAssigned: 'DevDoc (Consultant Physician)',
      // Vitals
      weight: '74',
      height: '172',
      bmi: '25.0',
      bp: '130/85',
      pulse: '78',
      temp: '98.4',
      spo2: '99',
      respRate: '18',
      insuranceType: 'INSURANCE',
      insuranceProvider: 'Star Health Comprehensive',
      policyNumber: 'SH-2026-99120',
      groupNumber: 'GRP-CORP-4022',
      coveragePct: '80',
      deductible: '5000',
      preAuthNumber: 'STAR-PREAUTH-771',
      govtSchemeName: GOVT_SCHEMES[0],
      beneficiaryId: '',
      abhaId: '91-2201-8841-5520',
      abhaAddress: 'anand.sharma@abdm'
    });
    setErrors({});
  };

  const handlePresetCash = () => {
    setIsAbhaVerified(false);
    setFormData({
      fullName: 'Kavitha Ramesh',
      dob: '1985-04-12',
      age: '41',
      gender: 'Female',
      phone: '+91 97909 33210',
      address: '28 Besant Nagar Main Road, Chennai',
      emergencyContactName: 'Ramesh Sundaram (Spouse)',
      emergencyContactPhone: '+91 97909 33211',
      doctorAssigned: 'Dr. Kiran Patel (General & Internal Medicine)',
      // Vitals
      weight: '55',
      height: '158',
      bmi: '22.0',
      bp: '118/78',
      pulse: '70',
      temp: '98.2',
      spo2: '99',
      respRate: '15',
      insuranceType: 'CASH',
      insuranceProvider: 'Self-Pay / Cash',
      policyNumber: 'CASH-OPD',
      groupNumber: '',
      coveragePct: '0',
      deductible: '0',
      preAuthNumber: '',
      govtSchemeName: GOVT_SCHEMES[0],
      beneficiaryId: '',
      abhaId: '91-3310-7740-9912',
      abhaAddress: 'kavitha.ramesh@abdm'
    });
    setErrors({});
  };

  const handleSimulateAbhaPull = () => {
    setIsAbhaVerified(true);
    setFormData(prev => ({
      ...prev,
      fullName: prev.fullName || 'Sangeetha Krishnan',
      dob: prev.dob || '1974-06-18',
      age: prev.age || '52',
      gender: 'Female',
      phone: prev.phone || '+91 98400 98210',
      address: prev.address || 'Plot 44, Gandhi Road, Tambaram, Chennai',
      abhaId: '91-4820-1928-3819',
      abhaAddress: 'sangeetha.krishnan@abdm'
    }));
  };

  return (
    <div className="modal-overlay m3-dialog-backdrop" onClick={onClose}>
      <div 
        className="modal-content m3-dialog-container" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        style={{ maxWidth: 840 }}
      >
        {/* M3 Dialog Header */}
        <div className="m3-dialog-header">
          <div className="m3-dialog-icon">
            <User size={22} strokeWidth={2.2} />
          </div>
          <div className="m3-dialog-title-block">
            <h2 className="m3-headline-small">New Patient Registration</h2>
            <p className="m3-body-medium">
              Enter clinical demographics and insurance coverage to initialize clinical intake.
            </p>
          </div>
          <button 
            className="m3-icon-button" 
            onClick={onClose}
            aria-label="Close registration dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* ⚡ Quick Client Demo Presets Bar */}
        <div style={{
          padding: '10px 18px',
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(2, 132, 199, 0.08))',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 8
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 800, color: 'var(--text-primary)' }}>
            <Zap size={14} color="#f59e0b" fill="#f59e0b" />
            <span>1-Click Demo Profiles:</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="m3-btn m3-btn-sm"
              onClick={handlePresetGovt}
              data-tour="demo-pmjay-btn"
              style={{
                height: 26,
                fontSize: 10.5,
                padding: '0 10px',
                background: formData.insuranceType === 'GOVT_SCHEME' ? '#ecfdf5' : 'var(--bg-surface)',
                border: formData.insuranceType === 'GOVT_SCHEME' ? '1.5px solid #059669' : '1px solid var(--border-default)',
                color: formData.insuranceType === 'GOVT_SCHEME' ? '#065f46' : 'var(--text-primary)',
                fontWeight: 700
              }}
            >
              <Landmark size={12} color="#059669" />
              <span>PM-JAY (100% Cashless)</span>
            </button>

            <button
              type="button"
              className="m3-btn m3-btn-sm"
              onClick={handlePresetInsurance}
              style={{
                height: 26,
                fontSize: 10.5,
                padding: '0 10px',
                background: formData.insuranceType === 'INSURANCE' ? '#eff6ff' : 'var(--bg-surface)',
                border: formData.insuranceType === 'INSURANCE' ? '1.5px solid #0284c7' : '1px solid var(--border-default)',
                color: formData.insuranceType === 'INSURANCE' ? '#0369a1' : 'var(--text-primary)',
                fontWeight: 700
              }}
            >
              <Shield size={12} color="#0284c7" />
              <span>Star Health TPA (80%)</span>
            </button>

            <button
              type="button"
              className="m3-btn m3-btn-sm"
              onClick={handlePresetCash}
              style={{
                height: 26,
                fontSize: 10.5,
                padding: '0 10px',
                background: formData.insuranceType === 'CASH' ? '#fef3c7' : 'var(--bg-surface)',
                border: formData.insuranceType === 'CASH' ? '1.5px solid #d97706' : '1px solid var(--border-default)',
                color: formData.insuranceType === 'CASH' ? '#92400e' : 'var(--text-primary)',
                fontWeight: 700
              }}
            >
              <CreditCard size={12} color="#d97706" />
              <span>Direct Cash / Self-Pay</span>
            </button>

            <button
              type="button"
              className="m3-btn m3-btn-sm"
              onClick={handleSimulateAbhaPull}
              style={{
                height: 26,
                fontSize: 10.5,
                padding: '0 10px',
                background: isAbhaVerified ? '#f0fdf4' : 'var(--bg-surface)',
                border: isAbhaVerified ? '1px solid #86efac' : '1px dashed #0284c7',
                color: isAbhaVerified ? '#15803d' : '#0284c7',
                fontWeight: 700
              }}
              title="Simulate pulling demographics from ABDM using 14-digit ABHA ID"
            >
              <Award size={12} color={isAbhaVerified ? "#15803d" : "#0284c7"} />
              <span>{isAbhaVerified ? '✓ ABHA Synced' : 'Pull ABHA Demographics'}</span>
            </button>
          </div>
        </div>

        {/* M3 Dialog Body */}
        <div className="m3-dialog-body">
          {/* Section 1: Demographics */}
          <div className="m3-form-section">
            <div className="m3-section-title">
              <span>Patient Demographics</span>
            </div>

            <div className="m3-form-grid m3-grid-2-1">
              <div className="m3-text-field">
                <label className="m3-field-label">
                  Legal Full Name <span className="m3-required">*</span>
                </label>
                <div className="m3-input-wrapper">
                  <User size={16} className="m3-field-leading-icon" />
                  <input
                    type="text"
                    name="fullName"
                    className={`m3-input ${errors.fullName ? 'm3-input-error' : ''}`}
                    placeholder="e.g. Sangeetha Krishnan"
                    value={formData.fullName}
                    onChange={handleChange}
                    style={{ paddingRight: 36 }}
                  />
                  <SpeechMicButton 
                    onTranscript={(text) => setFormData(prev => ({ ...prev, fullName: text }))}
                    title="Voice dictate patient name"
                  />
                </div>
                {errors.fullName && <span className="m3-helper-error">{errors.fullName}</span>}
              </div>

              <div className="m3-text-field">
                <label className="m3-field-label">Gender</label>
                <div className="m3-input-wrapper">
                  <select
                    name="gender"
                    className="m3-input m3-select"
                    value={formData.gender}
                    onChange={handleChange}
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="m3-form-grid m3-grid-3">
              <div className="m3-text-field">
                <label className="m3-field-label">
                  Date of Birth <span className="m3-required">*</span>
                </label>
                <div className="m3-input-wrapper">
                  <Calendar size={16} className="m3-field-leading-icon" />
                  <input
                    type="date"
                    name="dob"
                    className={`m3-input ${errors.dob ? 'm3-input-error' : ''}`}
                    value={formData.dob}
                    onChange={handleChange}
                  />
                </div>
                {errors.dob && <span className="m3-helper-error">{errors.dob}</span>}
              </div>

              <div className="m3-text-field">
                <label className="m3-field-label">Age (Auto-Calculated)</label>
                <div className="m3-input-wrapper">
                  <input
                    type="number"
                    name="age"
                    className="m3-input"
                    placeholder="e.g. 52"
                    value={formData.age}
                    onChange={handleChange}
                  />
                </div>
                <span className="m3-helper-text">Derived from DOB</span>
              </div>

              <div className="m3-text-field">
                <label className="m3-field-label">
                  Contact Phone <span className="m3-required">*</span>
                </label>
                <div className="m3-input-wrapper">
                  <Phone size={16} className="m3-field-leading-icon" />
                  <input
                    type="tel"
                    name="phone"
                    className={`m3-input ${errors.phone ? 'm3-input-error' : ''}`}
                    placeholder="e.g. +91 98400 12345"
                    value={formData.phone}
                    onChange={handleChange}
                    style={{ paddingRight: 36 }}
                  />
                  <SpeechMicButton 
                    onTranscript={(text) => setFormData(prev => ({ ...prev, phone: text.replace(/\s+/g, '') }))}
                    title="Voice dictate contact phone"
                  />
                </div>
                {errors.phone && <span className="m3-helper-error">{errors.phone}</span>}
              </div>
            </div>

            <div className="m3-text-field">
              <label className="m3-field-label">Residential Address</label>
              <div className="m3-input-wrapper">
                <MapPin size={16} className="m3-field-leading-icon" />
                <input
                  type="text"
                  name="address"
                  className="m3-input"
                  placeholder="Street address, locality, city"
                  value={formData.address}
                  onChange={handleChange}
                  style={{ paddingRight: 36 }}
                />
                <SpeechMicButton 
                  onTranscript={(text) => setFormData(prev => ({ ...prev, address: text }))}
                  title="Voice dictate address"
                />
              </div>
            </div>

            <div className="m3-form-grid m3-grid-2">
              <div className="m3-text-field">
                <label className="m3-field-label">Emergency Contact Name</label>
                <div className="m3-input-wrapper">
                  <HeartHandshake size={16} className="m3-field-leading-icon" />
                  <input
                    type="text"
                    name="emergencyContactName"
                    className="m3-input"
                    placeholder="e.g. Anand Krishnan (Spouse)"
                    value={formData.emergencyContactName}
                    onChange={handleChange}
                    style={{ paddingRight: 36 }}
                  />
                  <SpeechMicButton 
                    onTranscript={(text) => setFormData(prev => ({ ...prev, emergencyContactName: text }))}
                    title="Voice dictate emergency contact"
                  />
                </div>
              </div>

              <div className="m3-text-field">
                <label className="m3-field-label">Emergency Phone</label>
                <div className="m3-input-wrapper">
                  <Phone size={16} className="m3-field-leading-icon" />
                  <input
                    type="tel"
                    name="emergencyContactPhone"
                    className="m3-input"
                    placeholder="e.g. +91 98400 54321"
                    value={formData.emergencyContactPhone}
                    onChange={handleChange}
                    style={{ paddingRight: 36 }}
                  />
                  <SpeechMicButton 
                    onTranscript={(text) => setFormData(prev => ({ ...prev, emergencyContactPhone: text.replace(/\s+/g, '') }))}
                    title="Voice dictate emergency phone"
                  />
                </div>
              </div>
            </div>

            <div className="m3-text-field">
              <label className="m3-field-label">Assigned Consultant Doctor</label>
              <div className="m3-input-wrapper">
                <Stethoscope size={16} className="m3-field-leading-icon" />
                <select
                  name="doctorAssigned"
                  className="m3-input m3-select"
                  value={formData.doctorAssigned}
                  onChange={handleChange}
                >
                  {ONCOLOGISTS.map(doc => (
                    <option key={doc} value={doc}>{doc}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Clinical Vital Signs & Triage Biometrics */}
          <div className="m3-form-section" style={{ marginTop: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
              <div className="m3-section-title" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Activity size={16} color="var(--primary)" />
                <span>Clinical Vital Signs & Triage Biometrics</span>
              </div>
              
              <button
                type="button"
                className="m3-btn m3-btn-sm"
                onClick={handleFillNormalVitals}
                data-tour="vitals-quick-fill"
                style={{
                  height: 28,
                  fontSize: 11,
                  padding: '0 12px',
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(16, 185, 129, 0.12))',
                  border: '1.5px solid #f59e0b',
                  color: '#b45309',
                  fontWeight: 700,
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
                title="Populate standard normal vital signs"
              >
                <Zap size={12} color="#f59e0b" fill="#f59e0b" />
                <span>⚡ Auto-fill Normal Vitals</span>
              </button>
            </div>

            {/* Vitals Form Grid */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', 
              gap: 12,
              background: 'var(--bg-subtle)',
              padding: 14,
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)'
            }}>
              {/* Blood Pressure */}
              <div className="m3-text-field">
                <label className="m3-field-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Activity size={13} color="#ef4444" />
                  <span>Blood Pressure (BP)</span>
                </label>
                <div className="m3-input-wrapper">
                  <input
                    type="text"
                    name="bp"
                    className="m3-input"
                    placeholder="e.g. 120/80"
                    value={formData.bp}
                    onChange={handleChange}
                    style={{ paddingRight: 64 }}
                  />
                  <span style={{ position: 'absolute', right: 32, fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, pointerEvents: 'none' }}>
                    mmHg
                  </span>
                  <SpeechMicButton 
                    onTranscript={(text) => setFormData(prev => ({ ...prev, bp: text.replace(/\s+/g, '') }))}
                    title="Voice dictate Blood Pressure"
                  />
                </div>
              </div>

              {/* Heart / Pulse Rate */}
              <div className="m3-text-field">
                <label className="m3-field-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Heart size={13} color="#ec4899" />
                  <span>Pulse / Heart Rate</span>
                </label>
                <div className="m3-input-wrapper">
                  <input
                    type="number"
                    name="pulse"
                    className="m3-input"
                    placeholder="e.g. 72"
                    value={formData.pulse}
                    onChange={handleChange}
                    style={{ paddingRight: 58 }}
                  />
                  <span style={{ position: 'absolute', right: 32, fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, pointerEvents: 'none' }}>
                    bpm
                  </span>
                  <SpeechMicButton 
                    onTranscript={(text) => setFormData(prev => ({ ...prev, pulse: text.replace(/\D/g, '') }))}
                    title="Voice dictate pulse rate"
                  />
                </div>
              </div>

              {/* Temperature */}
              <div className="m3-text-field">
                <label className="m3-field-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Thermometer size={13} color="#f97316" />
                  <span>Body Temperature</span>
                </label>
                <div className="m3-input-wrapper">
                  <input
                    type="number"
                    step="0.1"
                    name="temp"
                    className="m3-input"
                    placeholder="e.g. 98.6"
                    value={formData.temp}
                    onChange={handleChange}
                    style={{ paddingRight: 48 }}
                  />
                  <span style={{ position: 'absolute', right: 32, fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, pointerEvents: 'none' }}>
                    °F
                  </span>
                  <SpeechMicButton 
                    onTranscript={(text) => setFormData(prev => ({ ...prev, temp: text.replace(/[^\d.]/g, '') }))}
                    title="Voice dictate temperature"
                  />
                </div>
              </div>

              {/* SpO2 */}
              <div className="m3-text-field">
                <label className="m3-field-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Gauge size={13} color="#0284c7" />
                  <span>SpO2 (Oxygen)</span>
                </label>
                <div className="m3-input-wrapper">
                  <input
                    type="number"
                    name="spo2"
                    className="m3-input"
                    placeholder="e.g. 99"
                    value={formData.spo2}
                    onChange={handleChange}
                    style={{ paddingRight: 45 }}
                  />
                  <span style={{ position: 'absolute', right: 32, fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, pointerEvents: 'none' }}>
                    %
                  </span>
                  <SpeechMicButton 
                    onTranscript={(text) => setFormData(prev => ({ ...prev, spo2: text.replace(/\D/g, '') }))}
                    title="Voice dictate SpO2"
                  />
                </div>
              </div>

              {/* Weight */}
              <div className="m3-text-field">
                <label className="m3-field-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Scale size={13} color="#6366f1" />
                  <span>Weight (kg)</span>
                </label>
                <div className="m3-input-wrapper">
                  <input
                    type="number"
                    step="0.1"
                    name="weight"
                    className="m3-input"
                    placeholder="e.g. 64"
                    value={formData.weight}
                    onChange={handleChange}
                    style={{ paddingRight: 48 }}
                  />
                  <span style={{ position: 'absolute', right: 32, fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, pointerEvents: 'none' }}>
                    kg
                  </span>
                  <SpeechMicButton 
                    onTranscript={(text) => {
                      const val = text.replace(/[^\d.]/g, '');
                      handleChange({ target: { name: 'weight', value: val } });
                    }}
                    title="Voice dictate weight"
                  />
                </div>
              </div>

              {/* Height */}
              <div className="m3-text-field">
                <label className="m3-field-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <User size={13} color="#8b5cf6" />
                  <span>Height (cm)</span>
                </label>
                <div className="m3-input-wrapper">
                  <input
                    type="number"
                    name="height"
                    className="m3-input"
                    placeholder="e.g. 165"
                    value={formData.height}
                    onChange={handleChange}
                    style={{ paddingRight: 50 }}
                  />
                  <span style={{ position: 'absolute', right: 32, fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, pointerEvents: 'none' }}>
                    cm
                  </span>
                  <SpeechMicButton 
                    onTranscript={(text) => {
                      const val = text.replace(/[^\d.]/g, '');
                      handleChange({ target: { name: 'height', value: val } });
                    }}
                    title="Voice dictate height"
                  />
                </div>
              </div>

              {/* Calculated BMI */}
              <div className="m3-text-field">
                <label className="m3-field-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>BMI (Calculated)</span>
                  {formData.bmi && (
                    <span 
                      style={{
                        fontSize: 9.5,
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: 4,
                        backgroundColor: getBmiCategory(formData.bmi)?.bg,
                        color: getBmiCategory(formData.bmi)?.color,
                        border: `1px solid ${getBmiCategory(formData.bmi)?.border}`
                      }}
                    >
                      {getBmiCategory(formData.bmi)?.label}
                    </span>
                  )}
                </label>
                <div className="m3-input-wrapper">
                  <input
                    type="text"
                    name="bmi"
                    className="m3-input"
                    placeholder="e.g. 23.5"
                    value={formData.bmi ? `${formData.bmi} kg/m²` : ''}
                    readOnly
                    style={{ backgroundColor: 'var(--bg-card)', fontWeight: 700, color: 'var(--text-primary)' }}
                  />
                </div>
                <span className="m3-helper-text">Derived from Weight & Height</span>
              </div>

              {/* Respiratory Rate */}
              <div className="m3-text-field">
                <label className="m3-field-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Wind size={13} color="#0d9488" />
                  <span>Respiratory Rate</span>
                </label>
                <div className="m3-input-wrapper">
                  <input
                    type="number"
                    name="respRate"
                    className="m3-input"
                    placeholder="e.g. 16"
                    value={formData.respRate}
                    onChange={handleChange}
                    style={{ paddingRight: 62 }}
                  />
                  <span style={{ position: 'absolute', right: 32, fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, pointerEvents: 'none' }}>
                    /min
                  </span>
                  <SpeechMicButton 
                    onTranscript={(text) => setFormData(prev => ({ ...prev, respRate: text.replace(/\D/g, '') }))}
                    title="Voice dictate respiratory rate"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Insurance & Billing Coverage */}
          <div className="m3-form-section" style={{ marginTop: 24 }}>
            <div className="m3-section-title">
              <span>Billing & Health Coverage</span>
            </div>

            {/* M3 3-Way Segmented Button */}
            <div className="m3-segmented-control" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
              <button
                type="button"
                className={`m3-segment-btn ${formData.insuranceType === 'INSURANCE' ? 'selected' : ''}`}
                onClick={() => setFormData(prev => ({ ...prev, insuranceType: 'INSURANCE' }))}
              >
                <Shield size={16} />
                <span>Health Insurance / TPA</span>
                {formData.insuranceType === 'INSURANCE' && <Check size={14} className="m3-segment-check" />}
              </button>

              <button
                type="button"
                className={`m3-segment-btn ${formData.insuranceType === 'GOVT_SCHEME' ? 'selected' : ''}`}
                onClick={() => setFormData(prev => ({ ...prev, insuranceType: 'GOVT_SCHEME', coveragePct: '100', deductible: '0' }))}
              >
                <Landmark size={16} />
                <span>Govt Scheme / PM-JAY</span>
                {formData.insuranceType === 'GOVT_SCHEME' && <Check size={14} className="m3-segment-check" />}
              </button>

              <button
                type="button"
                className={`m3-segment-btn ${formData.insuranceType === 'CASH' ? 'selected' : ''}`}
                onClick={() => setFormData(prev => ({ ...prev, insuranceType: 'CASH' }))}
              >
                <CreditCard size={16} />
                <span>Direct Cash / Self-Pay</span>
                {formData.insuranceType === 'CASH' && <Check size={14} className="m3-segment-check" />}
              </button>
            </div>

            {/* Option A: Government Schemes & ABHA */}
            {formData.insuranceType === 'GOVT_SCHEME' && (
              <div className="m3-animate-slide-down" style={{ marginTop: 16 }}>
                <div style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  color: '#065f46',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 14
                }}>
                  <Award size={18} color="#059669" style={{ flexShrink: 0 }} />
                  <div>
                    <strong>Ayushman Bharat & Govt Scheme Cashless Billing:</strong> Eligible clinical treatment, diagnostics, and essential medications are 100% cashless under NHA government packages with ₹0 patient deductible.
                  </div>
                </div>

                <div className="m3-form-grid m3-grid-2">
                  <div className="m3-text-field">
                    <label className="m3-field-label">Government Healthcare Scheme</label>
                    <div className="m3-input-wrapper">
                      <Landmark size={16} className="m3-field-leading-icon" />
                      <select
                        name="govtSchemeName"
                        className="m3-input m3-select"
                        value={formData.govtSchemeName}
                        onChange={handleChange}
                      >
                        {GOVT_SCHEMES.map(scheme => (
                          <option key={scheme} value={scheme}>{scheme}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="m3-text-field">
                    <label className="m3-field-label">
                      Beneficiary / Golden Card ID <span className="m3-required">*</span>
                    </label>
                    <div className="m3-input-wrapper">
                      <input
                        type="text"
                        name="beneficiaryId"
                        className={`m3-input ${errors.beneficiaryId ? 'm3-input-error' : ''}`}
                        placeholder="e.g. PMJAY-TN-9821034 / CGHS ID"
                        value={formData.beneficiaryId}
                        onChange={handleChange}
                        style={{ paddingRight: 36 }}
                      />
                      <SpeechMicButton 
                        onTranscript={(text) => setFormData(prev => ({ ...prev, beneficiaryId: text }))}
                        title="Voice dictate beneficiary ID"
                      />
                    </div>
                    {errors.beneficiaryId && <span className="m3-helper-error">{errors.beneficiaryId}</span>}
                  </div>
                </div>

                <div className="m3-form-grid m3-grid-2" style={{ marginTop: 14 }}>
                  <div className="m3-text-field">
                    <label className="m3-field-label">14-Digit ABHA ID (Ayushman Bharat)</label>
                    <div className="m3-input-wrapper">
                      <input
                        type="text"
                        name="abhaId"
                        className="m3-input"
                        placeholder="e.g. 91-4820-1928-3819"
                        value={formData.abhaId}
                        onChange={handleChange}
                        style={{ paddingRight: 36 }}
                      />
                      <SpeechMicButton 
                        onTranscript={(text) => setFormData(prev => ({ ...prev, abhaId: text }))}
                        title="Voice dictate ABHA ID"
                      />
                    </div>
                    <span className="m3-helper-text">Ayushman Bharat Health Account ID for ABDM records</span>
                  </div>

                  <div className="m3-text-field">
                    <label className="m3-field-label">ABHA Address (@abdm)</label>
                    <div className="m3-input-wrapper">
                      <input
                        type="text"
                        name="abhaAddress"
                        className="m3-input"
                        placeholder="e.g. rajan.pillai@abdm"
                        value={formData.abhaAddress}
                        onChange={handleChange}
                        style={{ paddingRight: 36 }}
                      />
                      <SpeechMicButton 
                        onTranscript={(text) => setFormData(prev => ({ ...prev, abhaAddress: text }))}
                        title="Voice dictate ABHA address"
                      />
                    </div>
                    <span className="m3-helper-text">ABDM digital consent & record repository address</span>
                  </div>
                </div>
              </div>
            )}

            {/* Option B: Private Health Insurance / TPA */}
            {formData.insuranceType === 'INSURANCE' && (
              <div className="m3-animate-slide-down" style={{ marginTop: 16 }}>
                <div className="m3-form-grid m3-grid-2">
                  <div className="m3-text-field">
                    <label className="m3-field-label">Insurance Provider</label>
                    <div className="m3-input-wrapper">
                      <Building2 size={16} className="m3-field-leading-icon" />
                      <select
                        name="insuranceProvider"
                        className="m3-input m3-select"
                        value={formData.insuranceProvider}
                        onChange={handleChange}
                      >
                        {COMMON_INSURERS.filter(i => i !== 'Self-Pay / Cash').map(ins => (
                          <option key={ins} value={ins}>{ins}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="m3-text-field">
                    <label className="m3-field-label">
                      Policy Number <span className="m3-required">*</span>
                    </label>
                    <div className="m3-input-wrapper">
                      <input
                        type="text"
                        name="policyNumber"
                        className={`m3-input ${errors.policyNumber ? 'm3-input-error' : ''}`}
                        placeholder="e.g. SH-2026-99120"
                        value={formData.policyNumber}
                        onChange={handleChange}
                        style={{ paddingRight: 36 }}
                      />
                      <SpeechMicButton 
                        onTranscript={(text) => setFormData(prev => ({ ...prev, policyNumber: text }))}
                        title="Voice dictate policy number"
                      />
                    </div>
                    {errors.policyNumber && <span className="m3-helper-error">{errors.policyNumber}</span>}
                  </div>
                </div>

                <div className="m3-form-grid m3-grid-3" style={{ marginTop: 14 }}>
                  <div className="m3-text-field">
                    <label className="m3-field-label">Group / Corporate ID</label>
                    <div className="m3-input-wrapper">
                      <input
                        type="text"
                        name="groupNumber"
                        className="m3-input"
                        placeholder="e.g. GRP-4022"
                        value={formData.groupNumber}
                        onChange={handleChange}
                        style={{ paddingRight: 36 }}
                      />
                      <SpeechMicButton 
                        onTranscript={(text) => setFormData(prev => ({ ...prev, groupNumber: text }))}
                        title="Voice dictate group ID"
                      />
                    </div>
                  </div>

                  <div className="m3-text-field">
                    <label className="m3-field-label">Coverage Tier (%)</label>
                    <div className="m3-input-wrapper">
                      <input
                        type="number"
                        name="coveragePct"
                        className="m3-input"
                        value={formData.coveragePct}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="m3-text-field">
                    <label className="m3-field-label">Deductible (₹)</label>
                    <div className="m3-input-wrapper">
                      <input
                        type="number"
                        name="deductible"
                        className="m3-input"
                        value={formData.deductible}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>

                {/* Optional ABHA ID link for private insurance */}
                <div className="m3-form-grid m3-grid-2" style={{ marginTop: 14 }}>
                  <div className="m3-text-field">
                    <label className="m3-field-label">ABHA Health ID (Optional)</label>
                    <div className="m3-input-wrapper">
                      <input
                        type="text"
                        name="abhaId"
                        className="m3-input"
                        placeholder="e.g. 91-4820-1928-3819"
                        value={formData.abhaId}
                        onChange={handleChange}
                        style={{ paddingRight: 36 }}
                      />
                      <SpeechMicButton 
                        onTranscript={(text) => setFormData(prev => ({ ...prev, abhaId: text }))}
                        title="Voice dictate ABHA ID"
                      />
                    </div>
                  </div>
                  <div className="m3-text-field">
                    <label className="m3-field-label">ABHA Address (Optional)</label>
                    <div className="m3-input-wrapper">
                      <input
                        type="text"
                        name="abhaAddress"
                        className="m3-input"
                        placeholder="e.g. name@abdm"
                        value={formData.abhaAddress}
                        onChange={handleChange}
                        style={{ paddingRight: 36 }}
                      />
                      <SpeechMicButton 
                        onTranscript={(text) => setFormData(prev => ({ ...prev, abhaAddress: text }))}
                        title="Voice dictate ABHA address"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Option C: Cash / Self-Pay */}
            {formData.insuranceType === 'CASH' && (
              <div className="m3-animate-slide-down" style={{ marginTop: 16 }}>
                <div style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#fef3c7',
                  border: '1px solid #fde68a',
                  color: '#92400e',
                  fontSize: '12px',
                  marginBottom: 14
                }}>
                  <strong>Direct Hospital Payment:</strong> Patient will settle charges directly at the cashier desk. Hospital standard oncology price list applies.
                </div>
                <div className="m3-form-grid m3-grid-2">
                  <div className="m3-text-field">
                    <label className="m3-field-label">ABHA Health ID (Optional)</label>
                    <div className="m3-input-wrapper">
                      <input
                        type="text"
                        name="abhaId"
                        className="m3-input"
                        placeholder="e.g. 91-4820-1928-3819"
                        value={formData.abhaId}
                        onChange={handleChange}
                        style={{ paddingRight: 36 }}
                      />
                      <SpeechMicButton 
                        onTranscript={(text) => setFormData(prev => ({ ...prev, abhaId: text }))}
                        title="Voice dictate ABHA ID"
                      />
                    </div>
                  </div>
                  <div className="m3-text-field">
                    <label className="m3-field-label">ABHA Address (Optional)</label>
                    <div className="m3-input-wrapper">
                      <input
                        type="text"
                        name="abhaAddress"
                        className="m3-input"
                        placeholder="e.g. name@abdm"
                        value={formData.abhaAddress}
                        onChange={handleChange}
                        style={{ paddingRight: 36 }}
                      />
                      <SpeechMicButton 
                        onTranscript={(text) => setFormData(prev => ({ ...prev, abhaAddress: text }))}
                        title="Voice dictate ABHA address"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* M3 Dialog Actions */}
        <div className="m3-dialog-actions">
          <button 
            type="button"
            className="m3-btn m3-btn-text" 
            onClick={onClose}
          >
            Cancel
          </button>
          
          <div style={{ display: 'flex', gap: 12 }}>
            <button 
              type="button"
              className="m3-btn m3-btn-outlined" 
              onClick={() => handleSubmit(false)}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Registering...' : 'Save Record Only'}
            </button>
            <button 
              type="button"
              className="m3-btn m3-btn-filled" 
              onClick={() => handleSubmit(true)}
              data-tour="register-submit-btn"
              disabled={isSubmitting}
            >
              <ClipboardList size={16} />
              <span>{isSubmitting ? 'Registering...' : 'Register & Start Intake'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
