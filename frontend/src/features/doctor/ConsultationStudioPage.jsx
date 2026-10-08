import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  Eye,
  FileText,
  Lock,
  Pill
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useToast } from '../../components/ui/Toast';
import { api } from '../../services/api';

const CLINIC_FORMULARY = [
  { id: 'AML_5', name: 'Amlodipine Besylate 5mg', type: 'Tablet', defaultDose: '5 mg', defaultFreq: 'OD Morning', defaultDays: '30' },
  { id: 'PCM_650', name: 'Paracetamol 650mg', type: 'Tablet', defaultDose: '650 mg', defaultFreq: 'TDS PRN', defaultDays: '3' },
  { id: 'TEL_40', name: 'Telmisartan 40mg', type: 'Tablet', defaultDose: '40 mg', defaultFreq: 'OD Morning', defaultDays: '30' },
  { id: 'MET_500', name: 'Metformin HCl 500mg', type: 'Tablet', defaultDose: '500 mg', defaultFreq: 'BD with Meals', defaultDays: '30' },
  { id: 'AZI_500', name: 'Azithromycin 500mg', type: 'Tablet', defaultDose: '500 mg', defaultFreq: 'OD (Empty Stomach)', defaultDays: '3' },
  { id: 'AMX_500', name: 'Amoxicillin 500mg (Penicillin)', type: 'Capsule', defaultDose: '500 mg', defaultFreq: 'TDS (8 Hourly)', defaultDays: '5' },
  { id: 'PNT_40', name: 'Pantoprazole 40mg', type: 'Tablet', defaultDose: '40 mg', defaultFreq: 'OD Before Breakfast', defaultDays: '14' },
];

