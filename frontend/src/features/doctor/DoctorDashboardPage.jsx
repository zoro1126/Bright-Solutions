import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  Clock,
  CheckCircle2,
  PhoneCall,
  Activity,
  Heart,
  ChevronRight,
  ShieldAlert,
  ArrowUpRight,
  MoreVertical,
  Calendar,
  FileText,
  UserCheck,
  Stethoscope,
  Filter,
  Eye
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { StatCard } from '../../components/ui/StatCard';
import { ChartWrapper, SimpleBarChart, SimpleDonutChart } from '../../components/ui/ChartWrapper';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../app/AuthContext';
import { api } from '../../services/api';

export default function DoctorDashboardPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { role, switchRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [calling, setCalling] = useState(false);
  const [queueData, setQueueData] = useState({ queue: [] });

  useEffect(() => {
    if (role !== 'DOCTOR') {
      switchRole('DOCTOR');
    }
    loadQueue();
  }, []);

  const loadQueue = async () => {
    setLoading(true);
    try {
      const data = await api.getDoctorQueue();
      setQueueData(data || { queue: [] });
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  const queueList = queueData.queue || [];
  const nextPatient = queueList[0];

  const handleCallPatient = async (visitId) => {
    setCalling(true);
    try {
      await api.callDoctorPatient(visitId);
      addToast({
        type: 'success',
        title: 'Patient Called',
        message: `Token #${nextPatient?.queue_token || 'Q-102'} called into consultation room.`,
      });
      navigate(`/doctor/consultation/${visitId}`);
    } catch {
      navigate(`/doctor/consultation/${visitId}`);
    } finally {
      setCalling(false);
    }
  };

  // Grouped Bar Chart Data (Walk-in cases by age/category)
  const topDiagnosesData = [
    { label: 'Mon', value: 14, value2: 8 },
    { label: 'Tue', value: 18, value2: 12 },
    { label: 'Wed', value: 16, value2: 10 },
    { label: 'Thu', value: 20, value2: 14 },
    { label: 'Fri', value: 15, value2: 9 },
    { label: 'Sat', value: 22, value2: 16 },
    { label: 'Sun', value: 8, value2: 5 },
  ];

  // Triage Risk Donut Data with exact color mapping
  const triageDonutData = [
    { label: 'Normal BP', value: 6, color: '#10B981' },
    { label: 'Elevated BP', value: 2, color: '#FFC21A' },
    { label: 'Stage 1 HTN', value: 3, color: '#B89C14' },
    { label: 'Stage 2 HTN', value: 1, color: '#DC2626' },
  ];

  // Active Doctors Roster for Right Rail
  const doctorsSchedule = [
    { name: 'Dr. Vikram Kulkarni', specialty: 'Internal Medicine', status: 'Available', isAvailable: true },
    { name: 'Dr. Ananya Roy', specialty: 'Cardiology', status: 'Available', isAvailable: true },
    { name: 'Dr. Priya Nair', specialty: 'Pulmonology', status: 'Unavailable', isAvailable: false },
  ];

  // Recent Clinical Activity
  const recentActivity = [
    { text: 'Walk-in profile created #Q-104 (Sunita Rao)', time: '6m ago', icon: Users },
    { text: 'Consultation completed #Q-101 (Ananya S.)', time: '18m ago', icon: CheckCircle2 },
    { text: 'DICOM Brain MRI reviewed for #Q-102', time: '34m ago', icon: Activity },
    { text: 'Vitals captured: BP 138/88 mmHg', time: '45m ago', icon: Heart },
  ];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
      {/* --- MAIN CENTER CONTENT (8 or 9 cols on xl) --- */}
      <div className="xl:col-span-8 2xl:col-span-9 space-y-6 min-w-0">
        {/* Next Patient Feature Card (Navy panel with warm amber CTA) */}
        {nextPatient && (
          <Card
            variant="dark"
            className="p-6 bg-[#0A2540] text-white border-0 shadow-sm relative overflow-hidden"
          >
            {/* Subtle radial warmth glow in corner */}
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-[#FFC21A]/10 to-transparent pointer-events-none" />

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <span className="bg-[#FFC21A] text-[#0A2540] text-xs font-black font-mono px-3 py-1 rounded-full uppercase tracking-wider">
                    NEXT IN LINE • {nextPatient.queue_token}
                  </span>
                  <span className="font-mono text-xs text-[#94A3B8]">
                    {nextPatient.uhid}
                  </span>
                  <span className="text-xs text-[#94A3B8] flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {nextPatient.wait_duration}
                  </span>
                </div>

                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-white font-sans">
                    {nextPatient.full_name}
                  </h2>
                  <p className="text-xs text-[#CBD5E1] mt-0.5">
                    {nextPatient.age} Y • {nextPatient.gender} • Chief Complaint:{' '}
                    <span className="text-[#FFE08A] font-semibold">"{nextPatient.chief_complaint}"</span>
                  </p>
                </div>

                {/* Vitals Summary Strip */}
                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  <div className="px-3 py-1.5 rounded-xl bg-[#0F355A] border border-[#1B456E] flex items-center gap-2 text-xs font-mono">
                    <Activity className="w-3.5 h-3.5 text-[#FFC21A]" />
                    <span>BP: <strong className="text-white">{nextPatient.triage_summary.bp}</strong> mmHg</span>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-[#0F355A] border border-[#1B456E] flex items-center gap-2 text-xs font-mono">
                    <Heart className="w-3.5 h-3.5 text-[#DC2626]" />
                    <span>Pulse: <strong className="text-white">{nextPatient.triage_summary.pulse}</strong> bpm</span>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-[#0F355A] border border-[#1B456E] flex items-center gap-2 text-xs font-mono">
                    <span>SpO2: <strong className="text-white">{nextPatient.triage_summary.spo2}%</strong></span>
                  </div>
                  <Badge variant={nextPatient.triage_summary.bp_stage?.includes('Stage 2') ? 'crisis' : 'scheduled'} size="xs">
                    {nextPatient.triage_summary.bp_stage}
                  </Badge>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 lg:shrink-0">
                <button
                  type="button"
                  onClick={() => navigate(`/doctor/patient/${nextPatient.patient_id}`)}
                  className="px-5 py-2.5 rounded-full bg-[#0F355A] hover:bg-[#1B456E] text-white border border-[#1B456E] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                >
                  <FileText className="w-4 h-4 text-[#FFC21A]" />
                  <span>View Dossier</span>
                </button>
                <Button
                  variant="primary"
                  size="md"
                  pill
                  loading={calling}
                  onClick={() => handleCallPatient(nextPatient.visit_id)}
                  className="font-bold text-xs px-6 shadow-sm shadow-[#FFC21A]/20"
                >
                  <PhoneCall className="w-4 h-4 mr-1.5 text-[#0A2540] stroke-[2.5]" />
                  Call into Room
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* 3 KPI Cards Row (Exact Reference Structure) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <StatCard
            title="Waiting in Lounge"
            value={`${queueList.length} Patients`}
            delta="+1 vs yesterday"
            deltaType="positive"
            icon={Users}
          />
          <StatCard
            title="Completed Consults"
            value="12 Done"
            delta="92% daily target"
            deltaType="positive"
            icon={CheckCircle2}
          />
          <StatCard
            title="Avg Consultation Time"
            value="10.4 mins"
            delta="Optimal pacing"
            deltaType="neutral"
            icon={Clock}
          />
        </div>

        {/* Charts Row: Grouped Bar Chart & Centered Donut */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Grouped Bar Chart (7 cols) */}
          <div className="lg:col-span-7">
            <ChartWrapper
              title="OPD Patient Consultations"
              subtitle="Weekly walk-in volume by clinical urgency"
              period="This Week"
            >
              <SimpleBarChart
                data={topDiagnosesData}
                barColor="#0A2540"
                secondaryColor="#FFC21A"
                legend={[
                  { label: 'General Medicine', color: '#0A2540' },
                  { label: 'Cardiology Review', color: '#FFC21A' },
                ]}
              />
            </ChartWrapper>
          </div>

          {/* Centered Total Donut Chart (5 cols) */}
          <div className="lg:col-span-5">
            <ChartWrapper
              title="Triage Risk Breakdown"
              subtitle="AHA blood pressure stratification"
              period="Today"
            >
              <SimpleDonutChart
                data={triageDonutData}
                totalLabel="Total Triage"
                size={160}
                strokeWidth={20}
              />
            </ChartWrapper>
          </div>
        </div>

        {/* Prioritized Patient Queue Table (Exact Reference Data Table) */}
        <Card className="p-6 bg-white dark:bg-[#0A2540] border border-[#EAE4D3] dark:border-[#1B456E]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-base font-bold text-[#0A2540] dark:text-white tracking-tight font-sans">
                Prioritized Patient Roster
              </h3>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                Sorted by hemodynamic acuity and arrival sequence.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 rounded-full bg-[#FAF6EC] dark:bg-[#0F355A] border border-[#EAE4D3] dark:border-[#1B456E] text-xs font-semibold text-[#0A2540] dark:text-[#E2E8F0]">
                {queueList.length} Active in Queue
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FAF6EC] dark:bg-[#0F355A] text-[#64748B] dark:text-[#94A3B8]">
                  <th className="py-3 px-4 rounded-l-2xl text-xs font-semibold w-8">
                    <input type="checkbox" className="rounded accent-[#FFC21A]" />
                  </th>
                  <th className="py-3 px-4 text-xs font-semibold">Patient Name & UHID</th>
                  <th className="py-3 px-4 text-xs font-semibold">Chief Complaint</th>
                  <th className="py-3 px-4 text-xs font-semibold">Vitals (BP / Pulse)</th>
                  <th className="py-3 px-4 text-xs font-semibold">AHA Stage</th>
                  <th className="py-3 px-4 text-xs font-semibold">Wait Time</th>
                  <th className="py-3 px-4 text-xs font-semibold">Status</th>
                  <th className="py-3 px-4 rounded-r-2xl text-right text-xs font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE4D3] dark:divide-[#1B456E] text-xs">
                {queueList.map((pt) => {
                  const isCrisis = pt.triage_summary.bp_stage?.includes('Stage 2');
                  return (
                    <tr
                      key={pt.visit_id}
                      className="hover:bg-[#FAF6EC]/60 dark:hover:bg-[#0F355A]/40 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <input type="checkbox" className="rounded accent-[#FFC21A]" />
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-bold text-[#0A2540] dark:text-white font-sans">
                          {pt.full_name}
                        </div>
                        <div className="font-mono text-[10px] text-[#94A3B8]">
                          {pt.uhid} • {pt.age}Y/{pt.gender}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-[#64748B] dark:text-[#CBD5E1] max-w-xs truncate">
                        {pt.chief_complaint}
                      </td>
                      <td className="py-4 px-4 font-mono font-bold text-[#0A2540] dark:text-white">
                        {pt.triage_summary.bp}{' '}
                        <span className="text-[10px] font-normal text-[#94A3B8]">({pt.triage_summary.pulse} bpm)</span>
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant={isCrisis ? 'crisis' : 'scheduled'} size="xs">
                          {pt.triage_summary.bp_stage}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 font-mono text-[#64748B] dark:text-[#CBD5E1]">
                        {pt.wait_duration}
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant="waiting" size="xs">
                          {pt.status}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="primary"
                            size="xs"
                            pill
                            onClick={() => handleCallPatient(pt.visit_id)}
                            className="text-[11px] font-bold"
                          >
                            Call
                          </Button>
                          <button
                            type="button"
                            onClick={() => navigate(`/doctor/patient/${pt.patient_id}`)}
                            className="p-1 rounded-lg text-[#94A3B8] hover:text-[#0A2540] transition-colors"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* --- RIGHT RAIL ON DASHBOARD (Exact Medlink Reference) --- */}
      <div className="xl:col-span-4 2xl:col-span-3 space-y-6">
        {/* Doctors' Schedule / Roster Widget */}
        <Card className="p-6 bg-white dark:bg-[#0A2540] border border-[#EAE4D3] dark:border-[#1B456E]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-[#0A2540] dark:text-white tracking-tight">
              Doctors' Schedule
            </h3>
            <button type="button" className="text-[#94A3B8] hover:text-[#0A2540]">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>

          {/* 3-Number Summary Row */}
          <div className="grid grid-cols-3 gap-2 py-3 px-3 rounded-2xl bg-[#FAF6EC] dark:bg-[#0F355A] text-center mb-4">
            <div>
              <div className="text-lg font-extrabold text-[#0A2540] dark:text-white font-sans tabular-nums">3</div>
              <div className="text-[10px] text-[#64748B] font-medium">All Doctor</div>
            </div>
            <div>
              <div className="text-lg font-extrabold text-[#047857] font-sans tabular-nums">2</div>
              <div className="text-[10px] text-[#64748B] font-medium">Available</div>
            </div>
            <div>
              <div className="text-lg font-extrabold text-[#DC2626] font-sans tabular-nums">1</div>
              <div className="text-[10px] text-[#64748B] font-medium">Unavailable</div>
            </div>
          </div>

          {/* Doctor List with Availability Pills */}
          <div className="space-y-3.5">
            {doctorsSchedule.map((doc, idx) => (
              <div key={idx} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-[#0A2540] text-white flex items-center justify-center font-bold text-xs shrink-0">
                    {doc.name.charAt(4)}
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-bold text-[#0A2540] dark:text-white truncate">
                      {doc.name}
                    </div>
                    <div className="text-[11px] text-[#64748B] truncate">
                      {doc.specialty}
                    </div>
                  </div>
                </div>

                <Badge variant={doc.isAvailable ? 'completed' : 'canceled'} size="xs">
                  {doc.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Activity Stream Widget */}
        <Card className="p-6 bg-white dark:bg-[#0A2540] border border-[#EAE4D3] dark:border-[#1B456E]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-[#0A2540] dark:text-white tracking-tight">
              Recent Activity
            </h3>
            <button type="button" className="text-[#94A3B8] hover:text-[#0A2540]">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            {recentActivity.map((act, idx) => {
              const Icon = act.icon;
              return (
                <div key={idx} className="flex items-start gap-3 text-xs">
                  <div className="w-8 h-8 rounded-full bg-[#FAF6EC] dark:bg-[#0F355A] text-[#0A2540] dark:text-[#FFC21A] flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[#0A2540] dark:text-[#E2E8F0] font-medium leading-snug">
                      {act.text}
                    </p>
                    <span className="text-[10px] text-[#94A3B8] font-mono mt-0.5 block">
                      {act.time}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
