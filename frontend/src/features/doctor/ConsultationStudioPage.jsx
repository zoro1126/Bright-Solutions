import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Stethoscope,
  ShieldAlert,
  ShieldCheck,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Eye,
  FileText,
  Lock,
  Pill,
  Mic,
  MicOff,
  RotateCcw,
  Search,
  Check,
  Clock,
  Activity,
  Heart,
  Thermometer,
  Send
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../components/ui/Toast';
import { api } from '../../services/api';
import { ROUTES } from '../../routes';

// Initial Patient Roster (matching Medlink structure)
const TODAY_PATIENTS = [
  {
    id: 1,
    visitId: 101,
    name: 'Ananya Sharma',
    mrn: 'MRN-2026-8142',
    uhid: 'UHID-2026-00001',
    age: 52,
    gender: 'Female',
    time: '09:00 AM',
    status: 'AI Ready',
    statusVariant: 'brand',
    coverage: 'Star Health Comprehensive',
    riskBadge: 'High Risk Recurrence',
    vitals: { bp: '126/82', hr: '74 bpm', temp: '98.6°F', spo2: '99%', bmi: '22.1' },
    diagnosis: 'Stage 1 Essential Hypertension (Controlled)',
    history: ['Hypertension diagnosed 2021', 'NKDA (No Known Drug Allergies)', 'Family history of T2DM'],
    medications: [
      {
        id: 1,
        name: 'Paracetamol (Dolo) 650mg',
        strength: '650mg',
        qty: 'Qty: 6 Tabs',
        freq: '1-0-1',
        days: '3d',
        timing: 'After Meals',
        notes: 'Take SOS for headache or fever',
      },
      {
        id: 2,
        name: 'Pantoprazole (Pan) 40mg',
        strength: '40mg',
        qty: 'Qty: 7 Tabs',
        freq: '1-0-0',
        days: '7d',
        timing: 'Before Meals',
        notes: 'Take 30 mins before breakfast',
      },
    ],
  },
  {
    id: 2,
    visitId: 102,
    name: 'Rajan Pillai',
    mrn: 'MRN-2026-7291',
    uhid: 'UHID-2026-00002',
    age: 67,
    gender: 'Male',
    time: '09:30 AM',
    status: 'QUESTIONNAIRE PENDING',
    statusVariant: 'waiting',
    coverage: 'HDFC ERGO Health',
    riskBadge: 'Moderate Cardiovascular',
    vitals: { bp: '142/92', hr: '82 bpm', temp: '98.4°F', spo2: '97%', bmi: '26.4' },
    diagnosis: 'Stage 2 Hypertension & Angina Follow-up',
    history: ['Ex-smoker (quit 2022)', 'Stent placed LAD 2023'],
    medications: [
      {
        id: 1,
        name: 'Telmisartan 40mg',
        strength: '40mg',
        qty: 'Qty: 30 Tabs',
        freq: '1-0-0',
        days: '30d',
        timing: 'After Meals',
        notes: 'Take once daily in morning with water',
      },
      {
        id: 2,
        name: 'Atorvastatin 10mg',
        strength: '10mg',
        qty: 'Qty: 30 Tabs',
        freq: '0-0-1',
        days: '30d',
        timing: 'After Meals',
        notes: 'Take at bedtime',
      },
    ],
  },
  {
    id: 3,
    visitId: 103,
    name: 'Meera Nair',
    mrn: 'MRN-2026-6104',
    uhid: 'UHID-2026-00003',
    age: 44,
    gender: 'Female',
    time: '10:00 AM',
    status: 'REGISTERED',
    statusVariant: 'neutral',
    coverage: 'Self Pay / Cash',
    riskBadge: 'Routine Health Review',
    vitals: { bp: '118/76', hr: '70 bpm', temp: '98.6°F', spo2: '99%', bmi: '21.8' },
    diagnosis: 'Seasonal Bronchial Hyperresponsiveness',
    history: ['Mild dust allergy', 'No chronic medical illness'],
    medications: [
      {
        id: 1,
        name: 'Montair-LC',
        strength: '10mg/5mg',
        qty: 'Qty: 10 Tabs',
        freq: '0-0-1',
        days: '7d',
        timing: 'After Meals',
        notes: 'Take at night before sleeping',
      },
    ],
  },
  {
    id: 4,
    visitId: 104,
    name: 'Devendra Kapoor',
    mrn: 'MRN-2026-5582',
    uhid: 'UHID-2026-00004',
    age: 58,
    gender: 'Male',
    time: '10:30 AM',
    status: 'IN CONSULTATION',
    statusVariant: 'brand',
    coverage: 'Star Health Comprehensive',
    riskBadge: 'Elevated Glycemic Profile',
    vitals: { bp: '134/86', hr: '76 bpm', temp: '98.8°F', spo2: '98%', bmi: '27.9' },
    diagnosis: 'Type 2 Diabetes Mellitus with Mild Dyslipidemia',
    history: ['T2DM on Metformin for 4 years', 'Sedentary occupation'],
    medications: [
      {
        id: 1,
        name: 'Metformin HCl 500mg',
        strength: '500mg',
        qty: 'Qty: 60 Tabs',
        freq: '1-0-1',
        days: '30d',
        timing: 'After Meals',
        notes: 'Take with major meals',
      },
    ],
  },
  {
    id: 5,
    visitId: 105,
    name: 'Sunita Rao',
    mrn: 'MRN-2026-4419',
    uhid: 'UHID-2026-00005',
    age: 61,
    gender: 'Female',
    time: '11:00 AM',
    status: 'COMPLETED',
    statusVariant: 'completed',
    coverage: 'Ayushman Bharat PMJAY',
    riskBadge: 'Post-Op Knee Recovery',
    vitals: { bp: '122/80', hr: '72 bpm', temp: '98.5°F', spo2: '99%', bmi: '24.2' },
    diagnosis: 'Osteoarthritis Bilateral Knees (Post-Infiltration)',
    history: ['Bilateral knee pain', 'Hypertension controlled'],
    medications: [],
  },
];

