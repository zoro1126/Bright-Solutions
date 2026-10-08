import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Receipt,
  CreditCard,
  ShieldCheck,
  Percent,
  Plus,
  Trash2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Building2,
  AlertCircle
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../components/ui/Toast';
import { api } from '../../services/api';

export default function ItemizedBillingPage() {
  const { visitId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [billData, setBillData] = useState(null);
  const [insuranceScheme, setInsuranceScheme] = useState('NONE'); // NONE, PMJAY, CGHS, PRIVATE_TPA
  const [discountPct, setDiscountPct] = useState(0);

  useEffect(() => {
    loadBill();
  }, [visitId]);

  const loadBill = async () => {
    setLoading(true);
    try {
      const data = await api.getBillForVisit(visitId || 102);
      setBillData(data);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  const lineItems = billData?.line_items || [
    { item_code: 'CONS_GEN', description: 'General Physician Consultation (Dr. Vikram Kulkarni)', quantity: 1, unit_rate: 500.0, total_amount: 500.0 },
    { item_code: 'DIAG_ARCH', description: 'External Scan Archival & Review (DICOM)', quantity: 1, unit_rate: 150.0, total_amount: 150.0 },
    { item_code: 'PHARM_01', description: 'Amlodipine Besylate 5mg (Strip of 30)', quantity: 1, unit_rate: 65.0, total_amount: 65.0 },
    { item_code: 'PHARM_02', description: 'Paracetamol 650mg (Strip of 10)', quantity: 1, unit_rate: 30.0, total_amount: 30.0 },
  ];

  const subtotal = lineItems.reduce((acc, item) => acc + item.total_amount, 0);

  // Insurance Copay logic
  let insuranceCoverage = 0;
  if (insuranceScheme === 'PMJAY') insuranceCoverage = subtotal * 0.85; // 85% covered
  if (insuranceScheme === 'CGHS') insuranceCoverage = subtotal * 0.70;
  if (insuranceScheme === 'PRIVATE_TPA') insuranceCoverage = subtotal * 0.80;

  const discountAmount = (subtotal * discountPct) / 100;
  const netPatientPayable = Math.max(0, subtotal - insuranceCoverage - discountAmount);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-navy-100 dark:border-navy-800 pb-5">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/cashier/dashboard')}
            className="p-2"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-ochre-600 dark:text-ochre-400">
                P-CSH-02 • Itemized Ledger
              </span>
              <Badge variant="navy" size="xs">Invoice Reconciliation</Badge>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-navy-900 dark:text-white">
              Itemized Invoice & Insurance Copay
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate(`/cashier/receipt/${billData?.bill_id || 201}`)}
            className="flex items-center gap-2 font-bold"
          >
            <CreditCard className="w-4 h-4 text-navy-950" />
            Proceed to Tender Payment
          </Button>
        </div>
      </div>

      {/* Patient Invoice Header */}
      <Card className="p-4 bg-white dark:bg-navy-900 border border-navy-100 dark:border-navy-800 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-navy-900 text-canary-400 font-bold flex items-center justify-center font-mono text-base">
              Q-102
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-navy-900 dark:text-white text-base">
                  {billData?.patient_name || 'Ramesh Patel'}
                </span>
                <span className="font-mono text-xs text-navy-400">
                  ({billData?.uhid || 'UHID-2026-00002'})
                </span>
              </div>
              <p className="text-xs text-navy-500 dark:text-navy-400 mt-0.5">
                Attending Physician: <strong className="text-navy-900 dark:text-white">{billData?.doctor_name || 'Dr. Vikram Kulkarni, MD'}</strong> • Invoice #{billData?.bill_id || 201}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="ochre" size="sm" className="font-mono">
              STATUS: READY_FOR_BILLING
            </Badge>
          </div>
        </div>
      </Card>

      {/* 2-Column Ledger & Copay Reconciliation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Itemized Line Items Table (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-navy-900 dark:text-white">
                  Prescribed Clinical Ledger
                </h2>
                <p className="text-xs text-navy-500">
                  Includes consultation tariff, external scan archival, and clinic formulary dispensed items.
                </p>
              </div>
              <Badge variant="navy" size="xs">{lineItems.length} ITEMS</Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-navy-100 dark:border-navy-800 bg-navy-50/50 dark:bg-navy-900/50 text-navy-500 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-2.5 px-3">Code</th>
                    <th className="py-2.5 px-3">Service / Medication Description</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">Unit Rate</th>
                    <th className="py-2.5 px-3 text-right">Total Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-100 dark:divide-navy-800">
                  {lineItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-navy-50/40 dark:hover:bg-navy-800/40">
                      <td className="py-3 px-3 font-mono font-bold text-navy-600 dark:text-navy-300">
                        {item.item_code}
                      </td>
                      <td className="py-3 px-3 font-medium text-navy-900 dark:text-white">
                        {item.description}
                      </td>
                      <td className="py-3 px-3 font-mono text-center text-navy-600 dark:text-navy-300">
                        {item.quantity}
                      </td>
                      <td className="py-3 px-3 font-mono text-right text-navy-600 dark:text-navy-300">
                        ₹ {item.unit_rate.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-right text-navy-900 dark:text-white">
                        ₹ {item.total_amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Insurance Copay Selector */}
            <div className="pt-4 border-t border-navy-100 dark:border-navy-800 space-y-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-ochre-500" />
                <h3 className="text-xs font-bold text-navy-900 dark:text-white uppercase tracking-wider">
                  Health Insurance & TPA Copay Deduction
                </h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'NONE', label: 'Self Pay (Cash)', pct: '0%' },
                  { id: 'PMJAY', label: 'Ayushman Bharat', pct: '85% Coverage' },
                  { id: 'CGHS', label: 'CGHS / Govt', pct: '70% Coverage' },
                  { id: 'PRIVATE_TPA', label: 'Star Health / TPA', pct: '80% Coverage' },
                ].map((ins) => (
                  <button
                    key={ins.id}
                    type="button"
                    onClick={() => setInsuranceScheme(ins.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      insuranceScheme === ins.id
                        ? 'border-canary-400 bg-canary-400/10 dark:bg-canary-400/5 shadow-sm'
                        : 'border-navy-100 dark:border-navy-800 hover:border-navy-300'
                    }`}
                  >
                    <div className="font-semibold text-xs text-navy-900 dark:text-white">
                      {ins.label}
                    </div>
                    <div className="text-[10px] font-mono text-ochre-600 dark:text-canary-400 mt-0.5">
                      {ins.pct}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Financial Summary Card (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="p-5 space-y-4 bg-gradient-to-br from-white to-navy-50/50 dark:from-navy-900 dark:to-navy-950 border border-navy-100 dark:border-navy-800 shadow-md">
            <h3 className="text-sm font-bold uppercase tracking-wider text-navy-900 dark:text-white">
              Financial Breakdown
            </h3>

            <div className="space-y-2.5 font-mono text-xs">
              <div className="flex justify-between text-navy-600 dark:text-navy-300">
                <span>Gross Ledger Subtotal:</span>
                <span className="font-bold text-navy-900 dark:text-white">₹ {subtotal.toFixed(2)}</span>
              </div>

              {insuranceCoverage > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>Insurance TPA Claim:</span>
                  <span className="font-bold">- ₹ {insuranceCoverage.toFixed(2)}</span>
                </div>
              )}

              {discountAmount > 0 && (
                <div className="flex justify-between text-amber-600">
                  <span>Authorized Discount:</span>
                  <span className="font-bold">- ₹ {discountAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-navy-500">
                <span>Applicable GST (0% OPD):</span>
                <span>₹ 0.00</span>
              </div>
            </div>

            <div className="pt-4 border-t-2 border-dashed border-navy-200 dark:border-navy-700">
              <div className="text-xs uppercase tracking-wider font-semibold text-navy-500">
                Net Amount Payable by Patient
              </div>
              <div className="text-3xl font-extrabold font-mono text-navy-950 dark:text-white mt-1">
                ₹ {netPatientPayable.toFixed(2)}
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate(`/cashier/receipt/${billData?.bill_id || 201}`)}
              className="w-full flex items-center justify-center gap-2 font-bold shadow-md shadow-canary-500/20 py-3 mt-4"
            >
              <CreditCard className="w-5 h-5 text-navy-950" />
              Collect ₹ {netPatientPayable.toFixed(2)}
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
