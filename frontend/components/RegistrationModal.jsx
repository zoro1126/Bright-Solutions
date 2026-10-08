import React, { useState, useEffect } from 'react';
import { 
  X, UserPlus, HeartPulse, User, Phone, MapPin, 
  AlertCircle, CheckCircle, Sparkles, Activity, Shield 
} from 'lucide-react';

export default function RegistrationModal({
  isOpen,
  onClose,
  doctors,
  nextToken,
  onSuccess
}) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    dob: '1985-05-15',
    gender: 'MALE',
    blood_group: 'B+',
    phone: '',
    email: '',
    address: '42 MG Road, Koramangala, Bengaluru',
    emergency_contact: '',
    doctor_id: doctors?.[0]?.id || 2,
    chief_complaint: 'Routine health checkup and blood pressure monitoring',
    insurance_type: 'CASH',
    insurance_provider: '',
    policy_number: '',
    vitals: {
      systolic_bp: 120,
      diastolic_bp: 80,
      pulse_rate: 72,
      temperature_f: 98.6,
      resp_rate: 16,
      spo2_pct: 98,
      weight_kg: 68.0,
      height_cm: 172.0
    }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sync default doctor if list loads after modal opens
  useEffect(() => {
    if (doctors && doctors.length > 0) {
      setFormData(prev => ({ 
        ...prev, 
        doctor_id: (prev.doctor_id && doctors.some(d => d.id === parseInt(prev.doctor_id, 10))) 
          ? prev.doctor_id 
          : doctors[0].id 
      }));
    }
  }, [doctors]);

  if (!isOpen) return null;

  // Real-time Age calculation from DOB
  const calculateAge = (dobString) => {
    if (!dobString) return '';
    const birthDate = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age > 0 ? `${age} yrs` : 'Infant';
  };

  // Real-time BMI calculation
  const weight = parseFloat(formData.vitals.weight_kg);
  const height = parseFloat(formData.vitals.height_cm);
  let liveBmi = null;
  let liveBmiCategory = null;
  if (weight > 0 && height > 0) {
    const hMeter = height / 100.0;
    liveBmi = (weight / (hMeter * hMeter)).toFixed(1);
    if (liveBmi < 18.5) liveBmiCategory = { text: 'Underweight', class: 'bmi-underweight' };
    else if (liveBmi < 25.0) liveBmiCategory = { text: 'Normal Weight', class: 'bmi-normal' };
    else if (liveBmi < 30.0) liveBmiCategory = { text: 'Overweight', class: 'bmi-overweight' };
    else liveBmiCategory = { text: 'Obese', class: 'bmi-obese' };
  }

  // Real-time AHA Blood Pressure Classification
  const sys = parseInt(formData.vitals.systolic_bp, 10);
  const dia = parseInt(formData.vitals.diastolic_bp, 10);
  let liveBpStage = null;
  if (sys > 0 && dia > 0) {
    if (sys >= 180 || dia >= 120) {
      liveBpStage = { text: 'Hypertensive Crisis (Urgent)', alertClass: 'alert-high', isCrisis: true };
    } else if (sys >= 140 || dia >= 90) {
      liveBpStage = { text: 'Stage 2 Hypertension', alertClass: 'alert-high', isCrisis: false };
    } else if ((sys >= 130 && sys <= 139) || (dia >= 80 && dia <= 89)) {
      liveBpStage = { text: 'Stage 1 Hypertension', alertClass: 'alert-elevated', isCrisis: false };
    } else if (sys >= 120 && sys <= 129 && dia < 80) {
      liveBpStage = { text: 'Elevated BP', alertClass: 'alert-elevated', isCrisis: false };
    } else if (sys < 120 && dia < 80) {
      liveBpStage = { text: 'Normal BP', alertClass: 'alert-normal', isCrisis: false };
    } else {
      liveBpStage = { text: 'Borderline BP', alertClass: 'alert-elevated', isCrisis: false };
    }
  }

  // Quick Demo Presets
  const fillSamplePatient = () => {
    setFormData({
      first_name: 'Ramesh',
      last_name: 'Patel',
      dob: '1976-08-22',
      gender: 'MALE',
      blood_group: 'B+',
      phone: '9876543210',
      email: 'ramesh.patel@example.com',
      address: '104 Sunrise Residency, Indiranagar, Bengaluru',
      emergency_contact: 'Sunita Patel (Spouse) - 9876543219',
      doctor_id: doctors?.[0]?.id || 2,
      chief_complaint: 'Complains of mild headache and morning dizziness for past 4 days.',
      insurance_type: 'CASH',
      insurance_provider: '',
      policy_number: '',
      vitals: {
        systolic_bp: 138,
        diastolic_bp: 88,
        pulse_rate: 76,
        temperature_f: 98.4,
        resp_rate: 16,
        spo2_pct: 98,
        weight_kg: 74.5,
        height_cm: 171.0
      }
    });
    setError(null);
  };

  const fillNormalVitals = () => {
    setFormData(prev => ({
      ...prev,
      vitals: {
        ...prev.vitals,
        systolic_bp: 118,
        diastolic_bp: 78,
        pulse_rate: 72,
        temperature_f: 98.4,
        resp_rate: 16,
        spo2_pct: 99,
        weight_kg: 68.0,
        height_cm: 172.0
      }
    }));
  };

  const fillCriticalVitals = () => {
    setFormData(prev => ({
      ...prev,
      vitals: {
        ...prev.vitals,
        systolic_bp: 184,
        diastolic_bp: 116,
        pulse_rate: 108,
        temperature_f: 101.4,
        resp_rate: 22,
        spo2_pct: 92,
        weight_kg: 92.0,
        height_cm: 168.0
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      setError('Please provide patient first and last name.');
      return;
    }

    if (!formData.phone.trim()) {
      setError('Primary contact phone number is required.');
      return;
    }

    setLoading(true);
    try {
      // Clean and format payload
      const payload = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        dob: formData.dob,
        gender: formData.gender,
        blood_group: formData.blood_group,
        phone: formData.phone.trim(),
        email: formData.email.trim() || null,
        address: formData.address.trim() || null,
        emergency_contact: formData.emergency_contact.trim() || null,
        doctor_id: parseInt(formData.doctor_id, 10),
        chief_complaint: formData.chief_complaint.trim() || 'General Consultation',
        insurance_type: formData.insurance_type,
        insurance_provider: formData.insurance_provider.trim() || null,
        policy_number: formData.policy_number.trim() || null,
        vitals: {
          systolic_bp: formData.vitals.systolic_bp ? parseInt(formData.vitals.systolic_bp, 10) : null,
          diastolic_bp: formData.vitals.diastolic_bp ? parseInt(formData.vitals.diastolic_bp, 10) : null,
          pulse_rate: formData.vitals.pulse_rate ? parseInt(formData.vitals.pulse_rate, 10) : null,
          temperature_f: formData.vitals.temperature_f ? parseFloat(formData.vitals.temperature_f) : null,
          resp_rate: formData.vitals.resp_rate ? parseInt(formData.vitals.resp_rate, 10) : null,
          spo2_pct: formData.vitals.spo2_pct ? parseInt(formData.vitals.spo2_pct, 10) : null,
          weight_kg: formData.vitals.weight_kg ? parseFloat(formData.vitals.weight_kg) : null,
          height_cm: formData.vitals.height_cm ? parseFloat(formData.vitals.height_cm) : null
        }
      };

      const result = await onSuccess(payload);
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-wrapper">
            <div className="modal-title-icon">
              <UserPlus size={20} />
            </div>
            <div>
              <h2>Bright Solutions • Patient Registration & Triage</h2>
              <p>OPD Session • Next Queue Token Allocated: <strong style={{ color: 'var(--yellow-400)' }}>{nextToken}</strong></p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div className="modal-body">
            {/* Quick Fill Preset Toolbar */}
            <div className="quick-fill-bar">
              <span className="quick-fill-title">
                <Sparkles size={16} color="#B89C14" />
                <span>Quick Test Data Presets:</span>
              </span>
              <div className="quick-fill-actions">
                <button type="button" className="chip-btn" onClick={fillSamplePatient}>
                  ⚡ Fill Sample Patient
                </button>
                <button type="button" className="chip-btn" onClick={fillNormalVitals}>
                  ✓ Normal Vitals
                </button>
                <button type="button" className="chip-btn" style={{ borderColor: '#DC2626', color: '#DC2626' }} onClick={fillCriticalVitals}>
                  ⚠️ High BP Alert
                </button>
              </div>
            </div>

            {error && (
              <div style={{
                background: '#FEF2F2',
                border: '1px solid #F87171',
                color: '#B91C1C',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            {/* SECTION 1: Patient Demographics */}
            <div className="form-section-title">
              <User size={18} color="#0055FF" />
              <span>Section 1: Patient Demographics & Profile</span>
            </div>

            <div className="form-grid-3">
              <div className="form-group">
                <label>First Name <span className="required">*</span></label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Ramesh"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Last Name <span className="required">*</span></label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Patel"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  Date of Birth <span className="required">*</span>
                  <span style={{ marginLeft: '0.4rem', color: '#0055FF', fontWeight: 'bold' }}>
                    ({calculateAge(formData.dob)})
                  </span>
                </label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.dob}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-grid-3">
              <div className="form-group">
                <label>Gender <span className="required">*</span></label>
                <select
                  className="form-control"
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>Blood Group</label>
                <select
                  className="form-control"
                  value={formData.blood_group}
                  onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
                >
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="UNKNOWN">Unknown</option>
                </select>
              </div>

              <div className="form-group">
                <label>Phone Number <span className="required">*</span></label>
                <input
                  type="tel"
                  className="form-control"
                  placeholder="e.g. 9876543210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="patient@example.com (optional)"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Emergency Contact & Relation</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Sunita Patel (Spouse) - 9876543219"
                  value={formData.emergency_contact}
                  onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label>Residential Address</label>
              <input
                type="text"
                className="form-control"
                placeholder="Door No, Street, Landmark, City"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            {/* Attending Physician & Chief Complaint */}
            <div className="form-grid-2" style={{ marginBottom: '1.25rem' }}>
              <div className="form-group">
                <label>Attending Physician <span className="required">*</span></label>
                <select
                  className="form-control"
                  value={formData.doctor_id}
                  onChange={(e) => setFormData({ ...formData, doctor_id: e.target.value })}
                  required
                >
                  {doctors && doctors.length > 0 ? (
                    doctors.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.full_name} ({doc.email})
                      </option>
                    ))
                  ) : (
                    <option value="2">Dr. Vikram Kulkarni, MD</option>
                  )}
                </select>
              </div>

              <div className="form-group">
                <label>Payment / Billing Mode</label>
                <select
                  className="form-control"
                  value={formData.insurance_type}
                  onChange={(e) => setFormData({ ...formData, insurance_type: e.target.value })}
                >
                  <option value="CASH">Direct Cash / Self-Pay</option>
                  <option value="INSURANCE">Private Health Insurance (TPA)</option>
                  <option value="GOVT_SCHEME">Ayushman Bharat / State Health Card</option>
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.75rem' }}>
              <label>Chief Complaint / Primary Symptoms</label>
              <textarea
                className="form-control"
                rows="2"
                placeholder="Reason for OPD visit (e.g., persistent fever, headache, routine checkup)..."
                value={formData.chief_complaint}
                onChange={(e) => setFormData({ ...formData, chief_complaint: e.target.value })}
              />
            </div>

            {/* SECTION 2: Triage Vital Signs */}
            <div className="form-section-title">
              <HeartPulse size={18} color="#DC2626" />
              <span>Section 2: Triage Vital Signs & Clinical Biometrics</span>
            </div>

            <div className="form-grid-4">
              <div className="form-group">
                <label>Systolic BP (mmHg)</label>
                <input
                  type="number"
                  min="50"
                  max="280"
                  className="form-control"
                  placeholder="120"
                  value={formData.vitals.systolic_bp}
                  onChange={(e) => setFormData({
                    ...formData,
                    vitals: { ...formData.vitals, systolic_bp: e.target.value }
                  })}
                />
              </div>

              <div className="form-group">
                <label>Diastolic BP (mmHg)</label>
                <input
                  type="number"
                  min="30"
                  max="180"
                  className="form-control"
                  placeholder="80"
                  value={formData.vitals.diastolic_bp}
                  onChange={(e) => setFormData({
                    ...formData,
                    vitals: { ...formData.vitals, diastolic_bp: e.target.value }
                  })}
                />
              </div>

              <div className="form-group">
                <label>Pulse Rate (bpm)</label>
                <input
                  type="number"
                  min="30"
                  max="220"
                  className="form-control"
                  placeholder="72"
                  value={formData.vitals.pulse_rate}
                  onChange={(e) => setFormData({
                    ...formData,
                    vitals: { ...formData.vitals, pulse_rate: e.target.value }
                  })}
                />
              </div>

              <div className="form-group">
                <label>Body Temp (°F)</label>
                <input
                  type="number"
                  step="0.1"
                  min="90"
                  max="110"
                  className="form-control"
                  placeholder="98.6"
                  value={formData.vitals.temperature_f}
                  onChange={(e) => setFormData({
                    ...formData,
                    vitals: { ...formData.vitals, temperature_f: e.target.value }
                  })}
                />
              </div>
            </div>

            <div className="form-grid-4">
              <div className="form-group">
                <label>SpO2 Saturation (%)</label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  className="form-control"
                  placeholder="98"
                  value={formData.vitals.spo2_pct}
                  onChange={(e) => setFormData({
                    ...formData,
                    vitals: { ...formData.vitals, spo2_pct: e.target.value }
                  })}
                />
              </div>

              <div className="form-group">
                <label>Resp. Rate (bpm)</label>
                <input
                  type="number"
                  min="8"
                  max="50"
                  className="form-control"
                  placeholder="16"
                  value={formData.vitals.resp_rate}
                  onChange={(e) => setFormData({
                    ...formData,
                    vitals: { ...formData.vitals, resp_rate: e.target.value }
                  })}
                />
              </div>

              <div className="form-group">
                <label>Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  min="2"
                  max="300"
                  className="form-control"
                  placeholder="70.0"
                  value={formData.vitals.weight_kg}
                  onChange={(e) => setFormData({
                    ...formData,
                    vitals: { ...formData.vitals, weight_kg: e.target.value }
                  })}
                />
              </div>

              <div className="form-group">
                <label>Height (cm)</label>
                <input
                  type="number"
                  step="0.5"
                  min="40"
                  max="240"
                  className="form-control"
                  placeholder="172.0"
                  value={formData.vitals.height_cm}
                  onChange={(e) => setFormData({
                    ...formData,
                    vitals: { ...formData.vitals, height_cm: e.target.value }
                  })}
                />
              </div>
            </div>

            {/* Clinical Live Feedback Bar */}
            <div className="vitals-live-feedback">
              {/* Live BP Evaluation */}
              <div className="clinical-badge-card">
                <div>
                  <div className="clinical-badge-label">AHA Blood Pressure Evaluation</div>
                  <div className="clinical-badge-value" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                    <span>{sys || '--'}/{dia || '--'} mmHg</span>
                    {liveBpStage && (
                      <span className={`vital-chip ${liveBpStage.alertClass}`}>
                        {liveBpStage.text}
                      </span>
                    )}
                  </div>
                </div>
                {liveBpStage?.isCrisis && (
                  <span style={{ fontSize: '0.72rem', color: '#DC2626', fontWeight: 700 }}>
                    ⚠️ CRISIS ALERT
                  </span>
                )}
              </div>

              {/* Live BMI Evaluation */}
              <div className="clinical-badge-card">
                <div>
                  <div className="clinical-badge-label">Calculated Body Mass Index (BMI)</div>
                  <div className="clinical-badge-value" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                    <span>{liveBmi ? `${liveBmi} kg/m²` : '--'}</span>
                    {liveBmiCategory && (
                      <span className={`bmi-badge ${liveBmiCategory.class}`}>
                        {liveBmiCategory.text}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Modal Footer */}
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading}
              id="submit-patient-btn"
            >
              <CheckCircle size={18} />
              <span>{loading ? 'Registering...' : 'Save & Issue OPD Token'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
