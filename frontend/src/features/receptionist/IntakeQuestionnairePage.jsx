import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, MicOff, CheckCircle2, ArrowRight, Volume2 } from 'lucide-react';
import { api } from '../../services/api';
import { Button, Card, Badge, useToast } from '../../components/ui';
import { ROUTES } from '../../routes';

// Standard 12-20 Clinical Screening Questions (extensible to Q20)
// Option values are strictly stored as integer indices: 0, 1, 2, 3
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
    title: 'Q10: Prior Hospitalization / Surgical History',
    options: [
      { index: 0, label: '0 — None in past 5 years' },
      { index: 1, label: '1 — Minor day care procedure' },
      { index: 2, label: '2 — Inpatient stay within 1 year' },
      { index: 3, label: '3 — Multiple chronic admissions' },
    ],
  },
  {
    id: 'q11',
    title: 'Q11: Tobacco & Nicotine Exposure',
    options: [
      { index: 0, label: '0 — Non-smoker / Lifetime zero' },
      { index: 1, label: '1 — Former smoker (> 1 yr quit)' },
      { index: 2, label: '2 — Occasional social tobacco' },
      { index: 3, label: '3 — Daily active smoker (> 10/day)' },
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

export function IntakeQuestionnairePage() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  // Selected answers: stored strictly as integer codes 0, 1, 2, 3
  const [answers, setAnswers] = useState({
    q1: 1,
    q2: 1,
    q3: 0,
    q4: 0,
  });

  const [voiceNotes, setVoiceNotes] = useState(
    'Patient reports mild morning headache onset 3 days ago. No prior drug allergies documented.'
  );

  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);

  // Active Patient Token Context
  const activeEncounter = {
    token: 'Q-102',
    uhid: 'UHID-2026-00002',
    name: 'Ramesh Patel',
    age: 50,
    gender: 'MALE',
    doctor: 'Dr. Vikram Kulkarni, MD',
  };

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = CLINICAL_QUESTIONS.length;
  const progressPct = Math.round((answeredCount / totalQuestions) * 100);

  function handleOptionSelect(qId, index) {
    setAnswers((prev) => ({
      ...prev,
      [qId]: index, // strictly integer index (0..3)
    }));
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
        setVoiceNotes((prev) => (prev ? `${prev} ${transcript}` : transcript));
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
      await api.saveQuestionnaire(102, {
        patient_id: 2,
        answers,
        voice_notes: voiceNotes,
      });
      addToast({
        title: 'Questionnaire Saved',
        message: `Saved ${answeredCount}/${totalQuestions} numerical answers for #${activeEncounter.token}.`,
        type: 'success',
      });
      navigate(ROUTES.RECEPTIONIST.QUEUE);
    } catch (err) {
      addToast({ title: 'Submission Error', message: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. ACTIVE TOKEN HEADER */}
      <Card variant="dark" className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="px-3.5 py-2 rounded-xl bg-[#FFE500] text-[#051A30] font-black font-mono text-lg shrink-0 shadow-sm">
            #{activeEncounter.token}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-tight">
                {activeEncounter.name}
              </h1>
              <span className="text-xs font-mono text-[#94A3B8]">
                ({activeEncounter.age}y / {activeEncounter.gender})
              </span>
            </div>
            <div className="text-xs text-[#CBD5E1] font-mono mt-0.5">
              {activeEncounter.uhid} • Attending: {activeEncounter.doctor}
            </div>
          </div>
        </div>

        {/* Linear Progress Bar */}
        <div className="w-full md:w-64 space-y-1.5 font-mono text-xs">
          <div className="flex items-center justify-between text-[#CBD5E1]">
            <span>Screening Progress</span>
            <span className="font-bold text-[#FFE500]">{answeredCount}/{totalQuestions} Answered</span>
          </div>
          <div className="w-full h-2 rounded-full bg-[#1B456E] overflow-hidden">
            <div
              className="h-full bg-[#FFE500] transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </Card>

      {/* 2. MCQ QUESTIONS GRID (2-Column Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {CLINICAL_QUESTIONS.map((q) => {
          const selectedIndex = answers[q.id];

          return (
            <Card key={q.id} variant="surface" className="p-5 flex flex-col justify-between space-y-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-xs font-bold text-[#0A2540] dark:text-white tracking-tight">
                  {q.title}
                </h3>
                {selectedIndex !== undefined && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#ECFDF5] text-[#065F46] font-bold border border-[#A7F3D0]">
                    Val: {selectedIndex}
                  </span>
                )}
              </div>

              {/* Radio Option Chips mapped to integer indices (0, 1, 2, 3) */}
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
                          ? 'bg-[#FFE500] text-[#051A30] font-bold border-[#EAB308] shadow-xs'
                          : 'bg-[#F6F7FA] dark:bg-[#0F355A] text-[#64748B] dark:text-[#CBD5E1] border-[#CBD5E1]/60 dark:border-[#1B456E] hover:border-[#0A2540] dark:hover:border-[#FFE500]'
                      }`}
                    >
                      <span className="truncate">{opt.label}</span>
                      <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ml-2 ${
                        isChecked ? 'border-[#051A30] bg-[#051A30]' : 'border-[#CBD5E1]'
                      }`}>
                        {isChecked && <span className="w-1.5 h-1.5 rounded-full bg-[#FFE500]" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>

      {/* 3. VOICE-ASSISTED CLINICAL OBSERVATIONS & NOTES */}
      <Card variant="surface" className="p-6 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0A2540] dark:text-white flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-[#B89C14]" />
              Voice Dictation & Clinical Anamnesis Notes
            </h3>
            <p className="text-[11px] text-[#64748B] font-mono">
              Dictated qualitative observations saved into intake_questionnaires.voice_notes
            </p>
          </div>

          <button
            type="button"
            onClick={toggleVoiceDictation}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all border ${
              isListening
                ? 'bg-[#DC2626] text-white border-[#DC2626] animate-pulse ring-4 ring-[#DC2626]/20'
                : 'bg-[#FFE500] text-[#051A30] border-[#EAB308]'
            }`}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            <span>{isListening ? 'Listening...' : 'Voice Dictate'}</span>
          </button>
        </div>

        <textarea
          rows={3}
          value={voiceNotes}
          onChange={(e) => setVoiceNotes(e.target.value)}
          placeholder="Dictate or type qualitative anamnesis findings, patient-reported symptoms, or lifestyle flags..."
          className="w-full bg-[#F6F7FA] dark:bg-[#0F355A] text-xs rounded-xl border border-[#CBD5E1] dark:border-[#1B456E] p-3 text-[#051A30] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FFE500] font-sans leading-relaxed"
        />

        <div className="flex items-center justify-between pt-4 border-t border-[#F1F5F9] dark:border-[#1B456E]">
          <Button variant="outline" onClick={() => navigate(ROUTES.RECEPTIONIST.QUEUE)}>
            Skip / Return to Queue
          </Button>

          <Button
            variant="primary"
            size="lg"
            loading={loading}
            icon={CheckCircle2}
            onClick={handleSubmit}
            className="font-bold px-6"
          >
            Save Questionnaire & Transition to Doctor Queue
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default IntakeQuestionnairePage;
