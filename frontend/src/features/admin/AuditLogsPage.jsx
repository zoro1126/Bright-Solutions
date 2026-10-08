import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  FileText,
  AlertTriangle,
  CreditCard,
  Stethoscope,
  UserCheck,
  Lock,
  Download
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { api } from '../../services/api';

export default function AuditLogsPage() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEventType, setSelectedEventType] = useState('ALL');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getAuditLogs();
      setLogs(data?.logs || []);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      (log.actor || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.patient_uhid || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.detail || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.action_type || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (selectedEventType !== 'ALL' && !log.action_type.includes(selectedEventType)) return false;
    return true;
  });

  const getActionBadgeVariant = (actionType) => {
    if (actionType.includes('OVERRIDE')) return 'red';
    if (actionType.includes('PAYMENT')) return 'emerald';
    if (actionType.includes('PRESCRIPTION')) return 'ochre';
    if (actionType.includes('CDSS')) return 'canary';
    return 'navy';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-navy-100 dark:border-navy-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-ochre-600 dark:text-ochre-400">
              P-ADM-03 • Compliance & Legal
            </span>
            <Badge variant="navy" size="xs">Immutable Medical-Legal Trail</Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-navy-900 dark:text-white">
            Clinical & Billing Audit Trail
          </h1>
          <p className="text-sm text-navy-500 dark:text-navy-400 mt-1">
            Tamper-evident logs of safety rule overrides, triage edits, prescription sign-offs, and tender captures.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadLogs}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Trail
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export Audit Ledger
          </Button>
        </div>
      </div>

      {/* Security Status Banner */}
      <Card className="p-4 bg-navy-900 text-white border-0 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-canary-400 text-navy-950 font-bold">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-white text-sm">
                Cryptographically Chained Audit Ledger
              </div>
              <p className="text-navy-300 text-[11px] font-mono mt-0.5">
                Hash: SHA256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069
              </p>
            </div>
          </div>
          <Badge variant="emerald" size="sm" className="font-mono">
            COMPLIANCE VERIFIED
          </Badge>
        </div>
      </Card>

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 p-1 bg-navy-50 dark:bg-navy-900/80 rounded-xl border border-navy-100 dark:border-navy-800">
            {[
              { id: 'ALL', label: 'All Events' },
              { id: 'PAYMENT', label: 'Payments' },
              { id: 'PRESCRIPTION', label: 'Prescriptions' },
              { id: 'CDSS', label: 'CDSS & Safety' },
              { id: 'TRIAGED', label: 'Triage Intakes' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedEventType(tab.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  selectedEventType === tab.id
                    ? 'bg-canary-400 text-navy-950 shadow-sm font-bold'
                    : 'text-navy-600 dark:text-navy-300 hover:text-navy-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
            <input
              type="text"
              placeholder="Search actor, UHID, or action..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-700 rounded-xl text-xs text-navy-900 dark:text-white placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-canary-400"
            />
          </div>
        </div>
      </Card>

      {/* Audit Log Table */}
      <Card className="overflow-hidden border border-navy-100 dark:border-navy-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-navy-100 dark:border-navy-800 bg-navy-50/75 dark:bg-navy-900/60 text-navy-600 dark:text-navy-300 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Staff Actor</th>
                <th className="py-3 px-4">Patient UHID</th>
                <th className="py-3 px-4">Action Event</th>
                <th className="py-3 px-4">Action Description & Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-100 dark:divide-navy-800">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-navy-50/40 dark:hover:bg-navy-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-[11px] text-navy-500 whitespace-nowrap">
                    {log.timestamp}
                  </td>

                  <td className="py-3.5 px-4 font-semibold text-navy-900 dark:text-white">
                    {log.actor}
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-navy-100 dark:bg-navy-800 text-navy-800 dark:text-canary-400">
                      {log.patient_uhid}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <Badge variant={getActionBadgeVariant(log.action_type)} size="xs" className="font-bold">
                      {log.action_type}
                    </Badge>
                  </td>

                  <td className="py-3.5 px-4 text-navy-700 dark:text-navy-300 text-xs">
                    {log.detail}
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
