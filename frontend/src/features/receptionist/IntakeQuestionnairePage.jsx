import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Mic,
  MicOff,
  CheckCircle2,
  ArrowRight,
  Volume2,
  Users,
  Search,
  UserCheck,
  Clock,
  ChevronRight,
  ClipboardList
} from 'lucide-react';
import { api } from '../../services/api';
import { Button, Card, Badge, useToast } from '../../components/ui';
import { ROUTES } from '../../routes';

// Standard 12-20 Clinical Screening Questions (extensible to Q20)
const CLINICAL_QUESTIONS = [
  {
    id: 'q1',
    title: 'Q1: Primary Symptom Severity Level',
    options: [
      { index: 0, label: '0 — Asymptomatic / None' },
      { index: 1, label: '1 — Mild discomfort (Self-managed)' },
      { index: 2, label: '2 — Moderate functional impairment' },
      { index: 3, label: '3 — Severe acute distress' },
    ],
  },
  {
    id: 'q2',
    title: 'Q2: Symptom Onset Duration',
    options: [
      { index: 0, label: '0 — Acute (< 24 hours)' },
      { index: 1, label: '1 — Subacute (2 to 3 days)' },
      { index: 2, label: '2 — Ongoing (1 to 2 weeks)' },
      { index: 3, label: '3 — Chronic (> 1 month)' },
    ],
  },
  {
    id: 'q3',
    title: 'Q3: Associated Fever / Temperature Elevation',
    options: [
      { index: 0, label: '0 — No fever reported' },
      { index: 1, label: '1 — Low grade (< 100°F)' },
      { index: 2, label: '2 — Moderate fever (100°F - 102°F)' },
      { index: 3, label: '3 — High grade pyrexia (> 102°F)' },
    ],
  },
  {
    id: 'q4',
    title: 'Q4: Known Drug Allergy Screening',
    options: [
      { index: 0, label: '0 — No Known Drug Allergies (NKDA)' },
      { index: 1, label: '1 — Penicillin / Beta-lactams' },
      { index: 2, label: '2 — Sulfa / Sulfonamides' },
      { index: 3, label: '3 — NSAIDs / Aspirin' },
    ],
  },
  {
    id: 'q5',
    title: 'Q5: Cardiovascular Palpitations / Chest Heaviness',
    options: [
      { index: 0, label: '0 — None / Normal' },
      { index: 1, label: '1 — Exertional shortness of breath' },
      { index: 2, label: '2 — Palpitations at rest' },
      { index: 3, label: '3 — Crushing retrosternal pain' },
    ],
  },
  {
    id: 'q6',
    title: 'Q6: Respiratory Cough / Wheezing',
    options: [
      { index: 0, label: '0 — No cough' },
      { index: 1, label: '1 — Dry intermittent cough' },
      { index: 2, label: '2 — Productive sputum cough' },
      { index: 3, label: '3 — Hemoptysis / Blood in sputum' },
    ],
  },
  {
    id: 'q7',
    title: 'Q7: Gastrointestinal Nausea / Dyspepsia',
    options: [
      { index: 0, label: '0 — Normal appetite & digestion' },
      { index: 1, label: '1 — Acid reflux / Epigastric burning' },
      { index: 2, label: '2 — Vomiting / Waterbrash' },
      { index: 3, label: '3 — Severe abdominal guarding' },
    ],
  },
  {
    id: 'q8',
    title: 'Q8: Neurological Cephalea / Dizziness',
    options: [
      { index: 0, label: '0 — Clear sensorium' },
      { index: 1, label: '1 — Tension headache' },
      { index: 2, label: '2 — Orthostatic vertigo / Dizziness' },
      { index: 3, label: '3 — Syncope / Focal deficit' },
    ],
  },
  {
    id: 'q9',
    title: 'Q9: Sleep Quality & Fatigue Level',
    options: [
      { index: 0, label: '0 — Restful / Normal energy' },
      { index: 1, label: '1 — Mild diurnal fatigue' },
      { index: 2, label: '2 — Insomnia (< 4 hrs sleep)' },
      { index: 3, label: '3 — Severe exhaustion / Malaise' },
    ],
  },
  {
    id: 'q10',
    title: 'Q10: Current Chronic Medication Adherence',
    options: [
      { index: 0, label: '0 — Strict daily compliance' },
      { index: 1, label: '1 — Occasional missed dose' },
      { index: 2, label: '2 — Frequent non-adherence' },
      { index: 3, label: '3 — Discontinued without advice' },
    ],
  },
  {
    id: 'q11',
    title: 'Q11: Tobacco / Smoking History',
    options: [
      { index: 0, label: '0 — Non-smoker (Never)' },
      { index: 1, label: '1 — Former smoker (> 1 yr quit)' },
      { index: 2, label: '2 — Light smoker (< 5/day)' },
      { index: 3, label: '3 — Heavy active smoker' },
    ],
  },
  {
    id: 'q12',
    title: 'Q12: Alcohol Consumption Pattern',
    options: [
      { index: 0, label: '0 — Abstainer' },
      { index: 1, label: '1 — Occasional / Social' },
      { index: 2, label: '2 — Moderate weekly intake' },
      { index: 3, label: '3 — Heavy daily consumption' },
    ],
  },
];

