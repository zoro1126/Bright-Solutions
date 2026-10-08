import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  Clock,
  AlertTriangle,
  CheckCircle2,
  PhoneCall,
  Activity,
  ArrowUpRight,
  Stethoscope,
  Heart,
  ChevronRight,
  ShieldAlert,
  Flame
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { StatCard } from '../../components/ui/StatCard';
import { SimpleDonutChart, SimpleBarChart } from '../../components/ui/ChartWrapper';
import { useToast } from '../../components/ui/Toast';
import { api } from '../../services/api';

export default function DoctorDashboardPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [calling, setCalling] = useState(false);
  const [queueData, setQueueData] = useState({ queue: [] });

  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = async () => {
    setLoading(true);
    try {
      const data = await api.getDoctorQueue();
      setQueueData(data || { queue: [] });
    } catch {
      // handled by fallback
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
        message: `Token #${nextPatient?.queue_token || 'Q-102'} summoned to consultation cabin.`,
      });
      navigate(`/doctor/consultation/${visitId}`);
    } catch {
      navigate(`/doctor/consultation/${visitId}`);
    } finally {
      setCalling(false);
    }
  };

  const triageDonutData = [
    { label: 'Normal BP', value: 60, color: '#10B981' },
    { label: 'Elevated BP', value: 15, color: '#F59E0B' },
    { label: 'Stage 1 HTN', value: 20, color: '#F97316' },
    { label: 'Stage 2 HTN', value: 5, color: '#DC2626' },
  ];

  const topDiagnosesData = [
    { label: 'Hypertension', value: 14 },
    { label: 'Type 2 DM', value: 10 },
    { label: 'Viral URI', value: 8 },
    { label: 'Dyspepsia', value: 5 },
    { label: 'Allergic Rhinitis', value: 4 },
  ];

  return (
    <div className="space-y-6">
      {/* Page Title & Active Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-navy-100 dark:border-navy-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-ochre-600 dark:text-ochre-400">
              P-DOC-01 • Physician Cockpit
            </span>
            <Badge variant="navy" size="xs">Cabin 01 • Internal Medicine</Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-navy-900 dark:text-white">
            Physician Clinical Dashboard
          </h1>
          <p className="text-sm text-navy-500 dark:text-navy-400 mt-1">
            Welcome, Dr. Vikram Kulkarni, MD. Monitor triage backlog and prioritize acute hemodynamic cases.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="emerald" size="sm" className="font-mono flex items-center gap-1.5 py-1 px-3">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            CONSULTATION ACTIVE
          </Badge>
        </div>
      </div>

      {/* Hero Next Patient Call Card */}
      {nextPatient ? (
        <Card className="p-6 bg-gradient-to-br from-navy-900 via-navy-900 to-navy-800 text-white border-0 shadow-lg relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-canary-400/10 to-transparent pointer-events-none" />
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Badge variant="canary" size="sm" className="font-mono font-bold tracking-wider">
                  NEXT IN LINE • {nextPatient.queue_token}
                </Badge>
                <span className="font-mono text-xs text-navy-300">
                  {nextPatient.uhid}
                </span>
                <span className="text-xs text-navy-400">
                  Waited: {nextPatient.wait_duration}
                </span>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  {nextPatient.full_name}
                </h2>
                <p className="text-sm text-navy-200 mt-0.5">
                  {nextPatient.age} Y • {nextPatient.gender} • Chief Complaint:{' '}
                  <span className="text-canary-300 font-medium">"{nextPatient.chief_complaint}"</span>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <div className="px-3 py-1.5 rounded-xl bg-navy-800/80 border border-navy-700 flex items-center gap-2 text-xs font-mono">
                  <Activity className="w-4 h-4 text-ochre-400" />
                  <span>BP: <strong>{nextPatient.triage_summary.bp}</strong> mmHg</span>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-navy-800/80 border border-navy-700 flex items-center gap-2 text-xs font-mono">
                  <Heart className="w-4 h-4 text-red-400" />
                  <span>Pulse: <strong>{nextPatient.triage_summary.pulse}</strong> bpm</span>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-navy-800/80 border border-navy-700 flex items-center gap-2 text-xs font-mono">
                  <span>SpO2: <strong>{nextPatient.triage_summary.spo2}%</strong></span>
                </div>
                <Badge variant={nextPatient.triage_summary.bp_stage?.includes('Stage 2') ? 'red' : 'amber'} size="xs">
                  {nextPatient.triage_summary.bp_stage}
                </Badge>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 lg:shrink-0">
              <Button
                variant="secondary"
                size="md"
                onClick={() => navigate(`/doctor/patient/${nextPatient.patient_id}`)}
                className="bg-navy-800 hover:bg-navy-700 text-white border-navy-700"
              >
                Inspect Longitudinal Dossier
              </Button>
              <Button
                variant="primary"
                size="lg"
                loading={calling}
                onClick={() => handleCallPatient(nextPatient.visit_id)}
                className="flex items-center gap-2 font-bold px-6 shadow-md shadow-canary-500/20"
              >
                <PhoneCall className="w-5 h-5 text-navy-950" />
                Call Patient Into Room
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-6 text-center text-navy-500">
          No patients waiting in queue.
        </Card>
      )}

      {/* KPI Bento Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Waiting Outside"
          value={queueList.length}
          change="3 in lounge"
          icon={Users}
          color="ochre"
        />
        <StatCard
          title="Completed Today"
          value="12"
          change="92% target"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Avg Consult Time"
          value="10.4 min"
          change="Pacing steady"
          icon={Clock}
          color="navy"
        />
        <StatCard
          title="Triage Alerts"
          value="2 Alerts"
          change="Critical vitals"
          icon={ShieldAlert}
          color="red"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6">
          <SimpleDonutChart
            title="Triage Risk Stratification"
            subtitle="Distribution of hemodynamic severity in today's OPD cases"
            data={triageDonutData}
          />
        </div>

        <div className="lg:col-span-6">
          <SimpleBarChart
            title="Top Clinical Diagnoses"
            subtitle="Most frequent clinical presentations in Dr. Kulkarni's OPD"
            data={topDiagnosesData}
            barColor="#B89C14"
          />
        </div>
      </div>

      {/* Prioritized Patient Queue Table */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-navy-900 dark:text-white">
              My OPD Consultation Roster
            </h3>
            <p className="text-xs text-navy-500 dark:text-navy-400">
              Sorted by clinical urgency and triage arrival sequence.
            </p>
          </div>
          <Badge variant="navy" size="xs" className="font-mono">
            {queueList.length} PENDING
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-navy-100 dark:border-navy-800 bg-navy-50/50 dark:bg-navy-900/50 text-navy-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Token</th>
                <th className="py-3 px-4">Patient Information</th>
                <th className="py-3 px-4">Chief Complaint</th>
                <th className="py-3 px-4">Hemodynamic Vitals</th>
                <th className="py-3 px-4">AHA BP Stage</th>
                <th className="py-3 px-4">Wait</th>
                <th className="py-3 px-4 text-right">Consultation Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-100 dark:divide-navy-800">
              {queueList.map((pt, idx) => {
                const isHighRisk = pt.triage_summary.bp_stage?.includes('Stage 2') || pt.triage_summary.pulse > 100;
                return (
                  <tr
                    key={pt.visit_id}
                    className={`transition-colors ${
                      isHighRisk
                        ? 'bg-red-50/30 dark:bg-red-950/20 hover:bg-red-50/50'
                        : 'hover:bg-navy-50/50 dark:hover:bg-navy-800/40'
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-lg bg-navy-900 text-canary-400">
                        {pt.queue_token}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-navy-900 dark:text-white">
                        {pt.full_name}
                      </div>
                      <div className="text-[10px] font-mono text-navy-400">
                        {pt.uhid} • {pt.age}Y / {pt.gender}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-navy-700 dark:text-navy-300 max-w-xs truncate">
                      {pt.chief_complaint}
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      <span className="font-semibold text-navy-900 dark:text-white">
                        {pt.triage_summary.bp}
                      </span>
                      <span className="text-[10px] text-navy-400 ml-1">
                        ({pt.triage_summary.pulse} bpm)
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={isHighRisk ? 'red' : 'amber'}
                        size="xs"
                      >
                        {pt.triage_summary.bp_stage}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-navy-500">
                      {pt.wait_duration}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => navigate(`/doctor/patient/${pt.patient_id}`)}
                        >
                          Dossier
                        </Button>
                        <Button
                          variant="primary"
                          size="xs"
                          onClick={() => handleCallPatient(pt.visit_id)}
                          className="font-bold"
                        >
                          Call Now
                        </Button>
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
  );
}
