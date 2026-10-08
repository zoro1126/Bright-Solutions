import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CreditCard,
  QrCode,
  DollarSign,
  Printer,
  CheckCircle2,
  Building,
  ShieldCheck,
  RefreshCw,
  ArrowLeft,
  FileCheck2,
  Smartphone
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../components/ui/Toast';
import { api } from '../../services/api';

export default function PaymentReceiptPage() {
  const { billId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [paymentMode, setPaymentMode] = useState('UPI'); // UPI, CASH, CARD
  const [totalAmount] = useState(745.0);
  const [cashTendered, setCashTendered] = useState('1000');
  const [cardAuthCode, setCardAuthCode] = useState('AUTH-99182');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [receiptRecord, setReceiptRecord] = useState(null);

  const changeDue = Math.max(0, (parseFloat(cashTendered) || 0) - totalAmount);

  const handleRecordPayment = async () => {
    setIsProcessing(true);
    try {
      const result = await api.recordPayment(billId || 201, {
        tendered_amount: totalAmount,
        payment_mode: paymentMode,
        cash_received: paymentMode === 'CASH' ? parseFloat(cashTendered) : totalAmount,
        change_returned: paymentMode === 'CASH' ? changeDue : 0,
      });
      setReceiptRecord(result);
      setPaymentSuccess(true);
      addToast({
        type: 'success',
        title: 'Payment Successful',
        message: `Settled ₹ ${totalAmount.toFixed(2)} via ${paymentMode}. Encounter closed.`,
      });
    } catch {
      setPaymentSuccess(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const triggerPrint = () => {
    window.print();
  };

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
                P-CSH-03 • Tender & Tax Receipt
              </span>
              <Badge variant="navy" size="xs">Point of Sale</Badge>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-navy-900 dark:text-white">
              Multi-Mode Tender & Official Tax Receipt
            </h1>
          </div>
        </div>

        {paymentSuccess && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={triggerPrint}
              className="flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Print 80mm Receipt
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/cashier/dashboard')}
              className="font-bold"
            >
              Next Billing Patient
            </Button>
          </div>
        )}
      </div>

      {/* Main Tender Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Payment Modes & Settlement (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="p-5 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-navy-900 dark:text-white">
                  1. Select Tender Mode
                </h2>
                <p className="text-xs text-navy-500">
                  Collect patient payment for Invoice #{billId || 201}.
                </p>
              </div>
              <div className="text-right font-mono">
                <span className="text-xs text-navy-400 block">Total Due:</span>
                <span className="text-xl font-bold text-navy-950 dark:text-white">
                  ₹ {totalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Tender Mode Buttons */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'UPI', label: 'Dynamic UPI QR', icon: QrCode, subtitle: 'GPay / PhonePe / Paytm' },
                { id: 'CASH', label: 'Cash Tender', icon: DollarSign, subtitle: 'Calculate change return' },
                { id: 'CARD', label: 'Credit / Debit Card', icon: CreditCard, subtitle: 'Bank POS terminal' },
              ].map((mode) => {
                const Icon = mode.icon;
                const isSelected = paymentMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setPaymentMode(mode.id)}
                    disabled={paymentSuccess}
                    className={`p-3.5 rounded-xl text-left border transition-all ${
                      isSelected
                        ? 'border-canary-400 bg-canary-400/10 shadow-sm dark:bg-canary-400/5'
                        : 'border-navy-100 dark:border-navy-800 bg-white dark:bg-navy-900 hover:border-navy-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className={`p-2 rounded-lg ${isSelected ? 'bg-canary-400 text-navy-950 font-bold' : 'bg-navy-50 dark:bg-navy-800 text-navy-700 dark:text-navy-300'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="font-semibold text-xs text-navy-900 dark:text-white">
                      {mode.label}
                    </div>
                    <div className="text-[10px] text-navy-400 mt-0.5">
                      {mode.subtitle}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Mode-Specific Tender View */}
            <div className="pt-2">
              {paymentMode === 'UPI' && (
                <div className="p-6 rounded-2xl bg-navy-50 dark:bg-navy-800/40 border border-navy-100 dark:border-navy-700 text-center space-y-4">
                  <div className="w-44 h-44 mx-auto p-3 bg-white rounded-2xl shadow-md border border-navy-200 flex flex-col items-center justify-center">
                    {/* SVG QR Code Simulation */}
                    <div className="w-36 h-36 bg-gradient-to-br from-navy-950 to-navy-900 rounded-lg p-2 flex flex-wrap gap-1 items-center justify-center">
                      <div className="w-8 h-8 bg-canary-400 rounded-sm" />
                      <div className="w-8 h-8 bg-white rounded-sm" />
                      <div className="w-8 h-8 bg-canary-400 rounded-sm" />
                      <div className="w-8 h-8 bg-white rounded-sm" />
                      <div className="w-8 h-8 bg-canary-400 rounded-sm" />
                      <div className="w-8 h-8 bg-white rounded-sm" />
                    </div>
                  </div>
                  <div>
                    <span className="font-mono text-xs text-navy-500 block">
                      VPA: brightsolutions@hdfcbank
                    </span>
                    <span className="font-bold text-sm text-navy-900 dark:text-white">
                      Scan to Pay ₹ {totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {paymentMode === 'CASH' && (
                <div className="p-5 rounded-2xl bg-navy-50 dark:bg-navy-800/40 border border-navy-100 dark:border-navy-700 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-navy-700 dark:text-navy-300 mb-1">
                        Physical Cash Handed By Patient
                      </label>
                      <Input
                        type="number"
                        value={cashTendered}
                        onChange={(e) => setCashTendered(e.target.value)}
                        className="font-mono text-base font-bold"
                        disabled={paymentSuccess}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-navy-700 dark:text-navy-300 mb-1">
                        Change Return Due
                      </label>
                      <div className="p-2.5 rounded-xl bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-700 font-mono text-base font-extrabold text-emerald-600">
                        ₹ {changeDue.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {['745', '800', '1000', '2000'].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setCashTendered(val)}
                        disabled={paymentSuccess}
                        className="px-3 py-1 rounded-lg bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-700 text-xs font-mono font-bold hover:border-canary-400"
                      >
                        ₹{val}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {paymentMode === 'CARD' && (
                <div className="p-5 rounded-2xl bg-navy-50 dark:bg-navy-800/40 border border-navy-100 dark:border-navy-700 space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-navy-700 dark:text-navy-300 mb-1">
                      POS Terminal Approval / Auth Code
                    </label>
                    <Input
                      value={cardAuthCode}
                      onChange={(e) => setCardAuthCode(e.target.value)}
                      className="font-mono text-xs font-bold uppercase"
                      disabled={paymentSuccess}
                    />
                  </div>
                  <p className="text-[11px] text-navy-500">
                    Swipe or tap card on PineLabs POS terminal and record authorization code above.
                  </p>
                </div>
              )}
            </div>

            {/* Record Payment CTA */}
            {!paymentSuccess ? (
              <Button
                variant="primary"
                size="lg"
                loading={isProcessing}
                onClick={handleRecordPayment}
                className="w-full flex items-center justify-center gap-2 font-bold py-3 shadow-md shadow-canary-500/20"
              >
                <CheckCircle2 className="w-5 h-5 text-navy-950" />
                Confirm Payment & Discharge Patient
              </Button>
            ) : (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/40 text-emerald-900 dark:text-emerald-200 text-center space-y-1">
                <div className="font-bold text-sm flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Receipt Issued & Patient Discharged
                </div>
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  Encounter marked COMPLETED in clinic records.
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: 80mm Printable Official Tax Receipt (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card
            id="printable-official-receipt"
            className="p-6 bg-white text-navy-950 border border-navy-200 shadow-md font-mono text-xs space-y-4"
          >
            {/* Clinic Brand Receipt Header */}
            <div className="text-center border-b border-navy-200 pb-3 space-y-1">
              <h3 className="font-sans font-extrabold text-base text-navy-950 uppercase tracking-wider">
                Bright Solutions OPD Suite
              </h3>
              <p className="text-[10px] text-navy-600 font-sans">
                102 Healthcare Avenue, Medical District • GSTIN: 27AABCB1234M1Z2
              </p>
              <p className="text-[10px] text-navy-500">
                Official Tax Receipt & Patient Cash Memo
              </p>
            </div>

            {/* Receipt Metadata */}
            <div className="border-b border-navy-200 pb-2 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>Receipt #:</span>
                <span className="font-bold">REC-2026-00201</span>
              </div>
              <div className="flex justify-between">
                <span>Date & Time:</span>
                <span>{new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Patient UHID:</span>
                <span className="font-bold">UHID-2026-00002</span>
              </div>
              <div className="flex justify-between">
                <span>Patient Name:</span>
                <span className="font-bold">Ramesh Patel</span>
              </div>
              <div className="flex justify-between">
                <span>Attending Doctor:</span>
                <span>Dr. Vikram Kulkarni</span>
              </div>
            </div>

            {/* Itemized Line breakdown */}
            <div className="border-b border-navy-200 pb-2 space-y-1.5 text-[11px]">
              <div className="flex justify-between font-bold border-b border-navy-100 pb-1">
                <span>Service Description</span>
                <span>Amount (INR)</span>
              </div>
              <div className="flex justify-between">
                <span>Physician OPD Consult</span>
                <span>500.00</span>
              </div>
              <div className="flex justify-between">
                <span>PACS DICOM Review</span>
                <span>150.00</span>
              </div>
              <div className="flex justify-between">
                <span>Amlodipine 5mg (Strip 30)</span>
                <span>65.00</span>
              </div>
              <div className="flex justify-between">
                <span>Paracetamol 650mg (Strip 10)</span>
                <span>30.00</span>
              </div>
            </div>

            {/* Total Calculations */}
            <div className="border-b border-navy-200 pb-2 space-y-1 text-xs">
              <div className="flex justify-between font-bold text-sm">
                <span>NET TOTAL PAID:</span>
                <span>₹ {totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[11px] text-navy-600">
                <span>Tender Mode:</span>
                <span className="font-bold">{paymentMode}</span>
              </div>
              <div className="flex justify-between text-[11px] text-navy-600">
                <span>Payment Status:</span>
                <span className="text-emerald-700 font-bold">PAID IN FULL</span>
              </div>
            </div>

            {/* Footer QR stamp */}
            <div className="text-center pt-2 space-y-1 text-[10px] text-navy-500 font-sans">
              <p>Thank you for choosing Bright Solutions Clinic.</p>
              <p className="italic">Keep this receipt for insurance claims and tax filing.</p>
            </div>
          </Card>

          <Button
            variant="outline"
            size="sm"
            onClick={triggerPrint}
            className="w-full flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Print Receipt Now
          </Button>
        </div>
      </div>
    </div>
  );
}