const INITIAL_PATIENTS = [
  {
    visitId: 101,
    token: 'Q-101',
    uhid: 'UHID-2026-00001',
    name: 'Ananya Sharma',
    age: 52,
    gender: 'FEMALE',
    doctor: 'Dr. Vikram Kulkarni, MD',
    stage: 'IN_CONSULTATION',
    answers: { q1: 0, q2: 1, q3: 0, q4: 0, q5: 0, q6: 0, q7: 0, q8: 0, q9: 1, q10: 0, q11: 0, q12: 0 },
    voiceNotes: 'Routine quarterly checkup. No acute symptoms reported.',
    completed: true,
  },
  {
    visitId: 102,
    token: 'Q-102',
    uhid: 'UHID-2026-00002',
    name: 'Ramesh Patel',
    age: 50,
    gender: 'MALE',
    doctor: 'Dr. Vikram Kulkarni, MD',
    stage: 'TRIAGED',
    answers: { q1: 1, q2: 1, q3: 0, q4: 0 },
    voiceNotes: 'Patient reports mild morning headache onset 3 days ago. No prior drug allergies documented.',
    completed: false,
  },
  {
    visitId: 103,
    token: 'Q-103',
    uhid: 'UHID-2026-00003',
    name: 'Sunita Rao',
    age: 62,
    gender: 'FEMALE',
    doctor: 'Dr. Ananya Roy, MBBS',
    stage: 'TRIAGED',
    answers: {},
    voiceNotes: '',
    completed: false,
  },
];

