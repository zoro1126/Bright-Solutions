import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { UserPlus, Clock, Stethoscope, ArrowRight, Printer } from 'lucide-react';
import { api } from '../../services/api';
import { Button, Card, StatCard, Badge, SimpleBarChart } from '../../components/ui';
import { ROUTES } from '../../routes';
import { PatientRegistrationModal } from './PatientRegistrationModal';

export function ReceptionistDashboardPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get('register') === 'true') {
      setIsRegisterModalOpen(true);
      // clean URL param
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const data = await api.getDashboardStats(controller.signal);
        setStats(data);
      } catch (err) {
        if (err.name !== 'AbortError') console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, []);

  const walkinChartData = (stats?.hourly_walkins || [
    { hour: '08:00', count: 3 },
    { hour: '09:00', count: 7 },
    { hour: '10:00', count: 12 },
    { hour: '11:00', count: 9 },
    { hour: '12:00', count: 5 },
    { hour: '13:00', count: 4 },
  ]).map((h) => ({
    label: h.hour,
    value: h.count,
    color: '#0A2540',
  }));

  const doctorBalanceData = (stats?.doctor_queue_balance || [
    { doctor_name: 'Dr. Kulkarni', patients: 6 },
    { doctor_name: 'Dr. Ananya', patients: 4 },
    { doctor_name: 'Dr. Priya', patients: 5 },
  ]).map((d) => ({
    label: d.doctor_name.replace('Dr. ', ''),
    value: d.patients,
    color: '#FFC21A',
  }));

  const handlePatientRegistered = (newPatient) => {
    setStats((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        today_visits: (prev.today_visits || 42) + 1,
        next_token: `Q-${parseInt(newPatient.token.replace(/\D/g, '') || 104) + 1}`,
        recent_patients: [
          {
            patient_id: newPatient.patient_id,
            uhid: newPatient.uhid,
            full_name: newPatient.full_name,
            gender: newPatient.gender,
            age: newPatient.age,
            queue_token: newPatient.token,
            systolic_bp: newPatient.systolic_bp,
            diastolic_bp: newPatient.diastolic_bp,
            bp_stage: newPatient.systolic_bp >= 140 ? 'Stage 2 Hypertension' : newPatient.systolic_bp >= 130 ? 'Stage 1 Hypertension' : 'Normal BP',
            pulse_rate: newPatient.pulse_rate,
            spo2_pct: newPatient.spo2_pct,
            doctor_name: newPatient.doctor_id === '3' ? 'Dr. Ananya Roy' : newPatient.doctor_id === '4' ? 'Dr. Priya Nair' : 'Dr. Vikram Kulkarni',
          },
          ...(prev.recent_patients || []),
        ],
      };
    });
  };

  return (
    <div className="space-y-4">
      {/* 1. NEXT ACTION HERO PANEL (Midnight Navy with Warm Amber CTA) */}
      <Card variant="dark" className="p-4 sm:p-5 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-lg bg-[#0F355A] border border-[#1B456E] text-[10px] font-mono text-[#38BDF8] mb-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
              Reception Desk 01 • Live OPD Session
            </div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white">
              Patient Intake & Triage Operations
            </h1>
            <p className="text-xs text-[#CBD5E1] mt-0.5 max-w-xl">
              Register walk-in patients, capture real-time biometrics, conduct standardized anamnesis screening, and balance consultation room loads.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              variant="primary"
              size="md"
              icon={UserPlus}
              onClick={() => setIsRegisterModalOpen(true)}
              className="bg-[#FFC21A] hover:bg-[#F5A300] text-[#0A2540] font-bold shadow-xs text-xs"
            >
              Register Walk-in Patient
            </Button>
          </div>
        </div>
      </Card>

      {/* 2. BENTO STAT CARDS ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Today Intake Volume"
          value={stats?.today_visits || 42}
          delta="+8 vs avg"
          deltaType="positive"
          helper="Total registered walk-ins today"
          icon={UserPlus}
        />
        <StatCard
          title="Next Token Preview"
          value={stats?.next_token || 'Q-104'}
          helper="Sequential walk-in token"
          icon={Clock}
        />
        <StatCard
          title="Average Triage Speed"
          value="3.2 mins"
          delta="-0.4m vs target"
          deltaType="positive"
          helper="Time per vital signs intake"
          icon={Clock}
        />
        <StatCard
          title="Active Doctors On-Duty"
          value={stats?.active_doctors || 4}
          helper="Cabins 01 to 04 operating"
          icon={Stethoscope}
        />
      </div>

      {/* 3. BENTO CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        {/* Hourly Velocity (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-[#0A2540] p-3.5 sm:p-4 rounded-2xl border border-[#E2E8F0] dark:border-[#1B456E] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-1.5 border-b border-[#F1F5F9] dark:border-[#1B456E]">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#0A2540] dark:text-white">
                Hourly Walk-in Velocity (08:00 – 14:00)
              </h3>
              <p className="text-[10px] text-[#64748B] font-mono">
                Patient arrivals per hour to anticipate lounge congestion
              </p>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#F1F5F9] dark:bg-[#0F355A] text-[#0A2540] dark:text-white">
              Peak: 10:00 AM
            </span>
          </div>
          <div className="pt-2">
            <SimpleBarChart data={walkinChartData} height={110} />
          </div>
        </div>

        {/* Doctor Queue Balance (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-[#0A2540] p-3.5 sm:p-4 rounded-2xl border border-[#E2E8F0] dark:border-[#1B456E] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-1.5 border-b border-[#F1F5F9] dark:border-[#1B456E]">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#0A2540] dark:text-white">
                Doctor Cabin Queue Balance
              </h3>
              <p className="text-[10px] text-[#64748B] font-mono">
                Active patients currently waiting per physician
              </p>
            </div>
          </div>
          <div className="pt-2">
            <SimpleBarChart data={doctorBalanceData} height={110} />
          </div>
        </div>
      </div>

      {/* 4. RECENT TRIAGE FEED TABLE */}
      <div className="bg-white dark:bg-[#0A2540] rounded-2xl border border-[#E2E8F0] dark:border-[#1B456E] shadow-xs overflow-hidden">
        <div className="px-4 py-2.5 border-b border-[#E2E8F0] dark:border-[#1B456E] flex items-center justify-between">
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-[#0A2540] dark:text-white">
              Recent Patient Intake Stream
            </h2>
            <p className="text-[11px] text-[#64748B] font-mono mt-0.5">
              Last registered walk-in encounters with baseline vitals
            </p>
          </div>
          <Button
            variant="outline"
            size="xs"
            onClick={() => navigate(ROUTES.RECEPTIONIST.QUEUE)}
            icon={ArrowRight}
            iconPosition="right"
          >
            Full Queue Roster
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E2E8F0] dark:border-[#1B456E] bg-[#F6F7FA]/75 dark:bg-[#0F355A]/50 text-[#64748B] font-mono uppercase text-[10px]">
                <th className="py-2 px-3">Token</th>
                <th className="py-2 px-3">Patient Name & UHID</th>
                <th className="py-2 px-3">Age / Sex</th>
                <th className="py-2 px-3">Blood Pressure</th>
                <th className="py-2 px-3">Pulse</th>
                <th className="py-2 px-3">SpO2</th>
                <th className="py-2 px-3">Assigned Doctor</th>
                <th className="py-2 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#1B456E]">
              {(stats?.recent_patients || [
                {
                  patient_id: 2,
                  uhid: 'UHID-2026-00002',
                  full_name: 'Ramesh Patel',
                  gender: 'MALE',
                  age: 50,
                  queue_token: 'Q-102',
                  systolic_bp: 138,
                  diastolic_bp: 88,
                  bp_stage: 'Stage 1 Hypertension',
                  pulse_rate: 76,
                  spo2_pct: 98,
                  doctor_name: 'Dr. Vikram Kulkarni',
                },
                {
                  patient_id: 4,
                  uhid: 'UHID-2026-00004',
                  full_name: 'Sunita Rao',
                  gender: 'FEMALE',
                  age: 62,
                  queue_token: 'Q-104',
                  systolic_bp: 168,
                  diastolic_bp: 98,
                  bp_stage: 'Stage 2 Hypertension',
                  pulse_rate: 88,
                  spo2_pct: 96,
                  doctor_name: 'Dr. Ananya Roy',
                },
              ]).map((p) => {
                const isStage2 = p.bp_stage?.includes('Stage 2');
                const isStage1 = p.bp_stage?.includes('Stage 1');
                const badgeVar = isStage2 ? 'stage2' : isStage1 ? 'stage1' : 'normal';

                return (
                  <tr key={p.queue_token} className="hover:bg-[#F6F7FA] dark:hover:bg-[#0F355A]/40 transition-colors">
                    <td className="py-2 px-3">
                      <span className="inline-flex items-center justify-center font-mono font-bold text-xs px-2.5 py-0.5 rounded-lg bg-[#0A2540] text-[#FFC21A] dark:bg-[#071D33] dark:text-[#FFC21A] border border-[#1B456E]">
                        #{p.queue_token}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <div className="font-bold text-[#051A30] dark:text-white">
                        {p.full_name}
                      </div>
                      <div className="font-mono text-[10px] text-[#64748B]">
                        {p.uhid}
                      </div>
                    </td>
                    <td className="py-2 px-3 font-mono text-[#64748B]">
                      {p.age}y / {p.gender?.[0]}
                    </td>
                    <td className="py-2 px-3 font-mono">
                      <div className="flex items-center gap-1.5">
                        <span>{p.systolic_bp}/{p.diastolic_bp}</span>
                        <Badge variant={badgeVar} size="xs">
                          {p.bp_stage}
                        </Badge>
                      </div>
                    </td>
                    <td className="py-2 px-3 font-mono">
                      {p.pulse_rate} bpm
                    </td>
                    <td className="py-2 px-3 font-mono">
                      {p.spo2_pct}%
                    </td>
                    <td className="py-2 px-3 text-[#0A2540] dark:text-[#CBD5E1]">
                      {p.doctor_name}
                    </td>
                    <td className="py-2 px-3 text-right">
                      <Button
                        variant="outline"
                        size="xs"
                        icon={Printer}
                        onClick={() => window.print()}
                      >
                        Print Slip
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pop-up Patient Registration Modal from Operations Command */}
      <PatientRegistrationModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSuccess={handlePatientRegistered}
      />
    </div>
  );
}

export default ReceptionistDashboardPage;
