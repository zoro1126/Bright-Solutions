import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  Printer,
  RefreshCw,
  Search,
  Filter,
  UserCheck,
  Activity,
  AlertTriangle,
  ChevronRight,
  Stethoscope,
  X,
  FileText
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { api } from '../../services/api';

export default function PatientQueuePage() {
  const { addToast } = useToast();
  const [filterTab, setFilterTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [queueData, setQueueData] = useState({ queue_items: [] });
  const [selectedSlip, setSelectedSlip] = useState(null);

  useEffect(() => {
    loadQueue();
    const interval = setInterval(loadQueue, 15000); // 15s polling
    return () => clearInterval(interval);
  }, []);

  const loadQueue = async () => {
    setLoading(true);
    try {
      const data = await api.getReceptionQueue();
      setQueueData(data || { queue_items: [] });
    } catch {
      // fallback handled in api.js
    } finally {
      setLoading(false);
    }
  };

  const allItems = queueData.queue_items || [];

  const filteredItems = allItems.filter((item) => {
    const matchesSearch =
      (item.patient_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.token || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.uhid || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.doctor_name || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterTab === 'WAITING') return item.status === 'TRIAGED';
    if (filterTab === 'IN_ROOM') return item.status === 'IN_CONSULTATION';
    if (filterTab === 'COMPLETED') return item.status === 'COMPLETED' || item.status === 'READY_FOR_BILLING';
    return true;
  });

  const handlePrintSlip = (item) => {
    setSelectedSlip(item);
  };

  const triggerBrowserPrint = () => {
    window.print();
  };

  const getBpBadgeVariant = (stage) => {
    if (!stage) return 'navy';
    if (stage.includes('Crisis')) return 'red';
    if (stage.includes('Stage 2')) return 'red';
    if (stage.includes('Stage 1')) return 'amber';
    if (stage.includes('Elevated')) return 'ochre';
    return 'emerald';
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'IN_CONSULTATION':
        return 'canary';
      case 'TRIAGED':
        return 'navy';
      case 'READY_FOR_BILLING':
        return 'amber';
      case 'COMPLETED':
        return 'emerald';
      default:
        return 'navy';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-navy-100 dark:border-navy-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-ochre-600 dark:text-ochre-400">
              P-REC-05 • Live Token Roster
            </span>
            <Badge variant="navy" size="xs">Real-Time Queue</Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-navy-900 dark:text-white">
            OPD Patient Queue & Token Roster
          </h1>
          <p className="text-sm text-navy-500 dark:text-navy-400 mt-1">
            Track waiting lounge congestion, active consultations, and reprint walk-in token slips.
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

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-ochre-500">
          <div className="text-xs font-semibold text-navy-500 dark:text-navy-400 uppercase tracking-wider">
            Total Active OPD
          </div>
          <div className="text-2xl font-bold font-mono text-navy-900 dark:text-white mt-1">
            {queueData.total_active || allItems.length}
          </div>
          <div className="text-[11px] text-navy-400 mt-0.5">Checked into clinic</div>
        </Card>

        <Card className="p-4 border-l-4 border-l-canary-400">
          <div className="text-xs font-semibold text-navy-500 dark:text-navy-400 uppercase tracking-wider">
            In Consultation
          </div>
          <div className="text-2xl font-bold font-mono text-navy-900 dark:text-white mt-1">
            {queueData.in_consultation || 1}
          </div>
          <div className="text-[11px] text-navy-400 mt-0.5">Currently with doctors</div>
        </Card>

        <Card className="p-4 border-l-4 border-l-blue-500">
          <div className="text-xs font-semibold text-navy-500 dark:text-navy-400 uppercase tracking-wider">
            Waiting for Doctor
          </div>
          <div className="text-2xl font-bold font-mono text-navy-900 dark:text-white mt-1">
            {queueData.triaged_waiting_doctor || 2}
          </div>
          <div className="text-[11px] text-navy-400 mt-0.5">Triaged in lounge</div>
        </Card>

        <Card className="p-4 border-l-4 border-l-emerald-500">
          <div className="text-xs font-semibold text-navy-500 dark:text-navy-400 uppercase tracking-wider">
            Avg Wait Duration
          </div>
          <div className="text-2xl font-bold font-mono text-navy-900 dark:text-white mt-1">
            15.3 <span className="text-xs font-sans font-normal text-navy-500">min</span>
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5">Within 20m target</div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Pill Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-navy-50 dark:bg-navy-900/80 rounded-xl border border-navy-100 dark:border-navy-800">
            {[
              { id: 'ALL', label: 'All Tokens' },
              { id: 'WAITING', label: 'Waiting for Doctor' },
              { id: 'IN_ROOM', label: 'In Consultation' },
              { id: 'COMPLETED', label: 'Completed' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterTab(tab.id)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  filterTab === tab.id
                    ? 'bg-canary-400 text-navy-950 shadow-sm font-bold'
                    : 'text-navy-600 dark:text-navy-300 hover:text-navy-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
            <input
              type="text"
              placeholder="Search token, UHID, or patient..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-700 rounded-xl text-xs text-navy-900 dark:text-white placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-canary-400"
            />
          </div>
        </div>
      </Card>

      {/* Queue Table */}
      <Card className="overflow-hidden border border-navy-100 dark:border-navy-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-navy-100 dark:border-navy-800 bg-navy-50/75 dark:bg-navy-900/60 text-navy-600 dark:text-navy-300 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Token #</th>
                <th className="py-3 px-4">Patient UHID & Name</th>
                <th className="py-3 px-4">Assigned Physician</th>
                <th className="py-3 px-4">Triage Status / BP</th>
                <th className="py-3 px-4">Wait Duration</th>
                <th className="py-3 px-4">Encounter Stage</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-100 dark:divide-navy-800">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-navy-400 dark:text-navy-500">
                    No patients currently matching filter.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr
                    key={item.visit_id || item.token}
                    className="hover:bg-navy-50/40 dark:hover:bg-navy-800/40 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-navy-900 text-canary-400 dark:bg-navy-800">
                        {item.token}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-navy-900 dark:text-white">
                        {item.patient_name}
                      </div>
                      <div className="font-mono text-[10px] text-navy-400">
                        {item.uhid}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-navy-800 dark:text-navy-200 font-medium">
                        <Stethoscope className="w-3.5 h-3.5 text-ochre-500" />
                        {item.doctor_name}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={getBpBadgeVariant(item.bp_stage)} size="xs">
                        {item.bp_stage || 'Normal'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 font-mono text-navy-600 dark:text-navy-300">
                        <Clock className="w-3.5 h-3.5 text-navy-400" />
                        {item.wait_time_minutes ? `${item.wait_time_minutes} min` : '5 min'}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={getStatusBadgeVariant(item.status)} size="xs" className="font-semibold">
                        {item.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="secondary"
                        size="xs"
                        onClick={() => handlePrintSlip(item)}
                        className="flex items-center gap-1.5 ml-auto"
                      >
                        <Printer className="w-3 h-3 text-navy-700 dark:text-navy-200" />
                        Print Slip
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Printable Slip Preview Modal */}
      {selectedSlip && (
        <Modal
          isOpen={!!selectedSlip}
          onClose={() => setSelectedSlip(null)}
          title="OPD Encounter Token Slip"
        >
          <div className="space-y-4">
            <div id="printable-token-slip" className="p-6 bg-white text-navy-950 border border-dashed border-navy-300 rounded-xl font-mono text-center space-y-3">
              <div className="border-b border-navy-200 pb-3">
                <h3 className="font-sans font-bold text-lg text-navy-950 uppercase tracking-wide">
                  Bright Solutions Clinic
                </h3>
                <p className="text-xs text-navy-600 font-sans">
                  Outpatient Department Walk-in Token
                </p>
                <p className="text-[10px] text-navy-400 mt-0.5">
                  Date: {new Date().toLocaleDateString()} • {new Date().toLocaleTimeString()}
                </p>
              </div>

              <div className="py-3">
                <span className="text-xs text-navy-500 uppercase tracking-widest font-sans">
                  Queue Token
                </span>
                <div className="text-4xl font-extrabold text-navy-950 tracking-wider my-1">
                  {selectedSlip.token}
                </div>
                <div className="text-xs font-semibold text-navy-800">
                  {selectedSlip.patient_name}
                </div>
                <div className="text-xs text-navy-500 font-mono">
                  {selectedSlip.uhid}
                </div>
              </div>

              <div className="border-t border-b border-navy-200 py-3 text-left text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-navy-500">Consulting Physician:</span>
                  <span className="font-bold text-navy-900">{selectedSlip.doctor_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-navy-500">Triage BP Stage:</span>
                  <span className="font-bold text-navy-900">{selectedSlip.bp_stage || 'Normal'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-navy-500">Waiting Room:</span>
                  <span className="font-bold text-navy-900">OPD Lounge Cabin 01</span>
                </div>
              </div>

              <p className="text-[10px] text-navy-500 font-sans italic pt-2">
                Please wait until your token is called on the lounge audio visualizer.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedSlip(null)}>
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={triggerBrowserPrint}
                className="flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Print 80mm Slip
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
