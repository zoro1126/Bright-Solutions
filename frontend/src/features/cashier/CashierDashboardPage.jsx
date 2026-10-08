import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CreditCard,
  Receipt,
  Users,
  Clock,
  ArrowRight,
  TrendingUp,
  QrCode,
  DollarSign,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { StatCard } from '../../components/ui/StatCard';
import { SimpleDonutChart, SimpleBarChart } from '../../components/ui/ChartWrapper';
import { api } from '../../services/api';

export default function CashierDashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [queueData, setQueueData] = useState({ billing_queue: [] });

  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = async () => {
    setLoading(true);
    try {
      const data = await api.getCashierQueue();
      setQueueData(data || { billing_queue: [] });
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  const queue = queueData.billing_queue || [];

  const paymentModeData = [
    { label: 'UPI QR', value: 55, color: '#FFE500' },
    { label: 'Cash Tender', value: 35, color: '#10B981' },
    { label: 'Card / POS', value: 10, color: '#3B82F6' },
  ];

  const hourlyRevenueData = [
    { label: '09:00', value: 2400 },
    { label: '10:00', value: 4850 },
    { label: '11:00', value: 6200 },
    { label: '12:00', value: 3900 },
    { label: '13:00', value: 2100 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-navy-100 dark:border-navy-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-ochre-600 dark:text-ochre-400">
              P-CSH-01 • Cashier Operations
            </span>
            <Badge variant="navy" size="xs">Billing Counter 01</Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-navy-900 dark:text-white">
            Cashier Billing Operations Dashboard
          </h1>
          <p className="text-sm text-navy-500 dark:text-navy-400 mt-1">
            Welcome, Rahul Verma. Reconcile signed consultation invoices and tender collections.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadQueue}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Queue
          </Button>
        </div>
      </div>

      {/* KPI Bento Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Gross Shift Collections"
          value="₹ 14,850"
          change="+18% vs yesterday"
          icon={CreditCard}
          color="canary"
        />
        <StatCard
          title="Unbilled Queue"
          value={`${queue.length} Patients`}
          change="Awaiting settlement"
          icon={Users}
          color="ochre"
        />
        <StatCard
          title="Invoices Settled"
          value="18 Receipts"
          change="100% reconciliation"
          icon={Receipt}
          color="emerald"
        />
        <StatCard
          title="Avg Billing Speed"
          value="2.1 mins"
          change="Fast turnaround"
          icon={Clock}
          color="navy"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6">
          <SimpleDonutChart
            title="Revenue Split by Payment Mode"
            subtitle="Essential for drawer cash balancing and digital reconciliation"
            data={paymentModeData}
          />
        </div>

        <div className="lg:col-span-6">
          <SimpleBarChart
            title="Hourly Collections Intake (INR)"
            subtitle="Cashflow velocity across the morning OPD shift"
            data={hourlyRevenueData}
            barColor="#FFE500"
          />
        </div>
      </div>

      {/* Pending Billing Queue Table */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-navy-900 dark:text-white">
              Pending Billing Queue (Signed Consultations Ready)
            </h3>
            <p className="text-xs text-navy-500 dark:text-navy-400">
              Patients with signed doctor orders awaiting invoice itemization and tender capture.
            </p>
          </div>
          <Badge variant="canary" size="xs" className="font-mono font-bold">
            {queue.length} AWAITING CHECKOUT
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-navy-100 dark:border-navy-800 bg-navy-50/50 dark:bg-navy-900/50 text-navy-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Token</th>
                <th className="py-3 px-4">Patient Information</th>
                <th className="py-3 px-4">Attending Doctor</th>
                <th className="py-3 px-4">Payment Category</th>
                <th className="py-3 px-4">Estimated Net</th>
                <th className="py-3 px-4">Signed Since</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-100 dark:divide-navy-800">
              {queue.map((item) => (
                <tr
                  key={item.visit_id}
                  className="hover:bg-navy-50/50 dark:hover:bg-navy-800/40 transition-colors"
                >
                  <td className="py-3.5 px-4">
                    <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-lg bg-navy-900 text-canary-400">
                      {item.queue_token}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-navy-900 dark:text-white">
                      {item.patient_name}
                    </div>
                    <div className="font-mono text-[10px] text-navy-400">
                      {item.uhid}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-navy-700 dark:text-navy-300">
                    {item.doctor_name}
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge variant={item.insurance_category === 'CASH' ? 'navy' : 'ochre'} size="xs">
                      {item.insurance_category}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-navy-900 dark:text-white text-sm">
                    ₹ {item.subtotal.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-navy-500">
                    {item.ready_since}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Button
                      variant="primary"
                      size="xs"
                      onClick={() => navigate(`/cashier/billing/${item.visit_id}`)}
                      className="font-bold inline-flex items-center gap-1.5"
                    >
                      Itemize Bill
                      <ArrowRight className="w-3.5 h-3.5 text-navy-950" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