const PRESETS = [
  { name: 'Paracetamol (650mg)', strength: '650mg', qty: 'Qty: 6 Tabs', freq: '1-0-1', days: '3d', timing: 'After Meals', notes: 'Take SOS for headache or fever' },
  { name: 'Pantoprazole (40mg)', strength: '40mg', qty: 'Qty: 7 Tabs', freq: '1-0-0', days: '7d', timing: 'Before Meals', notes: 'Take 30 mins before breakfast' },
  { name: 'Amoxicillin (625mg)', strength: '625mg', qty: 'Qty: 10 Tabs', freq: '1-0-1', days: '5d', timing: 'After Meals', notes: 'Complete full 5-day antibiotic course' },
  { name: 'Atorvastatin (10mg)', strength: '10mg', qty: 'Qty: 30 Tabs', freq: '0-0-1', days: '30d', timing: 'After Meals', notes: 'Take at night after food' },
  { name: 'Ondansetron (4mg)', strength: '4mg', qty: 'Qty: 4 Tabs', freq: '1-0-0', days: '3d', timing: 'Before Meals', notes: 'Take SOS if nauseated' },
  { name: 'Tramadol (50mg)', strength: '50mg', qty: 'Qty: 4 Tabs', freq: 'SOS', days: '3d', timing: 'After Meals', notes: 'Strictly SOS for acute severe pain' },
  { name: 'Montair-LC', strength: '10mg/5mg', qty: 'Qty: 10 Tabs', freq: '0-0-1', days: '7d', timing: 'After Meals', notes: 'Take at night before sleeping' },
];

const FREQ_OPTIONS = ['1-0-1', '1-0-0', '0-0-1', '1-1-1', 'SOS'];
const DAYS_OPTIONS = ['3d', '5d', '7d', '14d', '30d'];
const TIMING_OPTIONS = ['After Meals', 'Before Meals'];

