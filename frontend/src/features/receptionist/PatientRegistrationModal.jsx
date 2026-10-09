import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserPlus,
  Activity,
  Heart,
  Scale,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Printer,
  Sparkles,
  ClipboardList,
  UploadCloud,
  X
} from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../components/ui/Toast';
import { api } from '../../services/api';
import { ROUTES } from '../../routes';

// Live AHA Blood Pressure 2017 Stage Evaluator
function LiveAhaBpStageGauge({ systolic, diastolic }) {
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
    <div className={`p-3.5 rounded-2xl border transition-all ${
      isCrisis
        ? 'bg-[#450A0A] border-[#DC2626] text-white ring-2 ring-[#DC2626]/30'
        : 'bg-[#FAF6EC] dark:bg-[#071D33] border-[#EAE4D3] dark:border-[#1B456E]'
    }`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-bold uppercase font-mono tracking-wider text-[#8A740C] dark:text-[#FFE08A]">
          AHA 2017 BP Classification
        </span>
        <Badge variant={variant} pulsing={isCrisis}>
          {stage}
        </Badge>
      </div>
      <div className="flex items-baseline gap-2 font-mono">
        <span className="text-xl font-bold text-[#0A2540] dark:text-white">
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
function LiveBmiCalculatorBadge({ weightKg, heightCm }) {
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
    <div className="p-3.5 rounded-2xl bg-[#FAF6EC] dark:bg-[#071D33] border border-[#EAE4D3] dark:border-[#1B456E] flex items-center justify-between">
      <div>
        <span className="text-[11px] font-bold uppercase font-mono tracking-wider text-[#8A740C] dark:text-[#FFE08A] block">
          Calculated BMI
        </span>
        <div className="flex items-baseline gap-2 font-mono mt-0.5">
          <span className="text-xl font-bold text-[#0A2540] dark:text-white">{bmi || '--'}</span>
          <span className="text-xs text-[#64748B] dark:text-[#CBD5E1]">kg/m²</span>
        </div>
      </div>
      <Badge variant={variant} size="sm">
        {category}
      </Badge>
    </div>
  );
}

export function PatientRegistrationModal({ isOpen, onClose, onSuccess }) {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [step, setStep] = useState(1); // 1: Demographics, 2: Vitals & Doctor, 3: Success Confirmation
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    age: '',
    gender: 'MALE',
    phone: '',
    chief_complaint: '',
    insurance_provider: 'Self Pay / Direct Cash',
    systolic_bp: '120',
    diastolic_bp: '80',
    pulse_rate: '72',
    spo2_pct: '99',
    temperature_f: '98.6',
    height_cm: '170',
    weight_kg: '68',
    doctor_id: '2',
    priority: 'NORMAL',
  });

  const [registeredResult, setRegisteredResult] = useState(null);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = (e) => {
    e?.preventDefault();
    if (step === 1) {
      if (!formData.full_name || !formData.age || !formData.phone) {
        addToast({
          title: 'Missing Required Fields',
          message: 'Please provide patient name, age, and phone number.',
          type: 'warning',
        });
        return;
      }
      setStep(2);
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        age: Number(formData.age),
        systolic_bp: Number(formData.systolic_bp),
        diastolic_bp: Number(formData.diastolic_bp),
        pulse_rate: Number(formData.pulse_rate),
        spo2_pct: Number(formData.spo2_pct),
        temperature_f: Number(formData.temperature_f),
        height_cm: Number(formData.height_cm),
        weight_kg: Number(formData.weight_kg),
        doctor_id: Number(formData.doctor_id),
      };

      const res = await api.registerPatient(payload);
      const token = res?.queue_token || 'Q-104';
      const uhid = res?.uhid || `UHID-2026-0000${Math.floor(Math.random() * 90) + 10}`;

      const finalPatient = {
        ...formData,
        patient_id: res?.patient_id || Date.now(),
        visit_id: res?.visit_id || 104,
        queue_token: token,
        token: token,
        uhid: uhid,
        created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setRegisteredResult(finalPatient);
      setStep(3);

      addToast({
        title: 'Walk-In Registered Successfully',
        message: `Token #${token} issued for ${formData.full_name}.`,
        type: 'success',
      });

      if (onSuccess) {
        onSuccess(finalPatient);
      }
    } catch (err) {
      addToast({
        title: 'Registration Error',
        message: err.message || 'Failed to register walk-in patient.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setStep(1);
    setRegisteredResult(null);
    setFormData({
      full_name: '',
      age: '',
      gender: 'MALE',
      phone: '',
      chief_complaint: '',
      insurance_provider: 'Self Pay / Direct Cash',
      systolic_bp: '120',
      diastolic_bp: '80',
      pulse_rate: '72',
      spo2_pct: '99',
      temperature_f: '98.6',
      height_cm: '170',
      weight_kg: '68',
      doctor_id: '2',
      priority: 'NORMAL',
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={resetModal}
      maxWidth="max-w-2xl"
      title={
        step === 3
          ? 'Walk-In Token Generated'
          : `Walk-In Patient Registration • Step ${step} of 2`
      }
      subtitle={
        step === 3
          ? 'Patient successfully triaged into outpatient queue'
          : step === 1
          ? 'Step 1: Patient Demographics & Contact Information'
          : 'Step 2: Baseline Biometrics, Vitals & Cabin Assignment'
      }
    >
      {step === 1 && (
        <form onSubmit={handleNext} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#0A2540] dark:text-white mb-1.5">
                Full Legal Name <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="e.g. Ramesh Patel, Sunita Rao"
                value={formData.full_name}
                onChange={(e) => handleChange('full_name', e.target.value)}
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0A2540] dark:text-white mb-1.5">
                Age (Years) <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                placeholder="e.g. 52"
                min="1"
                max="120"
                value={formData.age}
                onChange={(e) => handleChange('age', e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0A2540] dark:text-white mb-1.5">
                Biological Sex
              </label>
              <Select
                value={formData.gender}
                onChange={(e) => handleChange('gender', e.target.value)}
                options={[
                  { value: 'MALE', label: 'Male' },
                  { value: 'FEMALE', label: 'Female' },
                  { value: 'OTHER', label: 'Other / Non-Binary' },
                ]}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0A2540] dark:text-white mb-1.5">
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <Input
                type="tel"
                placeholder="10-digit mobile number"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0A2540] dark:text-white mb-1.5">
                Insurance / TPA Coverage
              </label>
              <Select
                value={formData.insurance_provider}
                onChange={(e) => handleChange('insurance_provider', e.target.value)}
                options={[
                  { value: 'Self Pay / Direct Cash', label: 'Self Pay / Cash' },
                  { value: 'Star Health Comprehensive', label: 'Star Health Insurance' },
                  { value: 'HDFC ERGO Optima', label: 'HDFC ERGO Health' },
                  { value: 'Ayushman Bharat PMJAY', label: 'PM-JAY Government Scheme' },
                  { value: 'Corporate TPA Corporate', label: 'Corporate Empanelled TPA' },
                ]}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#0A2540] dark:text-white mb-1.5">
                Chief Complaint / Presenting Symptoms
              </label>
              <Input
                placeholder="e.g. Morning headache, hypertension follow-up, mild cough"
                value={formData.chief_complaint}
                onChange={(e) => handleChange('chief_complaint', e.target.value)}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-[#EAE4D3] dark:border-[#1B456E] flex items-center justify-between">
            <Button variant="ghost" type="button" onClick={resetModal}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              icon={ArrowRight}
              iconPosition="right"
              className="bg-[#FFC21A] hover:bg-[#F5A300] text-[#0A2540] font-bold"
            >
              Continue to Vitals & Triage
            </Button>
          </div>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Live Clinical Gauges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <LiveAhaBpStageGauge
              systolic={formData.systolic_bp}
              diastolic={formData.diastolic_bp}
            />
            <LiveBmiCalculatorBadge
              weightKg={formData.weight_kg}
              heightCm={formData.height_cm}
            />
          </div>

          {/* Vitals Inputs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-[#0A2540] dark:text-white mb-1">
                Systolic BP (mmHg)
              </label>
              <Input
                type="number"
                placeholder="120"
                value={formData.systolic_bp}
                onChange={(e) => handleChange('systolic_bp', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#0A2540] dark:text-white mb-1">
                Diastolic BP (mmHg)
              </label>
              <Input
                type="number"
                placeholder="80"
                value={formData.diastolic_bp}
                onChange={(e) => handleChange('diastolic_bp', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#0A2540] dark:text-white mb-1">
                Pulse (bpm)
              </label>
              <Input
                type="number"
                placeholder="72"
                value={formData.pulse_rate}
                onChange={(e) => handleChange('pulse_rate', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#0A2540] dark:text-white mb-1">
                SpO2 (%)
              </label>
              <Input
                type="number"
                placeholder="99"
                value={formData.spo2_pct}
                onChange={(e) => handleChange('spo2_pct', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#0A2540] dark:text-white mb-1">
                Temp (°F)
              </label>
              <Input
                type="number"
                step="0.1"
                placeholder="98.6"
                value={formData.temperature_f}
                onChange={(e) => handleChange('temperature_f', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#0A2540] dark:text-white mb-1">
                Height (cm)
              </label>
              <Input
                type="number"
                placeholder="170"
                value={formData.height_cm}
                onChange={(e) => handleChange('height_cm', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#0A2540] dark:text-white mb-1">
                Weight (kg)
              </label>
              <Input
                type="number"
                placeholder="68"
                value={formData.weight_kg}
                onChange={(e) => handleChange('weight_kg', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#0A2540] dark:text-white mb-1">
                Triage Priority
              </label>
              <Select
                value={formData.priority}
                onChange={(e) => handleChange('priority', e.target.value)}
                options={[
                  { value: 'NORMAL', label: 'Routine (Standard)' },
                  { value: 'PRIORITY', label: 'Priority Walk-In' },
                  { value: 'STAT', label: 'STAT Immediate' },
                ]}
              />
            </div>
          </div>

          {/* Assigned Doctor & Cabin */}
          <div className="pt-2">
            <label className="block text-xs font-bold text-[#0A2540] dark:text-white mb-1.5">
              Assigned Physician & Consultation Cabin
            </label>
            <Select
              value={formData.doctor_id}
              onChange={(e) => handleChange('doctor_id', e.target.value)}
              options={[
                { value: '2', label: 'Dr. Vikram Kulkarni, MD — Cabin 01 (Internal Medicine)' },
                { value: '3', label: 'Dr. Ananya Roy, MBBS, DNB — Cabin 02 (Cardiology)' },
                { value: '4', label: 'Dr. Priya Nair, MD — Cabin 03 (Pulmonology)' },
              ]}
            />
          </div>

          <div className="pt-4 border-t border-[#EAE4D3] dark:border-[#1B456E] flex items-center justify-between">
            <Button variant="ghost" type="button" onClick={() => setStep(1)}>
              ← Back to Details
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={loading}
              className="bg-[#FFC21A] hover:bg-[#F5A300] text-[#0A2540] font-bold shadow-sm"
            >
              {loading ? 'Registering...' : 'Complete Registration & Issue Token'}
            </Button>
          </div>
        </form>
      )}

      {step === 3 && registeredResult && (
        <div className="space-y-5 text-center py-2">
          {/* Token Hero Block */}
          <div className="p-6 rounded-3xl bg-[#FAF6EC] dark:bg-[#071D33] border border-[#FFEDB8] dark:border-[#1B456E] inline-flex flex-col items-center justify-center w-full">
            <span className="text-[11px] font-bold font-mono tracking-wider uppercase text-[#8A740C] dark:text-[#FFE08A] mb-1">
              Live Walk-In Queue Token
            </span>
            <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-[#0A2540] text-[#FFC21A] font-mono text-3xl font-black shadow-md">
              #{registeredResult.token}
            </div>
            <div className="mt-3 text-sm font-bold text-[#0A2540] dark:text-white">
              {registeredResult.full_name} ({registeredResult.age}y / {registeredResult.gender?.[0]})
            </div>
            <div className="text-xs font-mono text-[#64748B] dark:text-[#94A3B8] mt-0.5">
              {registeredResult.uhid} • Cabin 01 (Dr. Vikram Kulkarni)
            </div>
          </div>

          {/* Action Pathways */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            <button
              type="button"
              onClick={() => {
                resetModal();
                navigate(`${ROUTES.RECEPTIONIST.QUESTIONNAIRE}?token=${registeredResult.token}`);
              }}
              className="p-4 rounded-2xl bg-white dark:bg-[#0A2540] border border-[#EAE4D3] dark:border-[#1B456E] hover:border-[#FFC21A] transition-all flex items-start gap-3 group text-left"
            >
              <div className="w-9 h-9 rounded-xl bg-[#FFC21A] text-[#0A2540] flex items-center justify-center shrink-0">
                <ClipboardList className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#0A2540] dark:text-white group-hover:text-[#8A740C] transition-colors">
                  Start Intake Questionnaire →
                </div>
                <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                  Screen symptom severity and clinical questions.
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                resetModal();
                navigate(`${ROUTES.RECEPTIONIST.REPORTS}?token=${registeredResult.token}`);
              }}
              className="p-4 rounded-2xl bg-white dark:bg-[#0A2540] border border-[#EAE4D3] dark:border-[#1B456E] hover:border-[#FFC21A] transition-all flex items-start gap-3 group text-left"
            >
              <div className="w-9 h-9 rounded-xl bg-[#0A2540] text-[#FFC21A] flex items-center justify-center shrink-0">
                <UploadCloud className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#0A2540] dark:text-white group-hover:text-[#8A740C] transition-colors">
                  Upload Diagnostic Reports →
                </div>
                <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                  Attach DICOM scans, ECG strips, or lab tests.
                </div>
              </div>
            </button>
          </div>

          {/* Bottom Dialog Footer */}
          <div className="pt-3 border-t border-[#EAE4D3] dark:border-[#1B456E] flex items-center justify-between">
            <Button
              variant="outline"
              icon={Printer}
              onClick={() => window.print()}
            >
              Print Token Slip
            </Button>
            <Button
              variant="primary"
              className="bg-[#FFC21A] hover:bg-[#F5A300] text-[#0A2540] font-bold"
              onClick={resetModal}
            >
              Done & Return to Desk
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

export default PatientRegistrationModal;