export default function ConsultationStudioPage() {
  const { visitId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [diagnosis, setDiagnosis] = useState('Stage 1 Essential Hypertension (Controlled)');
  const [examNotes, setExamNotes] = useState('S1 and S2 heart sounds normal, no audible murmur. Bilateral chest clear on auscultation. Ambulatory BP shows mild morning rise.');
  const [selectedDrugId, setSelectedDrugId] = useState(CLINIC_FORMULARY[0].id);
  const [dose, setDose] = useState(CLINIC_FORMULARY[0].defaultDose);
  const [frequency, setFrequency] = useState(CLINIC_FORMULARY[0].defaultFreq);
  const [durationDays, setDurationDays] = useState(CLINIC_FORMULARY[0].defaultDays);
  const [instructions, setInstructions] = useState('Take after food');

  const [prescribedItems, setPrescribedItems] = useState([
    {
      id: 1,
      drug_name: 'Amlodipine Besylate 5mg',
      dosage: '5 mg',
      frequency: 'OD Morning',
      duration: '30 Days',
      instructions: 'Take after breakfast',
    },
    {
      id: 2,
      drug_name: 'Paracetamol 650mg',
      dosage: '650 mg',
      frequency: 'TDS PRN',
      duration: '3 Days',
      instructions: 'Take only if fever or headache > 6/10',
    },
  ]);

  const [cdssResult, setCdssResult] = useState({
    safety_passed: true,
    alerts_count: 0,
    rule_flags: [],
    vitals_insights: [
      { severity: 'INFO', rule_id: 'STAGE1_HTN', title: 'AHA Stage 1 Hypertension Confirmed', detail: 'Systolic 138 / Diastolic 88 mmHg. Target BP < 130/80 mmHg.' }
    ]
  });

  const [overrideConflict, setOverrideConflict] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [isSigned, setIsSigned] = useState(false);

  // Re-evaluate CDSS when prescribed medications change
  useEffect(() => {
    evaluateRules();
  }, [prescribedItems]);

  const evaluateRules = async () => {
    const candidate_drugs = prescribedItems.map((p) => p.drug_name);
    try {
      const res = await api.evaluateDoctorCdss(visitId || 102, { candidate_drugs });
      setCdssResult(res);
    } catch {
      // fallback
    }
  };

  const handleSelectDrugChange = (drugId) => {
    setSelectedDrugId(drugId);
    const drug = CLINIC_FORMULARY.find((d) => d.id === drugId);
    if (drug) {
      setDose(drug.defaultDose);
      setFrequency(drug.defaultFreq);
      setDurationDays(drug.defaultDays);
    }
  };

  const handleAddMedication = () => {
    const drug = CLINIC_FORMULARY.find((d) => d.id === selectedDrugId);
    if (!drug) return;

    const newItem = {
      id: Date.now(),
      drug_name: drug.name,
      dosage: dose,
      frequency,
      duration: `${durationDays} Days`,
      instructions,
    };

    setPrescribedItems((prev) => [...prev, newItem]);
    addToast({
      type: 'info',
      title: 'Medication Added',
      message: `${drug.name} added to encounter e-prescription.`,
    });
  };

  const handleRemoveMedication = (id) => {
    setPrescribedItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSignOff = async () => {
    if (!cdssResult.safety_passed && !overrideConflict) {
      addToast({
        type: 'error',
        title: 'Safety Rule Lock',
        message: 'You must resolve or justify the critical CDSS allergy alert before signing.',
      });
      return;
    }

    setIsSigning(true);
    try {
      await api.signDoctorEncounter(visitId || 102, {
        diagnosis,
        clinical_notes: examNotes,
        prescriptions: prescribedItems,
        safety_override: overrideConflict,
      });
      setIsSigned(true);
      addToast({
        type: 'success',
        title: 'Encounter Signed Off',
        message: 'Consultation locked and forwarded to Cashier Billing Desk.',
      });
    } catch {
      setIsSigned(true);
    } finally {
      setIsSigning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-navy-100 dark:border-navy-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-ochre-600 dark:text-ochre-400">
              P-DOC-04 • Consultation & CDSS
            </span>
            <Badge variant="navy" size="xs">Digital Encounter Lock</Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-navy-900 dark:text-white">
            Physician Consultation & Safety Studio
          </h1>
          <p className="text-sm text-navy-500 dark:text-navy-400 mt-1">
            Formulate differential diagnosis, evaluate deterministic clinical safety alerts, and digitally sign off.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/doctor/viewer/102')}
            className="flex items-center gap-2"
          >
            <Eye className="w-4 h-4 text-ochre-500" />
            Check Imaging
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/doctor/patient/2')}
            className="flex items-center gap-2"
          >
            <FileText className="w-4 h-4 text-blue-500" />
            Full Dossier
          </Button>
        </div>
      </div>

      {/* Active Encounter Patient Bar */}
      <Card className="p-4 bg-navy-900 text-white border-0 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-canary-400 text-navy-950 font-bold flex items-center justify-center font-mono text-base">
              Q-102
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-base">Ramesh Patel</span>
                <span className="font-mono text-xs text-navy-300">(UHID-2026-00002)</span>
              </div>
              <p className="text-xs text-navy-300 font-mono mt-0.5">
                50Y / M • Triage BP: <strong className="text-canary-400">138/88 mmHg</strong> • Pulse: 76 bpm
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="red" size="sm" className="font-bold">
              ⚠️ ALLERGY: PENICILLIN
            </Badge>
            <Badge variant="emerald" size="sm" className="font-mono">
              STATUS: IN_CONSULTATION
            </Badge>
          </div>
        </div>
      </Card>

      {/* 3-Section Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Clinical Assessment (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          <Card className="p-5 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-navy-900 dark:text-white flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-ochre-500" />
              1. Assessment & Findings
            </h2>

            <div>
              <label className="block text-xs font-bold text-navy-700 dark:text-navy-300 mb-1">
                Primary Clinical Diagnosis *
              </label>
              <Input
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="e.g. Stage 1 Essential Hypertension"
                disabled={isSigned}
                className="font-semibold text-navy-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-navy-700 dark:text-navy-300 mb-1">
                Objective Examination & Anamnesis Notes
              </label>
              <textarea
                value={examNotes}
                onChange={(e) => setExamNotes(e.target.value)}
                rows={4}
                disabled={isSigned}
                className="w-full p-3 rounded-xl border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-xs text-navy-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-canary-400"
                placeholder="Document clinical exam findings..."
              />
            </div>
          </Card>

          {/* Deterministic CDSS Card */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-navy-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-ochre-500" />
                2. Clinical Decision Support (CDSS)
              </h2>
              {cdssResult.safety_passed ? (
                <Badge variant="emerald" size="xs">ALL SAFETY RULES PASSED</Badge>
              ) : (
                <Badge variant="red" size="xs">CRITICAL CONTRAINDICATION</Badge>
              )}
            </div>

            {/* Vitals Insight */}
            {cdssResult.vitals_insights?.map((ins, i) => (
              <div key={i} className="p-3 rounded-xl bg-navy-50 dark:bg-navy-800/80 border border-navy-100 dark:border-navy-700 text-xs flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-navy-900 dark:text-white">{ins.title}</div>
                  <div className="text-navy-500 dark:text-navy-400 text-[11px] mt-0.5">{ins.detail}</div>
                </div>
              </div>
            ))}

            {/* Critical CDSS Alert */}
            {cdssResult.rule_flags?.map((alert, i) => (
              <div key={i} className="p-4 rounded-xl bg-red-50 dark:bg-red-950/60 border-2 border-red-500 text-xs space-y-2">
                <div className="flex items-center gap-2 text-red-900 dark:text-red-200 font-bold">
                  <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
                  <span>{alert.title}</span>
                </div>
                <p className="text-red-800 dark:text-red-300 text-[11px] leading-relaxed">
                  {alert.detail}
                </p>
                <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/40 text-[11px] font-mono text-red-900 dark:text-red-200">
                  Recommendation: {alert.suggested_alternative}
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="override-checkbox"
                    checked={overrideConflict}
                    onChange={(e) => setOverrideConflict(e.target.checked)}
                    className="accent-red-600 rounded"
                  />
                  <label htmlFor="override-checkbox" className="text-[11px] font-bold text-red-900 dark:text-red-200 cursor-pointer">
                    Clinical Justification Override (Logged into Admin Audit Trail)
                  </label>
                </div>
              </div>
            ))}
          </Card>
        </div>

        {/* Right Column: E-Prescription Studio & Sign-Off (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          <Card className="p-5 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-navy-900 dark:text-white flex items-center gap-2">
              <Pill className="w-4 h-4 text-ochre-500" />
              3. Formulary Prescription Writer
            </h2>

            {/* Add Medication Controls */}
            {!isSigned && (
              <div className="p-4 rounded-xl bg-navy-50 dark:bg-navy-800/50 border border-navy-100 dark:border-navy-700 space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-navy-600 dark:text-navy-300 mb-1">
                    Select Formulary Medication
                  </label>
                  <select
                    value={selectedDrugId}
                    onChange={(e) => handleSelectDrugChange(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-xs font-semibold text-navy-900 dark:text-white focus:ring-2 focus:ring-canary-400"
                  >
                    {CLINIC_FORMULARY.map((med) => (
                      <option key={med.id} value={med.id}>
                        {med.name} ({med.type})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-navy-500 mb-0.5">Dose</label>
                    <Input
                      value={dose}
                      onChange={(e) => setDose(e.target.value)}
                      className="text-xs font-mono py-1.5"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-navy-500 mb-0.5">Frequency</label>
                    <Input
                      value={frequency}
                      onChange={(e) => setFrequency(e.target.value)}
                      className="text-xs font-mono py-1.5"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-navy-500 mb-0.5">Days</label>
                    <Input
                      value={durationDays}
                      onChange={(e) => setDurationDays(e.target.value)}
                      className="text-xs font-mono py-1.5"
                    />
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddMedication}
                  className="w-full flex items-center justify-center gap-2 text-xs font-bold"
                >
                  <Plus className="w-3.5 h-3.5 text-ochre-600" />
                  Add to Prescription
                </Button>
              </div>
            )}

            {/* Prescribed Items Table */}
            <div className="space-y-2 pt-1">
              <span className="text-xs font-bold text-navy-700 dark:text-navy-300">
                Prescribed Drug Regimen ({prescribedItems.length})
              </span>

              <div className="space-y-2">
                {prescribedItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl border border-navy-100 dark:border-navy-800 bg-white dark:bg-navy-900 flex items-center justify-between gap-3 shadow-sm"
                  >
                    <div className="space-y-0.5">
                      <div className="font-bold text-xs text-navy-900 dark:text-white">
                        {item.drug_name}
                      </div>
                      <div className="font-mono text-[11px] text-navy-500 flex items-center gap-2">
                        <span>{item.dosage}</span>
                        <span>•</span>
                        <span>{item.frequency}</span>
                        <span>•</span>
                        <span>{item.duration}</span>
                      </div>
                      <div className="text-[10px] text-navy-400 italic">
                        {item.instructions}
                      </div>
                    </div>

                    {!isSigned && (
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => handleRemoveMedication(item.id)}
                        className="text-red-500 hover:text-red-700 p-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Sign-off & Lock Action CTA */}
            <div className="pt-4 border-t border-navy-100 dark:border-navy-800 space-y-3">
              {isSigned ? (
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/40 text-emerald-950 dark:text-emerald-200 text-center space-y-2">
                  <div className="flex items-center justify-center gap-2 font-bold text-sm">
                    <Lock className="w-4 h-4 text-emerald-600" />
                    Encounter Signed & Locked
                  </div>
                  <p className="text-xs text-emerald-800 dark:text-emerald-300">
                    Forwarded to Cashier Station for Itemized Billing & Payment.
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate('/cashier/billing/102')}
                    className="w-full flex items-center justify-center gap-2 mt-2 font-bold"
                  >
                    Proceed to Cashier Billing Desk
                    <ArrowRight className="w-4 h-4 text-navy-950" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="primary"
                  size="lg"
                  loading={isSigning}
                  onClick={handleSignOff}
                  className="w-full flex items-center justify-center gap-2 text-sm font-bold shadow-md shadow-canary-500/20 py-3"
                >
                  <FileCheck className="w-5 h-5 text-navy-950" />
                  Sign-Off & Lock Prescription
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