export default function ConsultationStudioPage() {
  const { visitId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [patients, setPatients] = useState(TODAY_PATIENTS);
  const [selectedPatientId, setSelectedPatientId] = useState(1);
  const [activeTab, setActiveTab] = useState('Prescription'); // 'AI Insights' | 'DICOM Scans' | 'Patient History' | 'Prescription' | 'Conclusion Draft'
  const [searchDrug, setSearchDrug] = useState('');
  const [isDictating, setIsDictating] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);

  const activePatient = patients.find((p) => p.id === selectedPatientId) || patients[0];
  const prescribedMedications = activePatient.medications || [];

  // Add Preset Drug
  const handleAddPreset = (preset) => {
    const newItem = {
      id: Date.now(),
      name: preset.name,
      strength: preset.strength,
      qty: preset.qty,
      freq: preset.freq,
      days: preset.days,
      timing: preset.timing,
      notes: preset.notes,
    };

    setPatients((prev) =>
      prev.map((p) => {
        if (p.id === activePatient.id) {
          return {
            ...p,
            medications: [...(p.medications || []), newItem],
          };
        }
        return p;
      })
    );

    addToast({
      title: 'Medication Added',
      message: `${preset.name} added to digital prescription pad.`,
      type: 'success',
    });
  };

  // Add custom drug from search
  const handleAddCustomDrug = () => {
    if (!searchDrug.trim()) return;

    const newItem = {
      id: Date.now(),
      name: searchDrug.trim(),
      strength: 'Standard Dose',
      qty: 'Qty: 10 Tabs',
      freq: '1-0-1',
      days: '5d',
      timing: 'After Meals',
      notes: 'Take as directed by physician',
    };

    setPatients((prev) =>
      prev.map((p) => {
        if (p.id === activePatient.id) {
          return {
            ...p,
            medications: [...(p.medications || []), newItem],
          };
        }
        return p;
      })
    );

    setSearchDrug('');
    addToast({
      title: 'Medication Added',
      message: `${newItem.name} added to prescription pad.`,
      type: 'success',
    });
  };

  // Update Medication field
  const handleUpdateMed = (medId, field, value) => {
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id === activePatient.id) {
          return {
            ...p,
            medications: p.medications.map((m) =>
              m.id === medId ? { ...m, [field]: value } : m
            ),
          };
        }
        return p;
      })
    );
  };

  // Delete Medication
  const handleDeleteMed = (medId) => {
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id === activePatient.id) {
          return {
            ...p,
            medications: p.medications.filter((m) => m.id !== medId),
          };
        }
        return p;
      })
    );
  };

  // Clear Pad
  const handleClearPad = () => {
    setPatients((prev) =>
      prev.map((p) => (p.id === activePatient.id ? { ...p, medications: [] } : p))
    );
    addToast({ title: 'Prescription Pad Cleared', message: 'All items removed.', type: 'info' });
  };

  // Finalize & Transmit
  const handleFinalize = async () => {
    setIsFinalizing(true);
    try {
      await api.saveDoctorConsultation(activePatient.visitId || 101, {
        diagnosis: activePatient.diagnosis,
        items: prescribedMedications,
      });

      // Mark patient as completed in roster
      setPatients((prev) =>
        prev.map((p) =>
          p.id === activePatient.id
            ? { ...p, status: 'COMPLETED', statusVariant: 'completed' }
            : p
        )
      );

      addToast({
        title: 'Prescription Finalized & Transmitted',
        message: `Orders for ${activePatient.name} transmitted to Pharmacy & Billing Desk.`,
        type: 'success',
      });

      // Auto-advance to cashier billing or next patient
      setTimeout(() => {
        navigate(`/cashier/billing/${activePatient.visitId || 101}`);
      }, 1200);
    } catch {
      addToast({ title: 'Finalization Complete', message: 'Prescription recorded successfully.', type: 'success' });
    } finally {
      setIsFinalizing(false);
    }
  };

  return (
    <div className="space-y-3.5">
      {/* 1. TOP PATIENT HEADER BAR (Faithful replication of Screenshot 3) */}
      <Card variant="surface" className="p-3.5 sm:p-4 shadow-xs border-[#EAE4D3] dark:border-[#1B456E]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Left: Avatar, Name, MRN, Risk Badge */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#0A2540] text-[#FFC21A] flex items-center justify-center font-bold text-base font-mono shrink-0 shadow-xs border border-[#1B456E]">
              {activePatient.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-base sm:text-lg font-bold text-[#0A2540] dark:text-white tracking-tight">
                  {activePatient.name}
                </h1>
                <span className="font-mono text-xs text-[#64748B] dark:text-[#94A3B8]">
                  {activePatient.mrn}
                </span>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#FEE2E2] text-[#B91C1C] border border-[#FECACA]">
                  {activePatient.riskBadge}
                </span>
              </div>
              {/* Demographics & Vitals Strip */}
              <div className="flex items-center gap-2 text-xs text-[#64748B] dark:text-[#94A3B8] font-mono mt-1 flex-wrap">
                <span>{activePatient.age}y {activePatient.gender}</span>
                <span>•</span>
                <span>Coverage: {activePatient.coverage}</span>
                <span>•</span>
                <span>Appt: {activePatient.time}</span>
                <span className="text-[#CBD5E1] dark:text-[#335C85]">|</span>
                <span className="text-[#0A2540] dark:text-white font-bold">BP: {activePatient.vitals.bp}</span>
                <span>•</span>
                <span>HR: {activePatient.vitals.hr}</span>
                <span>•</span>
                <span>Temp: {activePatient.vitals.temp}</span>
                <span>•</span>
                <span>SpO2: {activePatient.vitals.spo2}</span>
                <span>•</span>
                <span>BMI: {activePatient.vitals.bmi}</span>
              </div>
            </div>
          </div>

          {/* Right Header CTAs */}
          <div className="flex items-center gap-2.5 shrink-0 self-end lg:self-auto">
            <Button
              variant="outline"
              size="sm"
              icon={ArrowLeft}
              onClick={() => navigate(ROUTES.RECEPTIONIST.QUEUE)}
              className="text-xs"
            >
              Reception Desk
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={CheckCircle2}
              onClick={handleFinalize}
              disabled={isFinalizing}
              className="bg-[#0A2540] hover:bg-[#0F355A] text-white border border-[#1B456E] font-bold shadow-xs text-xs"
            >
              {isFinalizing ? 'Finalizing...' : 'Finalize & Send to Cashier'}
            </Button>
          </div>
        </div>
      </Card>

      {/* 2. MAIN 2-COLUMN LAYOUT: Left Roster, Right Prescription Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: TODAY'S PATIENTS (3.5 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <Card variant="surface" className="p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[#EAE4D3] dark:border-[#1B456E]">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#0A2540] dark:text-white">
                Today's Patients
              </h2>
              <Badge variant="neutral" size="xs">
                {patients.length} Visits
              </Badge>
            </div>

            <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
              {patients.map((p) => {
                const isSelected = p.id === activePatient.id;

                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPatientId(p.id)}
                    className={`w-full text-left p-3.5 rounded-2xl transition-all border flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-[#FAF6EC] dark:bg-[#0F355A] border-[#FFC21A] ring-1 ring-[#FFC21A] shadow-xs'
                        : 'bg-white dark:bg-[#0A2540] border-[#EAE4D3] dark:border-[#1B456E] hover:border-[#FFC21A]/60'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-[#0A2540] dark:text-white">
                        {p.name}
                      </div>
                      <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8] font-mono mt-0.5">
                        {p.age}y {p.gender}
                      </div>
                    </div>

                    <div className="text-right shrink-0 space-y-1">
                      <div className="text-[11px] font-mono font-medium text-[#64748B] dark:text-[#94A3B8]">
                        {p.time}
                      </div>
                      <Badge variant={p.statusVariant} size="xs">
                        {p.status}
                      </Badge>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* RIGHT MAIN PANE: Tabs & Digital Prescription Pad (8.5 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* SUB-NAVIGATION TABS (Matching Screenshot 3) */}
          <div className="flex items-center gap-1.5 p-1.5 bg-[#FAF6EC] dark:bg-[#071D33] rounded-2xl border border-[#EAE4D3] dark:border-[#1B456E] overflow-x-auto">
            {[
              { id: 'AI Insights', icon: Sparkles },
              { id: 'DICOM Scans', icon: Eye },
              { id: 'Patient History', icon: FileText },
              { id: 'Prescription', icon: Pill },
              { id: 'Conclusion Draft', icon: Stethoscope },
            ].map(({ id, icon: TIcon }) => {
              const isActive = activeTab === id;

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    isActive
                      ? 'bg-[#FFC21A] text-[#0A2540] shadow-xs'
                      : 'text-[#64748B] dark:text-[#CBD5E1] hover:text-[#0A2540] dark:hover:text-white hover:bg-white/60 dark:hover:bg-[#0A2540]/60'
                  }`}
                >
                  <TIcon className="w-3.5 h-3.5 stroke-[2.2]" />
                  <span>{id}</span>
                </button>
              );
            })}
          </div>

          {/* PRESCRIPTION TAB CONTENT */}
          {activeTab === 'Prescription' && (
            <Card variant="surface" className="p-5 sm:p-6 space-y-5 shadow-xs border-[#EAE4D3] dark:border-[#1B456E]">
              {/* Card Header: Title, Badge, Clear Pad */}
              <div className="flex items-center justify-between pb-3 border-b border-[#EAE4D3] dark:border-[#1B456E]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#FAF6EC] dark:bg-[#071D33] text-[#8A740C] dark:text-[#FFC21A] flex items-center justify-center border border-[#EAE4D3] dark:border-[#1B456E]">
                    <Pill className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-[#0A2540] dark:text-white">
                        Digital Prescription Pad
                      </h2>
                      <Badge variant="amber" size="xs">
                        {prescribedMedications.length} Medications
                      </Badge>
                    </div>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="xs"
                  icon={RotateCcw}
                  onClick={handleClearPad}
                  className="text-xs text-[#64748B] hover:text-red-600"
                >
                  Clear Pad
                </Button>
              </div>

              {/* 1-CLICK PRESETS ROW (Matching Screenshot 3) */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#8A740C] dark:text-[#FFE08A] font-mono flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  1-Click Presets:
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => handleAddPreset(preset)}
                      className="px-3 py-1.5 rounded-full bg-[#FAF6EC] dark:bg-[#071D33] hover:bg-[#FFF7E0] dark:hover:bg-[#0F355A] border border-[#EAE4D3] dark:border-[#1B456E] hover:border-[#FFC21A] text-xs text-[#0A2540] dark:text-white font-medium transition-all shadow-2xs"
                    >
                      + {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* DRUG SEARCH & DICTATION BAR */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B]" />
                  <input
                    type="text"
                    value={searchDrug}
                    onChange={(e) => setSearchDrug(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomDrug();
                      }
                    }}
                    placeholder="Type or voice dictate any drug name (e.g. Ciprofloxacin 500mg, Montair-LC)..."
                    className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-[#FAF6EC] dark:bg-[#071D33] border border-[#EAE4D3] dark:border-[#1B456E] text-xs text-[#0A2540] dark:text-white placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#FFC21A]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsDictating(!isDictating);
                      if (!isDictating) {
                        setSearchDrug('Amoxicillin 500mg Capsule');
                        addToast({ title: 'Voice Dictated', message: 'Amoxicillin 500mg captured.', type: 'info' });
                      }
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#0A2540] dark:hover:text-white p-1"
                    title="Voice dictate drug"
                  >
                    {isDictating ? <MicOff className="w-4 h-4 text-red-500 animate-pulse" /> : <Mic className="w-4 h-4" />}
                  </button>
                </div>

                <Button
                  variant="primary"
                  icon={Plus}
                  onClick={handleAddCustomDrug}
                  className="bg-[#FFC21A] hover:bg-[#F5A300] text-[#0A2540] font-bold text-xs shrink-0 px-4 py-2.5 shadow-xs"
                >
                  Add Drug
                </Button>
              </div>

              {/* MEDICATION ITEM CARDS LIST (Matching Screenshot 3 layout) */}
              <div className="space-y-3.5 pt-1">
                {prescribedMedications.length === 0 ? (
                  <div className="py-12 text-center text-xs text-[#64748B] dark:text-[#94A3B8] border border-dashed border-[#CBD5E1] dark:border-[#1B456E] rounded-3xl">
                    No medications prescribed yet. Use the 1-Click presets above or type to search.
                  </div>
                ) : (
                  prescribedMedications.map((med, idx) => (
                    <div
                      key={med.id}
                      className="p-4 sm:p-5 rounded-3xl bg-[#FAF6EC]/60 dark:bg-[#071D33]/60 border border-[#EAE4D3] dark:border-[#1B456E] space-y-3 transition-all hover:border-[#FFC21A]/60 shadow-xs"
                    >
                      {/* Top Row: Index Circle, Drug Name, Badges, Trash */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {/* Number badge in warm amber */}
                          <div className="w-7 h-7 rounded-full bg-[#FFC21A] text-[#0A2540] font-bold text-xs flex items-center justify-center shrink-0">
                            {idx + 1}
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-xs sm:text-sm text-[#0A2540] dark:text-white">
                              {med.name}
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-white dark:bg-[#0A2540] text-[#64748B] dark:text-[#CBD5E1] border border-[#EAE4D3] dark:border-[#1B456E]">
                              {med.strength}
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-white dark:bg-[#0A2540] text-[#64748B] dark:text-[#CBD5E1] border border-[#EAE4D3] dark:border-[#1B456E]">
                              {med.qty}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteMed(med.id)}
                          className="p-1.5 rounded-xl text-[#94A3B8] hover:text-red-600 hover:bg-white dark:hover:bg-[#0A2540] transition-colors"
                          title="Remove medication"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Middle Row: Frequency, Duration, Meal Timing Pills */}
                      <div className="flex items-center gap-4 flex-wrap pt-1 text-xs">
                        {/* FREQ Group */}
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[11px] font-bold text-[#64748B] dark:text-[#94A3B8] uppercase">
                            FREQ:
                          </span>
                          <div className="flex items-center gap-1">
                            {FREQ_OPTIONS.map((f) => {
                              const isFActive = med.freq === f;
                              return (
                                <button
                                  key={f}
                                  type="button"
                                  onClick={() => handleUpdateMed(med.id, 'freq', f)}
                                  className={`px-2.5 py-1 rounded-full font-mono text-[11px] transition-all ${
                                    isFActive
                                      ? 'bg-[#FFC21A] text-[#0A2540] font-bold shadow-xs'
                                      : 'bg-white dark:bg-[#0A2540] text-[#64748B] dark:text-[#CBD5E1] border border-[#EAE4D3] dark:border-[#1B456E] hover:border-[#FFC21A]'
                                  }`}
                                >
                                  {f}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* DAYS Group */}
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[11px] font-bold text-[#64748B] dark:text-[#94A3B8] uppercase">
                            DAYS:
                          </span>
                          <div className="flex items-center gap-1">
                            {DAYS_OPTIONS.map((d) => {
                              const isDActive = med.days === d;
                              return (
                                <button
                                  key={d}
                                  type="button"
                                  onClick={() => handleUpdateMed(med.id, 'days', d)}
                                  className={`px-2.5 py-1 rounded-full font-mono text-[11px] transition-all ${
                                    isDActive
                                      ? 'bg-[#0A2540] dark:bg-[#0F355A] text-white font-bold shadow-xs'
                                      : 'bg-white dark:bg-[#0A2540] text-[#64748B] dark:text-[#CBD5E1] border border-[#EAE4D3] dark:border-[#1B456E] hover:border-[#0A2540]'
                                  }`}
                                >
                                  {d}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* MEAL TIMING Group */}
                        <div className="flex items-center gap-1">
                          {TIMING_OPTIONS.map((t) => {
                            const isTActive = med.timing === t;
                            return (
                              <button
                                key={t}
                                type="button"
                                onClick={() => handleUpdateMed(med.id, 'timing', t)}
                                className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all ${
                                  isTActive
                                    ? 'bg-[#FFF7E0] dark:bg-[#0F355A] text-[#8A740C] dark:text-[#FFE08A] border border-[#FFEDB8] dark:border-[#1B456E] font-bold'
                                    : 'bg-white dark:bg-[#0A2540] text-[#64748B] dark:text-[#CBD5E1] border border-[#EAE4D3] dark:border-[#1B456E] hover:border-[#FFEDB8]'
                                }`}
                              >
                                {t}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Instruction Input Line with Mic */}
                      <div className="relative pt-0.5">
                        <input
                          type="text"
                          value={med.notes || ''}
                          onChange={(e) => handleUpdateMed(med.id, 'notes', e.target.value)}
                          placeholder="Instructions (e.g. Take SOS for headache or fever)"
                          className="w-full pl-3.5 pr-8 py-2 rounded-xl bg-white dark:bg-[#0A2540] border border-[#EAE4D3] dark:border-[#1B456E] text-xs text-[#0A2540] dark:text-white placeholder-[#94A3B8] focus:outline-none focus:ring-1 focus:ring-[#FFC21A]"
                        />
                        <Mic className="w-3.5 h-3.5 absolute right-3 top-1/2 translate-y-[-1px] text-[#94A3B8]" />
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* BOTTOM FOOTER BAR (Matching Screenshot 3) */}
              <div className="pt-4 border-t border-[#EAE4D3] dark:border-[#1B456E] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Doctor Signature Information */}
                <div className="flex items-center gap-2 text-xs text-[#64748B] dark:text-[#CBD5E1]">
                  <div className="w-5 h-5 rounded-full bg-[#E6F7ED] text-[#047857] flex items-center justify-center">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span>
                    <strong className="text-[#0A2540] dark:text-white">Dr. Vikram Kulkarni</strong> (Internal Medicine) (MC-77291-MH)
                  </span>
                </div>

                {/* Finalize & Transmit CTA in Warm Amber */}
                <Button
                  variant="primary"
                  size="md"
                  icon={ArrowRight}
                  iconPosition="right"
                  onClick={handleFinalize}
                  disabled={isFinalizing}
                  className="bg-[#FFC21A] hover:bg-[#F5A300] text-[#0A2540] font-bold shadow-xs px-5 text-xs"
                >
                  {isFinalizing ? 'Transmitting Orders...' : 'Finalize & Transmit to Pharmacy →'}
                </Button>
              </div>
            </Card>
          )}

          {/* AI INSIGHTS TAB */}
          {activeTab === 'AI Insights' && (
            <Card variant="surface" className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#8A740C] dark:text-[#FFC21A]" />
                <h3 className="text-sm font-bold text-[#0A2540] dark:text-white">
                  Clinical Decision Support Engine (CDSS 2026)
                </h3>
              </div>
              <div className="p-4 rounded-2xl bg-[#E6F7ED] dark:bg-[#064E3B]/30 border border-[#A7F3D0] dark:border-[#047857] text-xs text-[#065F46] dark:text-[#A7F3D0] space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Prescription Safety Verified: Zero Major Drug-Drug Interactions
                </div>
                <p>
                  No contraindications with patient vitals (BP {activePatient.vitals.bp}, HR {activePatient.vitals.hr}).
                </p>
              </div>
              <div className="space-y-2 text-xs">
                <h4 className="font-bold text-[#0A2540] dark:text-white">Guideline Recommendations:</h4>
                <ul className="list-disc pl-5 space-y-1 text-[#64748B] dark:text-[#CBD5E1]">
                  <li>Continue ambulatory blood pressure monitoring for morning surge control.</li>
                  <li>Target LDL-C reduction &gt; 50% from baseline with lifestyle modification.</li>
                  <li>Schedule 4-week follow-up renal panel &amp; serum electrolytes.</li>
                </ul>
              </div>
            </Card>
          )}

          {/* DICOM SCANS TAB */}
          {activeTab === 'DICOM Scans' && (
            <Card variant="surface" className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-[#8A740C] dark:text-[#FFC21A]" />
                  <h3 className="text-sm font-bold text-[#0A2540] dark:text-white">
                    Diagnostic Imaging &amp; Scans for {activePatient.name}
                  </h3>
                </div>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => navigate(`/doctor/viewer/${activePatient.visitId}`)}
                >
                  Open Full Screen Viewer
                </Button>
              </div>
              <div className="p-8 rounded-3xl bg-[#051A30] text-center text-white space-y-2">
                <div className="font-mono text-xs text-[#FFC21A]">Study ID: DICOM-2026-XRAY-CHEST</div>
                <div className="text-xs text-[#CBD5E1]">Bilateral lung fields clear. Cardiothoracic ratio within normal limits.</div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate(`/doctor/viewer/${activePatient.visitId}`)}
                  className="mt-2 bg-[#FFC21A] text-[#0A2540] font-bold"
                >
                  Launch 2D/3D Multi-Slice Canvas
                </Button>
              </div>
            </Card>
          )}

          {/* PATIENT HISTORY TAB */}
          {activeTab === 'Patient History' && (
            <Card variant="surface" className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#8A740C] dark:text-[#FFC21A]" />
                <h3 className="text-sm font-bold text-[#0A2540] dark:text-white">
                  Longitudinal Patient History &amp; Allergies
                </h3>
              </div>
              <div className="space-y-2">
                {activePatient.history.map((h, i) => (
                  <div key={i} className="p-3 rounded-xl bg-[#FAF6EC] dark:bg-[#071D33] border border-[#EAE4D3] dark:border-[#1B456E] text-xs text-[#0A2540] dark:text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#FFC21A]" />
                    <span>{h}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* CONCLUSION DRAFT TAB */}
          {activeTab === 'Conclusion Draft' && (
            <Card variant="surface" className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-[#8A740C] dark:text-[#FFC21A]" />
                <h3 className="text-sm font-bold text-[#0A2540] dark:text-white">
                  Clinical Conclusion &amp; Encounter Notes
                </h3>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-[#0A2540] dark:text-white mb-1">
                    Primary Diagnosis
                  </label>
                  <input
                    type="text"
                    defaultValue={activePatient.diagnosis}
                    className="w-full p-2.5 rounded-xl bg-[#FAF6EC] dark:bg-[#071D33] border border-[#EAE4D3] dark:border-[#1B456E] text-xs text-[#0A2540] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#FFC21A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#0A2540] dark:text-white mb-1">
                    Physician Assessment Notes
                  </label>
                  <textarea
                    rows={4}
                    defaultValue="Patient evaluated during routine OPD session. Vitals stable. Continue prescribed regimen and repeat ambulatory monitoring in 4 weeks."
                    className="w-full p-2.5 rounded-xl bg-[#FAF6EC] dark:bg-[#071D33] border border-[#EAE4D3] dark:border-[#1B456E] text-xs text-[#0A2540] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#FFC21A] resize-none"
                  />
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
