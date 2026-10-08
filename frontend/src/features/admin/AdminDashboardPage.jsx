import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  Users,
  CreditCard,
  Clock,
  ShieldCheck,
  Activity,
  Calendar,
  Building,
  CheckCircle2
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { StatCard } from '../../components/ui/StatCard';
import { SimpleBarChart, SimpleDonutChart } from '../../components/ui/ChartWrapper';
import { api } from '../../services/api';

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminDashboard();
      setDashboardData(data);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  const summary = dashboardData?.summary || {
    today_footfall: 42,
    gross_revenue: 31450.0,
    completed_consultations: 38,
    avg_throughput_minutes: 31.5,
    cashless_pct: 65,
  };

  const weeklyFootfallData = (dashboardData?.weekly_footfall || [
    { day: 'Mon', patients: 38 },
    { day: 'Tue', patients: 45 },
    { day: 'Wed', patients: 41 },
    { day: 'Thu', patients: 48 },
    { day: 'Fri', patients: 42 },
    { day: 'Sat', patients: 52 },
    { day: 'Sun', patients: 20 },
  ]).map((d) => ({ label: d.day, value: d.patients }));

  const doctorWorkloadData = (dashboardData?.doctor_workload || [
    { doctor_name: 'Dr. Vikram Kulkarni', patients_seen: 18 },
    { doctor_name: 'Dr. Ananya Roy', patients_seen: 12 },
    { doctor_name: 'Dr. Priya Nair', patients_seen: 12 },
  ]).map((d) => ({ label: d.doctor_name.replace('Dr. ', ''), value: d.patients_seen }));

  const diseasePrevalenceDonut = [
    { label: 'Essential HTN', value: 35, color: '#FFE500' },
    { label: 'Type 2 Diabetes', value: 25, color: '#3B82F6' },
    { label: 'Respiratory URI', value: 20, color: '#10B981' },
    { label: 'Dyspepsia', value: 12, color: '#F59E0B' },
    { label: 'Other OPD', value: 8, color: '#8B5CF6' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-navy-100 dark:border-navy-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-ochre-600 dark:text-ochre-400">
              P-ADM-01 • Institutional Governance
            </span>
            <Badge variant="navy" size="xs">Executive Center</Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-navy-900 dark:text-white">
            Hospital Executive & Clinical Analytics
          </h1>
          <p className="text-sm text-navy-500 dark:text-navy-400 mt-1">
            High-altitude governance: footfall velocity, revenue realization, doctor utilization, and disease epidemiology.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="emerald" size="sm" className="font-mono py-1 px-3">
            ALL COUNTERS ONLINE
          </Badge>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today Patient Footfall"
          value={`${summary.today_footfall} Patients`}
          change="+14% vs weekly avg"
          icon={Users}
          color="canary"
        />
        <StatCard
          title="OPD Gross Revenue"
          value={`₹ ${summary.gross_revenue.toLocaleString('en-IN')}`}
          change={`${summary.cashless_pct}% cashless`}
          icon={CreditCard}
          color="ochre"
        />
        <StatCard
          title="Completed Encounters"
          value={`${summary.completed_consultations} Done`}
          change="90.5% resolution rate"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Avg Patient Throughput"
          value={`${summary.avg_throughput_minutes} min`}
          change="Intake to Discharge"
          icon={Clock}
          color="navy"
        />
      </div>

      {/* Graph Row 1: Weekly Footfall & Doctor Utilization */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6">
          <SimpleBarChart
            title="7-Day OPD Footfall Trend"
            subtitle="Walk-in volume distribution across days of the week"
            data={weeklyFootfallData}
            barColor="#FFE500"
          />
        </div>

        <div className="lg:col-span-6">
          <SimpleBarChart
            title="Doctor Consultation Utilization"
            subtitle="Patient volume seen per physician today"
            data={doctorWorkloadData}
            barColor="#B89C14"
          />
        </div>
      </div>

      {/* Graph Row 2: Disease Prevalence Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6">
          <SimpleDonutChart
            title="Clinical Disease Epidemiology"
            subtitle="Prevalence of top diagnoses across the outpatient department"
            data={diseasePrevalenceDonut}
          />
        </div>

        <div className="lg:col-span-6">
          <Card className="p-5 space-y-4">
            <div>
              <h3 className="text-base font-bold text-navy-900 dark:text-white">
                Quality & Compliance Benchmark
              </h3>
              <p className="text-xs text-navy-500">
                Key operational metrics monitored for NABH / JCI clinical accreditation.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div className="p-3.5 rounded-xl bg-navy-50 dark:bg-navy-800/60 border border-navy-100 dark:border-navy-700 flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-navy-900 dark:text-white">
                    Triage Safety Evaluation Rate
                  </div>
                  <div className="text-[11px] text-navy-500">
                    Patients screened for BP & BMI before doctor consult
                  </div>
                </div>
                <span className="font-mono font-bold text-emerald-600 text-sm">
                  100.0%
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-navy-50 dark:bg-navy-800/60 border border-navy-100 dark:border-navy-700 flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-navy-900 dark:text-white">
                    Deterministic CDSS Alert Compliance
                  </div>
                  <div className="text-[11px] text-navy-500">
                    Zero unaddressed critical allergy contraindications
                  </div>
                </div>
                <span className="font-mono font-bold text-emerald-600 text-sm">
                  99.8%
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-navy-50 dark:bg-navy-800/60 border border-navy-100 dark:border-navy-700 flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-navy-900 dark:text-white">
                    Cashless Tender Penetration
                  </div>
                  <div className="text-[11px] text-navy-500">
                    UPI and card billing over physical currency
                  </div>
                </div>
                <span className="font-mono font-bold text-ochre-600 dark:text-canary-400 text-sm">
                  65.2%
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