export function IntakeQuestionnairePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addToast } = useToast();

  const [patients, setPatients] = useState(INITIAL_PATIENTS);
  const [selectedToken, setSelectedToken] = useState('Q-102');
  const [patientSearch, setPatientSearch] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);

  // Auto-select token from URL params if provided
  useEffect(() => {
    const paramToken = searchParams.get('token');
    if (paramToken) {
      setSelectedToken(paramToken);
      // If patient not in initial list, dynamically append
      setPatients((prev) => {
        if (!prev.find((p) => p.token === paramToken)) {
          return [
            {
              visitId: Date.now(),
              token: paramToken,
              uhid: `UHID-2026-0000${Math.floor(Math.random() * 80) + 20}`,
              name: 'Registered Walk-in Patient',
              age: 45,
              gender: 'MALE',
              doctor: 'Dr. Vikram Kulkarni, MD',
              stage: 'TRIAGED',
              answers: {},
              voiceNotes: '',
              completed: false,
            },
            ...prev,
          ];
        }
        return prev;
      });
    }
  }, [searchParams]);

  // Current active patient
  const activePatient = patients.find((p) => p.token === selectedToken) || patients[0];
  const activeAnswers = activePatient?.answers || {};
  const activeVoiceNotes = activePatient?.voiceNotes || '';

  const answeredCount = Object.keys(activeAnswers).length;
  const totalQuestions = CLINICAL_QUESTIONS.length;
  const progressPct = Math.round((answeredCount / totalQuestions) * 100);

  function handleOptionSelect(qId, index) {
    setPatients((prev) =>
      prev.map((p) => {
        if (p.token === activePatient.token) {
          return {
            ...p,
            answers: {
              ...p.answers,
              [qId]: index,
            },
          };
        }
        return p;
      })
    );
  }

  function handleVoiceNotesChange(text) {
    setPatients((prev) =>
      prev.map((p) => {
        if (p.token === activePatient.token) {
          return { ...p, voiceNotes: text };
        }
        return p;
      })
    );
  }

  function toggleVoiceDictation() {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      addToast({
        title: 'Voice Speech Unavailable',
        message: 'Web Speech API is not supported in this browser.',
        type: 'error',
      });
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
        handleVoiceNotesChange(activeVoiceNotes ? `${activeVoiceNotes} ${transcript}` : transcript);
        setIsListening(false);
        addToast({ title: 'Dictated Note Added', message: `"${transcript}"`, type: 'success' });
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
    } else {
      setIsListening(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.saveQuestionnaire(activePatient.visitId || 102, {
        patient_id: 2,
        answers: activeAnswers,
        voice_notes: activeVoiceNotes,
      });

      // Mark this patient as completed
      setPatients((prev) =>
        prev.map((p) => (p.token === activePatient.token ? { ...p, completed: true } : p))
      );

      addToast({
        title: 'Intake Questionnaire Saved',
        message: `Saved ${answeredCount}/${totalQuestions} answers for #${activePatient.token} (${activePatient.name}).`,
        type: 'success',
      });
    } catch (err) {
      addToast({ title: 'Submission Error', message: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  const filteredPatients = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
      p.token.toLowerCase().includes(patientSearch.toLowerCase()) ||
      p.uhid.toLowerCase().includes(patientSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EAE4D3] dark:border-[#1B456E] pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase font-mono tracking-wider text-[#8A740C] dark:text-[#FFC21A]">
              P-REC-03 • Patient-List Based Anamnesis
            </span>
            <Badge variant="brand" size="xs">Live Intake</Badge>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0A2540] dark:text-white">
            Standardized Intake Questionnaire
          </h1>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
            Select any registered patient from the active roster to record symptoms and baseline risk factors.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(ROUTES.RECEPTIONIST.QUEUE)}
          className="self-start sm:self-auto"
        >
          View Full Queue Roster
        </Button>
      </div>

      {/* Main 2-Column Layout: Left Patient List, Right Questionnaire */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Patient Queue Roster (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <Card variant="surface" className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#0A2540] dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-[#8A740C] dark:text-[#FFC21A]" />
                Registered Patients ({patients.length})
              </h2>
              <span className="text-[10px] font-mono text-[#64748B] dark:text-[#94A3B8]">
                OPD Lounge
              </span>
            </div>

            {/* Patient Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
              <input
                type="text"
                placeholder="Search patient, token, UHID..."
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-[#FAF6EC] dark:bg-[#071D33] border border-[#EAE4D3] dark:border-[#1B456E] rounded-xl text-xs text-[#0A2540] dark:text-white placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#FFC21A]"
              />
            </div>

            {/* Patients Scrollable Roster */}
            <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
              {filteredPatients.map((p) => {
                const isSelected = p.token === activePatient?.token;
                const pAnswered = Object.keys(p.answers || {}).length;
                const isDone = p.completed || pAnswered >= totalQuestions;

                return (
                  <button
                    key={p.token}
                    type="button"
                    onClick={() => setSelectedToken(p.token)}
                    className={`w-full text-left p-3.5 rounded-2xl transition-all border flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'bg-[#FAF6EC] dark:bg-[#0F355A] border-[#FFC21A] ring-1 ring-[#FFC21A] shadow-sm'
                        : 'bg-white dark:bg-[#0A2540] border-[#EAE4D3] dark:border-[#1B456E] hover:border-[#FFC21A]/60'
                    }`}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center font-mono text-xs font-bold px-2 py-0.5 rounded-lg bg-[#0A2540] text-[#FFC21A] dark:bg-[#071D33] dark:text-[#FFC21A] border border-[#1B456E]">
                          #{p.token}
                        </span>
                        <span className="text-xs font-bold text-[#0A2540] dark:text-white truncate">
                          {p.name}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8] font-mono">
                        {p.age}y / {p.gender?.[0]} • {p.uhid}
                      </div>
                      <div className="text-[10px] text-[#8A740C] dark:text-[#FFE08A] font-medium truncate">
                        {p.doctor}
                      </div>
                    </div>

                    <div className="shrink-0 flex flex-col items-end gap-1.5">
                      {isDone ? (
                        <Badge variant="completed" size="xs">
                          {pAnswered}/{totalQuestions} Done
                        </Badge>
                      ) : pAnswered > 0 ? (
                        <Badge variant="brand" size="xs">
                          {pAnswered}/{totalQuestions} In Progress
                        </Badge>
                      ) : (
                        <Badge variant="neutral" size="xs">
                          Pending
                        </Badge>
                      )}
                      <ChevronRight className={`w-3.5 h-3.5 ${isSelected ? 'text-[#0A2540] dark:text-white' : 'text-[#94A3B8]'}`} />
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN: Active Patient Screening Form (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          {/* Active Patient Hero Context (Unified Warm Amber Theme) */}
          <Card variant="dark" className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center justify-center font-mono font-bold text-base px-3 py-1.5 rounded-xl bg-[#0F355A] text-[#FFC21A] border border-[#1B456E]">
                #{activePatient.token}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base text-white">
                    {activePatient.name}
                  </span>
                  <span className="text-xs text-[#94A3B8] font-mono">
                    ({activePatient.age}y / {activePatient.gender})
                  </span>
                </div>
                <div className="text-xs text-[#CBD5E1] font-mono mt-0.5">
                  {activePatient.uhid} • Attending: {activePatient.doctor}
                </div>
              </div>
            </div>

            {/* Linear Progress Bar in Unified Warm Amber */}
            <div className="w-full md:w-64 space-y-1.5 font-mono text-xs">
              <div className="flex items-center justify-between text-[#CBD5E1]">
                <span>Screening Progress</span>
                <span className="font-bold text-[#FFC21A]">{answeredCount}/{totalQuestions} Answered</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#1B456E] overflow-hidden">
                <div
                  className="h-full bg-[#FFC21A] transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          </Card>

          {/* MCQ QUESTIONS GRID (Unified Warm Amber Selected State) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CLINICAL_QUESTIONS.map((q) => {
              const selectedIndex = activeAnswers[q.id];

              return (
                <Card key={q.id} variant="surface" className="p-4 flex flex-col justify-between space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-xs font-bold text-[#0A2540] dark:text-white tracking-tight">
                      {q.title}
                    </h3>
                    {selectedIndex !== undefined && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-[#E6F7ED] text-[#047857] font-bold border border-[#A7F3D0]">
                        Val: {selectedIndex}
                      </span>
                    )}
                  </div>

                  {/* Radio Option Chips mapped to unified warm amber (#FFC21A) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {q.options.map((opt) => {
                      const isChecked = selectedIndex === opt.index;

                      return (
                        <button
                          key={opt.index}
                          type="button"
                          onClick={() => handleOptionSelect(q.id, opt.index)}
                          className={`p-2.5 rounded-xl text-left text-xs transition-all flex items-center justify-between border ${
                            isChecked
                              ? 'bg-[#FFC21A] text-[#0A2540] font-bold border-[#F5A300] shadow-xs'
                              : 'bg-[#FAF6EC] dark:bg-[#071D33] text-[#64748B] dark:text-[#CBD5E1] border-[#EAE4D3] dark:border-[#1B456E] hover:border-[#0A2540] dark:hover:border-[#FFC21A]'
                          }`}
                        >
                          <span className="truncate">{opt.label}</span>
                          <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ml-2 ${
                            isChecked ? 'border-[#0A2540] bg-[#0A2540]' : 'border-[#CBD5E1] dark:border-[#1B456E]'
                          }`}>
                            {isChecked && <span className="w-1.5 h-1.5 rounded-full bg-[#FFC21A]" />}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Voice-Assisted Clinical Observations & Notes */}
          <Card variant="surface" className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#0A2540] dark:text-white flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-[#8A740C] dark:text-[#FFC21A]" />
                  Voice Dictation & Clinical Anamnesis Notes
                </h3>
                <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] font-mono mt-0.5">
                  Click the mic button to capture verbatim patient statements.
                </p>
              </div>

              <Button
                type="button"
                variant={isListening ? 'danger' : 'outline'}
                size="sm"
                icon={isListening ? MicOff : Mic}
                onClick={toggleVoiceDictation}
                className={isListening ? 'animate-pulse' : ''}
              >
                {isListening ? 'Stop Listening' : 'Dictate Speech'}
              </Button>
            </div>

            <textarea
              rows={3}
              value={activeVoiceNotes}
              onChange={(e) => handleVoiceNotesChange(e.target.value)}
              placeholder="e.g. Patient reports pain radiating to left arm upon exertion. No previous adverse drug reactions."
              className="w-full p-3 rounded-2xl border border-[#EAE4D3] dark:border-[#1B456E] bg-[#FAF6EC] dark:bg-[#071D33] text-xs text-[#0A2540] dark:text-white placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#FFC21A] resize-none"
            />
          </Card>

          {/* Submission Bar */}
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              onClick={() => {
                // Switch to next uncompleted patient
                const nextPatient = patients.find((p) => p.token !== activePatient.token && !p.completed);
                if (nextPatient) setSelectedToken(nextPatient.token);
              }}
            >
              Skip / Next Patient
            </Button>

            <Button
              variant="primary"
              size="lg"
              onClick={handleSubmit}
              disabled={loading}
              icon={CheckCircle2}
              className="bg-[#FFC21A] hover:bg-[#F5A300] text-[#0A2540] font-bold shadow-sm"
            >
              {loading ? 'Saving Responses...' : `Save Screening for #${activePatient.token}`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default IntakeQuestionnairePage;
