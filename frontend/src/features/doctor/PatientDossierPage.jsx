import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User,
  AlertOctagon,
  Activity,
  Heart,
  Thermometer,
  Wind,
  Weight,
  Calendar,
  Clock,
  ChevronDown,
  ChevronUp,
  FileText,
  Stethoscope,
  Eye,
  CheckCircle2,
  Mic,
  ArrowLeft
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { api } from '../../services/api';

export default function PatientDossierPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dossier, setDossier] = useState(null);
  const [questionnaire, setQuestionnaire] = useState(null);
  const [showQuestionnaire, setShowQuestionnaire] = useState(true);

  useEffect(() => {
    loadDossier();
  }, [id]);

  const loadDossier = async () => {
    setLoading(true);
    try {
      const data = await api.getPatientDossier(id || 2);
      setDossier(data);
      const qData = await api.getQuestionnaire(102);
      setQuestionnaire(qData);
    } catch {
      // handled by fallbacks
    } finally {
      setLoading(false);
    }
  };

  const patient = dossier?.patient || {
    uhid: 'UHID-2026-00002',
    full_name: 'Ramesh Patel',
    age: 50,
    gender: 'MALE',
    blood_group: 'B+',
    phone: '+91 98765 43210',
    known_allergies: ['Penicillin (Severe Rash & Urticaria)'],
    chronic_conditions: ['Essential Hypertension (diagnosed 2024)'],
  };

  const vitals = dossier?.current_vitals || {
    bp: '138/88',
    bp_stage: 'Stage 1 Hypertension',
    pulse: 76,
    temp_f: 98.4,
    spo2: 98,
    resp: 16,
    bmi: 25.5,
    weight_kg: 74.5,
    height_cm: 171.0,
  };

  const pastVisits = dossier?.past_encounters || [];

  return (
    <div className="space-y-6">
      {/* Header and Back navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-navy-100 dark:border-navy-800 pb-5">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/doctor/dashboard')}
            className="p-2"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-ochre-600 dark:text-ochre-400">
                P-DOC-02 • Longitudinal Record
              </span>
              <Badge variant="navy" size="xs">Medical Dossier</Badge>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-navy-900 dark:text-white">
              Patient Clinical Dossier
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/doctor/viewer/102')}
            className="flex items-center gap-2"
          >
            <Eye className="w-4 h-4 text-ochre-500" />
            View Scans
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/doctor/consultation/102')}
            className="flex items-center gap-2 font-bold"
          >
            <Stethoscope className="w-4 h-4 text-navy-950" />
            Open Consultation
          </Button>
        </div>
      </div>

      {/* Patient Summary Header */}
      <Card className="p-5 bg-white dark:bg-navy-900 border border-navy-100 dark:border-navy-800 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-navy-100 dark:bg-navy-800 text-navy-800 dark:text-canary-400 font-bold flex items-center justify-center text-xl font-mono border border-navy-200 dark:border-navy-700">
              {patient.full_name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-navy-900 dark:text-white tracking-tight">
                  {patient.full_name}
                </h2>
                <Badge variant="canary" size="xs" className="font-mono font-bold">
                  {patient.uhid}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-navy-500 dark:text-navy-400 mt-1 font-mono">
                <span>{patient.age} Years Old</span>
                <span>•</span>
                <span>{patient.gender}</span>
                <span>•</span>
                <span>Blood Group: <strong className="text-navy-900 dark:text-white">{patient.blood_group}</strong></span>
                <span>•</span>
                <span>{patient.phone}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            {patient.chronic_conditions?.map((cond, i) => (
              <Badge key={i} variant="navy" size="sm" className="font-sans">
                {cond}
              </Badge>
            ))}
          </div>
        </div>
      </Card>

      {/* High-Risk Allergies Warning Banner */}
      {patient.known_allergies && patient.known_allergies.length > 0 && (
        <Card className="p-4 bg-red-50 dark:bg-red-950/40 border-2 border-red-500/40 text-red-950 dark:text-red-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-600 text-white shrink-0">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-red-700 dark:text-red-400">
                  Critical Drug Allergy Safeguard
                </h4>
                <Badge variant="red" size="xs">HIGH ALERT</Badge>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                {patient.known_allergies.map((allergy, i) => (
                  <span
                    key={i}
                    className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-red-100 dark:bg-red-900/60 text-red-900 dark:text-red-100 border border-red-300 dark:border-red-800"
                  >
                    ⚠️ {allergy}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Today's Triage Vitals 6-Metric Strip */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-navy-500 dark:text-navy-400">
            Today's Hemodynamic Vitals (Captured at Front Desk)
          </h3>
          <Badge variant={vitals.bp_stage?.includes('Stage 2') ? 'red' : 'amber'} size="xs">
            {vitals.bp_stage}
          </Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <div className="p-3.5 rounded-xl bg-white dark:bg-navy-900 border border-navy-100 dark:border-navy-800 shadow-sm">
            <span className="text-[11px] font-semibold text-navy-500 uppercase flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-ochre-500" /> BP
            </span>
            <div className="text-lg font-bold font-mono text-navy-900 dark:text-white mt-1">
              {vitals.bp}
            </div>
            <div className="text-[10px] text-navy-400">mmHg</div>
          </div>

          <div className="p-3.5 rounded-xl bg-white dark:bg-navy-900 border border-navy-100 dark:border-navy-800 shadow-sm">
            <span className="text-[11px] font-semibold text-navy-500 uppercase flex items-center gap-1">
              <Heart className="w-3.5 h-3.5 text-red-500" /> Pulse
            </span>
            <div className="text-lg font-bold font-mono text-navy-900 dark:text-white mt-1">
              {vitals.pulse}
            </div>
            <div className="text-[10px] text-navy-400">bpm</div>
          </div>

          <div className="p-3.5 rounded-xl bg-white dark:bg-navy-900 border border-navy-100 dark:border-navy-800 shadow-sm">
            <span className="text-[11px] font-semibold text-navy-500 uppercase flex items-center gap-1">
              <Thermometer className="w-3.5 h-3.5 text-orange-500" /> Temp
            </span>
            <div className="text-lg font-bold font-mono text-navy-900 dark:text-white mt-1">
              {vitals.temp_f}°F
            </div>
            <div className="text-[10px] text-navy-400">Oral</div>
          </div>

          <div className="p-3.5 rounded-xl bg-white dark:bg-navy-900 border border-navy-100 dark:border-navy-800 shadow-sm">
            <span className="text-[11px] font-semibold text-navy-500 uppercase flex items-center gap-1">
              <Wind className="w-3.5 h-3.5 text-blue-500" /> SpO2
            </span>
            <div className="text-lg font-bold font-mono text-navy-900 dark:text-white mt-1">
              {vitals.spo2}%
            </div>
            <div className="text-[10px] text-navy-400">Room Air</div>
          </div>

          <div className="p-3.5 rounded-xl bg-white dark:bg-navy-900 border border-navy-100 dark:border-navy-800 shadow-sm">
            <span className="text-[11px] font-semibold text-navy-500 uppercase flex items-center gap-1">
              <Weight className="w-3.5 h-3.5 text-emerald-500" /> BMI
            </span>
            <div className="text-lg font-bold font-mono text-navy-900 dark:text-white mt-1">
              {vitals.bmi}
            </div>
            <div className="text-[10px] text-navy-400">kg/m²</div>
          </div>

          <div className="p-3.5 rounded-xl bg-white dark:bg-navy-900 border border-navy-100 dark:border-navy-800 shadow-sm">
            <span className="text-[11px] font-semibold text-navy-500 uppercase flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-purple-500" /> Resp
            </span>
            <div className="text-lg font-bold font-mono text-navy-900 dark:text-white mt-1">
              {vitals.resp}
            </div>
            <div className="text-[10px] text-navy-400">breaths/min</div>
          </div>
        </div>
      </div>

      {/* Intake Questionnaire Review Card */}
      <Card className="p-5">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setShowQuestionnaire(!showQuestionnaire)}
        >
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-ochre-500" />
            <h3 className="text-sm font-bold text-navy-900 dark:text-white">
              Preliminary Intake Questionnaire Review (Q1..Q12 MCQ Anamnesis)
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="navy" size="xs">Recorded at Triage</Badge>
            {showQuestionnaire ? <ChevronUp className="w-4 h-4 text-navy-400" /> : <ChevronDown className="w-4 h-4 text-navy-400" />}
          </div>
        </div>

        {showQuestionnaire && questionnaire && (
          <div className="mt-4 pt-4 border-t border-navy-100 dark:border-navy-800 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-navy-50 dark:bg-navy-800">
                <span className="text-navy-400 text-[10px] block">Q1: Symptom Severity</span>
                <strong className="text-navy-900 dark:text-white">Index 1 (Mild discomfort)</strong>
              </div>
              <div className="p-2.5 rounded-lg bg-navy-50 dark:bg-navy-800">
                <span className="text-navy-400 text-[10px] block">Q2: Onset Duration</span>
                <strong className="text-navy-900 dark:text-white">Index 0 (Today &lt;24h)</strong>
              </div>
              <div className="p-2.5 rounded-lg bg-navy-50 dark:bg-navy-800">
                <span className="text-navy-400 text-[10px] block">Q3: Associated Fever</span>
                <strong className="text-navy-900 dark:text-white">Index 0 (No fever)</strong>
              </div>
              <div className="p-2.5 rounded-lg bg-navy-50 dark:bg-navy-800">
                <span className="text-navy-400 text-[10px] block">Q4: Allergy Flag</span>
                <strong className="text-red-600 dark:text-red-400">Index 1 (Penicillin Flag)</strong>
              </div>
            </div>

            {questionnaire.voice_notes && (
              <div className="p-3 rounded-xl bg-canary-400/10 border border-canary-400/20 text-xs text-navy-900 dark:text-navy-200">
                <div className="flex items-center gap-1.5 font-bold text-ochre-700 dark:text-canary-400 mb-1">
                  <Mic className="w-3.5 h-3.5" />
                  Receptionist Dictated Notes:
                </div>
                <p className="italic">"{questionnaire.voice_notes}"</p>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Past Visits Longitudinal Timeline */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-ochre-500" />
            <h3 className="text-sm font-bold text-navy-900 dark:text-white">
              Past Visits & Historical Diagnoses ({pastVisits.length})
            </h3>
          </div>
        </div>

        <div className="relative border-l-2 border-navy-200 dark:border-navy-700 ml-3 pl-5 space-y-6">
          {pastVisits.map((visit, idx) => (
            <div key={idx} className="relative">
              <div className="absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full bg-canary-400 border-2 border-navy-900" />
              
              <div className="p-4 rounded-xl bg-navy-50 dark:bg-navy-800/60 border border-navy-100 dark:border-navy-700 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="font-mono text-xs font-bold text-navy-900 dark:text-white">
                    {visit.visit_date} • {visit.doctor_name}
                  </span>
                  <Badge variant="navy" size="xs">COMPLETED ENCOUNTER</Badge>
                </div>

                <div className="text-xs font-bold text-navy-900 dark:text-white">
                  Diagnosis: {visit.diagnosis}
                </div>

                <p className="text-xs text-navy-600 dark:text-navy-300">
                  {visit.conclusion_notes}
                </p>

                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[10px] text-navy-400 font-mono">Prescription:</span>
                  {visit.prescribed_medications?.map((med, mIdx) => (
                    <span
                      key={mIdx}
                      className="font-mono text-[11px] px-2 py-0.5 rounded bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-700 text-navy-800 dark:text-navy-200"
                    >
                      {med}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
