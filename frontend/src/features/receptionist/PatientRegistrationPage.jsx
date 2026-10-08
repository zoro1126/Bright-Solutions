import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserPlus,
  Activity,
  Heart,
  Scale,
  Mic,
  MicOff,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Printer,
  Sparkles,
} from 'lucide-react';
import { api } from '../../services/api';
import { Button, Input, Select, Card, Badge, Stepper, useToast } from '../../components/ui';
import { ROUTES } from '../../routes';

// Live AHA Blood Pressure 2017 Stage Evaluator
export function LiveAhaBpStageGauge({ systolic, diastolic }) {
  const sys = Number(systolic) || 0;
  const dia = Number(diastolic) || 0;

  let stage = 'Normal BP';
  let variant = 'normal';
  let desc = 'Systolic < 120 and Diastolic < 80 mmHg';
  let isCrisis = false;

  if (sys >= 180 || dia >= 120) {
    stage = 'Hypertensive Crisis';
    variant = 'crisis';
    desc = 'CRITICAL ALERT: Emergency stabilization required (>180/120 mmHg)';
    isCrisis = true;
  } else if (sys >= 140 || dia >= 90) {
    stage = 'Stage 2 Hypertension';
    variant = 'stage2';
    desc = 'Systolic ≥ 140 or Diastolic ≥ 90 mmHg';
  } else if (sys >= 130 || dia >= 80) {
    stage = 'Stage 1 Hypertension';
    variant = 'stage1';
    desc = 'Systolic 130–139 or Diastolic 80–89 mmHg';
  } else if (sys >= 120 && dia < 80) {
    stage = 'Elevated Blood Pressure';
    variant = 'elevated';
    desc = 'Systolic 120–129 and Diastolic < 80 mmHg';
  }

  return (
    <div className={`p-4 rounded-xl border transition-all ${
      isCrisis
        ? 'bg-[#450A0A] border-[#DC2626] text-white ring-4 ring-[#DC2626]/20'
        : 'bg-[#F6F7FA] dark:bg-[#0F355A] border-[#CBD5E1] dark:border-[#1B456E]'
    }`}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-bold uppercase font-mono tracking-wider text-[#64748B] dark:text-[#94A3B8]">
          AHA 2017 Clinical BP Classification
        </span>
        <Badge variant={variant} pulsing={isCrisis}>
          {stage}
        </Badge>
      </div>
      <div className="flex items-baseline gap-2 font-mono">
        <span className="text-xl font-black">
          {sys || '--'}/{dia || '--'}
        </span>
        <span className="text-xs text-[#64748B] dark:text-[#CBD5E1]">mmHg</span>
      </div>
      <p className="text-[11px] mt-1 text-[#64748B] dark:text-[#94A3B8]">
        {desc}
      </p>
    </div>
  );
}

// Live BMI Calculator Badge
export function LiveBmiCalculatorBadge({ weightKg, heightCm }) {
  const w = Number(weightKg) || 0;
  const h = Number(heightCm) || 0;

  let bmi = 0;
  let category = 'Awaiting Height/Weight';
  let variant = 'neutral';

  if (w > 0 && h > 0) {
    const heightM = h / 100;
    bmi = +(w / (heightM * heightM)).toFixed(1);

    if (bmi < 18.5) {
      category = 'Underweight';
      variant = 'info';
    } else if (bmi <= 24.9) {
      category = 'Normal Weight';
      variant = 'normal';
    } else if (bmi <= 29.9) {
      category = 'Overweight';
      variant = 'elevated';
    } else {
      category = 'Obese';
      variant = 'stage2';
    }
  }

  return (
    <div className="p-4 rounded-xl bg-[#F6F7FA] dark:bg-[#0F355A] border border-[#CBD5E1] dark:border-[#1B456E]">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-bold uppercase font-mono tracking-wider text-[#64748B] dark:text-[#94A3B8]">
          Calculated Body Mass Index (BMI)
        </span>
        <Badge variant={variant}>{category}</Badge>
      </div>
      <div className="flex items-baseline gap-2 font-mono">
        <span className="text-xl font-black">{bmi > 0 ? bmi : '--'}</span>
        <span className="text-xs text-[#64748B] dark:text-[#CBD5E1]">kg/m²</span>
      </div>
      <p className="text-[11px] mt-1 text-[#64748B] dark:text-[#94A3B8]">
        Standard WHO biometrics reference range
      </p>
    </div>
  );
}

export function PatientRegistrationPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [currentStep, setCurrentStep] = useState(0);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [issuedToken, setIssuedToken] = useState(null);

  // Form State
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    dob: '',
    gender: 'MALE',
    blood_group: 'B+',
    phone: '',
    email: '',
    address: '',
    emergency_contact: '',
    doctor_id: 2,
    chief_complaint: '',
    insurance_type: 'CASH',
    insurance_provider: '',
    policy_number: '',
    vitals: {
      systolic_bp: 120,
      diastolic_bp: 80,
      pulse_rate: 74,
      temperature_f: 98.6,
      resp_rate: 16,
      spo2_pct: 98,
      weight_kg: 70,
      height_cm: 172,
    },
  });

  // Web Speech STT for voice dictation
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    async function loadDoctors() {
      try {
        const data = await api.getDoctors();
        setDoctors(data.doctors || []);
      } catch (e) {
        console.error(e);
      }
    }
    loadDoctors();
  }, []);

  function handleQuickPreset(type) {
    if (type === 'sample') {
      setForm((prev) => ({
        ...prev,
        first_name: 'Prem',
        last_name: 'Deshani',
        dob: '1978-10-15',
        phone: '9840012345',
        address: '42 Orchid Heights, MG Road, Bengaluru',
        emergency_contact: 'Kavita Deshani (Spouse) - 9840012349',
        chief_complaint: 'Routine cardiac health review and morning headache',
        insurance_type: 'PM_JAY',
        insurance_provider: 'Ayushman Bharat PM-JAY',
        policy_number: 'ABHA-PMJAY-8840192',
        vitals: {
          systolic_bp: 138,
          diastolic_bp: 88,
          pulse_rate: 76,
          temperature_f: 98.4,
          resp_rate: 16,
          spo2_pct: 98,
          weight_kg: 74.5,
          height_cm: 171,
        },
      }));
      addToast({ title: 'Preset Applied', message: 'Populated full sample patient intake profile.', type: 'info' });
    } else if (type === 'normal') {
      setForm((prev) => ({
        ...prev,
        vitals: {
          ...prev.vitals,
          systolic_bp: 120,
          diastolic_bp: 80,
          pulse_rate: 72,
          temperature_f: 98.6,
          spo2_pct: 99,
          weight_kg: 68,
          height_cm: 170,
        },
      }));
      addToast({ title: 'Normal Vitals', message: 'Set standard baseline vitals (120/80 mmHg).', type: 'info' });
    } else if (type === 'alert') {
      setForm((prev) => ({
        ...prev,
        vitals: {
          ...prev.vitals,
          systolic_bp: 172,
          diastolic_bp: 104,
          pulse_rate: 96,
          temperature_f: 99.2,
          spo2_pct: 95,
        },
      }));
      addToast({ title: 'High BP Alert Set', message: 'Simulating Stage 2 severe hypertension triage.', type: 'warning' });
    }
  }

  function toggleVoiceDictation() {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      addToast({ title: 'Speech API Unavailable', message: 'Web Speech API is not supported in this browser.', type: 'error' });
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    if (!isListening) {
      recognition.start();
      setIsListening(true);
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setForm((prev) => ({
          ...prev,
          chief_complaint: prev.chief_complaint ? `${prev.chief_complaint} ${transcript}` : transcript,
        }));
        setIsListening(false);
        addToast({ title: 'Voice Dictated', message: `Appended: "${transcript}"`, type: 'success' });
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
    } else {
      setIsListening(false);
    }
  }

  async function handleRegistrationSubmit(e) {
    e.preventDefault();
    if (!form.first_name || !form.phone) {
      addToast({ title: 'Validation Error', message: 'First name and phone number are required.', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const res = await api.registerPatient(form);
      setIssuedToken({
        token: res.visit?.queue_token || 'Q-104',
        uhid: res.patient?.uhid || 'UHID-2026-00004',
        name: `${form.first_name} ${form.last_name}`,
        doctor: doctors.find((d) => d.id === Number(form.doctor_id))?.name || 'Dr. Vikram Kulkarni',
        date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        vitals: form.vitals,
      });
      addToast({ title: 'Patient Registered', message: `Token #${res.visit?.queue_token} allocated successfully!`, type: 'success' });
    } catch (err) {
      addToast({ title: 'Registration Failed', message: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  const steps = [
    { id: 'demo', title: 'Demographics', desc: 'Patient legal profile' },
    { id: 'vitals', title: 'Triage Biometrics', desc: 'BP & Vitals evaluation' },
    { id: 'confirm', title: 'Coverage & Token', desc: 'Doctor allocation' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Presets Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-[#E2E8F0] dark:border-[#1B456E]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0A2540] dark:text-white">
            New Patient Registration & Triage
          </h1>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8] font-mono mt-0.5">
            P-REC-02 • Real-Time AHA 2017 Blood Pressure & BMI Engine
          </p>
        </div>

        {/* 1-Click Fast Presets Bar */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono font-bold text-[#64748B] mr-1">
            Presets:
          </span>
          <Button variant="outline" size="sm" onClick={() => handleQuickPreset('sample')}>
            ⚡ Sample Patient
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleQuickPreset('normal')}>
            Normal Vitals
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleQuickPreset('alert')}>
            High BP Alert
          </Button>
        </div>
      </div>

      {/* Stepper Navigation */}
      <Card variant="surface" className="p-4">
        <Stepper steps={steps} currentStep={currentStep} onStepClick={setCurrentStep} />
      </Card>

      {/* Token Issued Confirmation Slip (Printable 80mm format) */}
      {issuedToken ? (
        <Card variant="surface" className="p-8 max-w-xl mx-auto space-y-6 border-2 border-[#FFE500]">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-[#FFE500] text-[#051A30] mx-auto flex items-center justify-center font-bold">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-[#0A2540] dark:text-white">
              OPD Encounter Token Issued
            </h2>
            <p className="text-xs text-[#64748B] font-mono">
              Patient registered and triaged into doctor's consultation queue.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#F6F7FA] dark:bg-[#0F355A] border border-[#CBD5E1] dark:border-[#1B456E] space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0] dark:border-[#1B456E]">
              <span className="text-[#64748B]">Queue Token:</span>
              <span className="text-2xl font-black text-[#0A2540] dark:text-[#FFE500]">
                #{issuedToken.token}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#64748B]">Patient UHID:</span>
              <span className="font-bold">{issuedToken.uhid}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#64748B]">Full Name:</span>
              <span className="font-bold">{issuedToken.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#64748B]">Assigned Doctor:</span>
              <span className="font-bold">{issuedToken.doctor}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#64748B]">Triage Vitals:</span>
              <span>{issuedToken.vitals.systolic_bp}/{issuedToken.vitals.diastolic_bp} mmHg • {issuedToken.vitals.pulse_rate} bpm</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="flex-1 justify-center"
              icon={Printer}
              onClick={() => window.print()}
            >
              Print Token Slip
            </Button>
            <Button
              variant="primary"
              className="flex-1 justify-center font-bold"
              icon={ArrowRight}
              iconPosition="right"
              onClick={() => navigate(ROUTES.RECEPTIONIST.QUESTIONNAIRE)}
            >
              Start MCQ Questionnaire
            </Button>
          </div>
        </Card>
      ) : (
        <form onSubmit={handleRegistrationSubmit} className="space-y-6">
          {/* STEP 0: Demographics */}
          {currentStep === 0 && (
            <Card variant="surface" className="p-6 space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#0A2540] dark:text-white pb-3 border-b border-[#F1F5F9] dark:border-[#1B456E]">
                Section 1: Patient Legal Demographics
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <Input
                  label="First Name"
                  required
                  placeholder="e.g. Ramesh"
                  value={form.first_name}
                  onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                />
                <Input
                  label="Last Name"
                  placeholder="e.g. Patel"
                  value={form.last_name}
                  onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                />
                <Input
                  label="Date of Birth"
                  type="date"
                  required
                  value={form.dob}
                  onChange={(e) => setForm({ ...form, dob: e.target.value })}
                />
                <Select
                  label="Gender"
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  options={[
                    { value: 'MALE', label: 'Male' },
                    { value: 'FEMALE', label: 'Female' },
                    { value: 'OTHER', label: 'Other / Non-binary' },
                  ]}
                />
                <Select
                  label="Blood Group"
                  value={form.blood_group}
                  onChange={(e) => setForm({ ...form, blood_group: e.target.value })}
                  options={[
                    { value: 'A+', label: 'A+' },
                    { value: 'A-', label: 'A-' },
                    { value: 'B+', label: 'B+' },
                    { value: 'B-', label: 'B-' },
                    { value: 'AB+', label: 'AB+' },
                    { value: 'AB-', label: 'AB-' },
                    { value: 'O+', label: 'O+' },
                    { value: 'O-', label: 'O-' },
                    { value: 'UNKNOWN', label: 'Unknown' },
                  ]}
                />
                <Input
                  label="Primary Phone Number"
                  required
                  placeholder="e.g. 9876543210"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                <Input
                  label="Residential Address"
                  placeholder="Street address, locality, city"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
                <Input
                  label="Emergency Contact"
                  placeholder="Full name & relationship - Phone"
                  value={form.emergency_contact}
                  onChange={(e) => setForm({ ...form, emergency_contact: e.target.value })}
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button variant="primary" onClick={() => setCurrentStep(1)}>
                  Proceed to Triage Vitals →
                </Button>
              </div>
            </Card>
          )}

          {/* STEP 1: Clinical Triage Vitals */}
          {currentStep === 1 && (
            <Card variant="surface" className="p-6 space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#0A2540] dark:text-white pb-3 border-b border-[#F1F5F9] dark:border-[#1B456E]">
                Section 2: Clinical Triage Vitals & Live Biometrics
              </h3>

              {/* Dynamic Live Evaluation Banners */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <LiveAhaBpStageGauge
                  systolic={form.vitals.systolic_bp}
                  diastolic={form.vitals.diastolic_bp}
                />
                <LiveBmiCalculatorBadge
                  weightKg={form.vitals.weight_kg}
                  heightCm={form.vitals.height_cm}
                />
              </div>

              {/* Biometric Fields Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                <Input
                  label="Systolic BP (mmHg)"
                  type="number"
                  value={form.vitals.systolic_bp}
                  onChange={(e) => setForm({
                    ...form,
                    vitals: { ...form.vitals, systolic_bp: Number(e.target.value) },
                  })}
                />
                <Input
                  label="Diastolic BP (mmHg)"
                  type="number"
                  value={form.vitals.diastolic_bp}
                  onChange={(e) => setForm({
                    ...form,
                    vitals: { ...form.vitals, diastolic_bp: Number(e.target.value) },
                  })}
                />
                <Input
                  label="Pulse Rate (bpm)"
                  type="number"
                  value={form.vitals.pulse_rate}
                  onChange={(e) => setForm({
                    ...form,
                    vitals: { ...form.vitals, pulse_rate: Number(e.target.value) },
                  })}
                />
                <Input
                  label="SpO2 (%)"
                  type="number"
                  value={form.vitals.spo2_pct}
                  onChange={(e) => setForm({
                    ...form,
                    vitals: { ...form.vitals, spo2_pct: Number(e.target.value) },
                  })}
                />
                <Input
                  label="Weight (kg)"
                  type="number"
                  step="0.1"
                  value={form.vitals.weight_kg}
                  onChange={(e) => setForm({
                    ...form,
                    vitals: { ...form.vitals, weight_kg: Number(e.target.value) },
                  })}
                />
                <Input
                  label="Height (cm)"
                  type="number"
                  value={form.vitals.height_cm}
                  onChange={(e) => setForm({
                    ...form,
                    vitals: { ...form.vitals, height_cm: Number(e.target.value) },
                  })}
                />
                <Input
                  label="Body Temp (°F)"
                  type="number"
                  step="0.1"
                  value={form.vitals.temperature_f}
                  onChange={(e) => setForm({
                    ...form,
                    vitals: { ...form.vitals, temperature_f: Number(e.target.value) },
                  })}
                />
                <Input
                  label="Resp Rate (bpm)"
                  type="number"
                  value={form.vitals.resp_rate}
                  onChange={(e) => setForm({
                    ...form,
                    vitals: { ...form.vitals, resp_rate: Number(e.target.value) },
                  })}
                />
              </div>

              {/* Chief Complaint with Voice Assistant Toggle */}
              <div className="space-y-1.5 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#0A2540] dark:text-[#E2E8F0]">
                    Chief Complaint & Reason for Consultation
                  </label>
                  <button
                    type="button"
                    onClick={toggleVoiceDictation}
                    className={`inline-flex items-center gap-1.5 text-xs font-bold font-mono px-2.5 py-1 rounded-lg border transition-all ${
                      isListening
                        ? 'bg-[#DC2626] text-white border-[#DC2626] animate-pulse'
                        : 'bg-[#FFE500] text-[#051A30] border-[#EAB308]'
                    }`}
                  >
                    {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                    <span>{isListening ? 'Listening...' : 'Voice Dictate'}</span>
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={form.chief_complaint}
                  onChange={(e) => setForm({ ...form, chief_complaint: e.target.value })}
                  placeholder="Primary presenting symptom or walk-in consultation reason..."
                  className="w-full bg-white dark:bg-[#0A2540] text-sm rounded-xl border border-[#CBD5E1] dark:border-[#1B456E] p-3 focus:outline-none focus:ring-2 focus:ring-[#FFE500]"
                />
              </div>

              <div className="flex items-center justify-between pt-4">
                <Button variant="outline" onClick={() => setCurrentStep(0)}>
                  ← Back to Demographics
                </Button>
                <Button variant="primary" onClick={() => setCurrentStep(2)}>
                  Proceed to Doctor & Coverage →
                </Button>
              </div>
            </Card>
          )}

          {/* STEP 2: Doctor Assignment & Coverage */}
          {currentStep === 2 && (
            <Card variant="surface" className="p-6 space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#0A2540] dark:text-white pb-3 border-b border-[#F1F5F9] dark:border-[#1B456E]">
                Section 3: Doctor Assignment & Coverage Scheme
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Select
                  label="Assigned Physician / Room"
                  required
                  value={form.doctor_id}
                  onChange={(e) => setForm({ ...form, doctor_id: Number(e.target.value) })}
                  options={doctors.map((d) => ({
                    value: d.id,
                    label: `${d.name} (${d.department} • ${d.room || 'Cabin'})`,
                  }))}
                />

                <Select
                  label="Billing / Insurance Coverage Mode"
                  value={form.insurance_type}
                  onChange={(e) => setForm({ ...form, insurance_type: e.target.value })}
                  options={[
                    { value: 'CASH', label: 'Direct Cash / Self-Pay' },
                    { value: 'PM_JAY', label: 'PM-JAY Ayushman Bharat (100% Cashless Govt)' },
                    { value: 'STAR_HEALTH', label: 'Star Health Insurance TPA (80% Co-pay)' },
                    { value: 'HDFC_ERGO', label: 'HDFC ERGO General Insurance (85% Co-pay)' },
                  ]}
                />
              </div>

              {form.insurance_type !== 'CASH' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 p-4 rounded-xl bg-[#F6F7FA] dark:bg-[#0F355A] border border-[#CBD5E1] dark:border-[#1B456E]">
                  <Input
                    label="Insurance Provider / TPA Name"
                    value={form.insurance_provider}
                    onChange={(e) => setForm({ ...form, insurance_provider: e.target.value })}
                    placeholder="e.g. Star Health & Allied Insurance"
                  />
                  <Input
                    label="Policy / Card Pre-Auth Number"
                    value={form.policy_number}
                    onChange={(e) => setForm({ ...form, policy_number: e.target.value })}
                    placeholder="e.g. POL-8840192"
                  />
                </div>
              )}

              <div className="flex items-center justify-between pt-6 border-t border-[#E2E8F0] dark:border-[#1B456E]">
                <Button variant="outline" onClick={() => setCurrentStep(1)}>
                  ← Back to Vitals
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={loading}
                  icon={CheckCircle2}
                  className="font-bold text-sm px-6"
                >
                  Confirm Registration & Issue Token
                </Button>
              </div>
            </Card>
          )}
        </form>
      )}
    </div>
  );
}

export default PatientRegistrationPage;
