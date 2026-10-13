import React, { useState, useMemo, useEffect } from 'react';
import { usePatients } from '../context/PatientContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { 
  Receipt, 
  CreditCard, 
  QrCode, 
  Banknote, 
  ShieldCheck, 
  CheckCircle2, 
  Printer, 
  Download, 
  X, 
  User, 
  Phone, 
  Calendar, 
  ArrowRight,
  FileCheck,
  Stethoscope,
  Pill,
  Landmark,
  Award,
  Sparkles,
  Check,
  FileText,
  Building2,
  AlertCircle,
  Maximize2,
  Search, 
  Clock,
  TrendingUp,
  BarChart3,
  PieChart,
  ArrowUpRight,
  Activity,
  CheckCheck,
  Zap,
  ChevronRight,
  Wallet,
  BadgePercent
} from 'lucide-react';
import SpeechMicButton from '../components/SpeechMicButton';

const AVATAR_COLORS = [
  'linear-gradient(135deg, #0284c7, #0369a1)',
  'linear-gradient(135deg, #f59e0b, #d97706)',
  'linear-gradient(135deg, #6366f1, #4f46e5)',
  'linear-gradient(135deg, #ea580c, #c2410c)',
  'linear-gradient(135deg, #0f172a, #334155)'
];

const CLINICAL_PROCEDURES = [
  { id: 'proc-1', desc: 'Specialist General Medicine Consultation (Dr. Ananya Sharma)', code: 'MED-CONS-01', dept: 'Internal Medicine', qty: 1, unitPrice: 1200, coveredByInsurance: true },
  { id: 'proc-2', desc: '12-Lead Electrocardiography (ECG) & 2D Echo Evaluation', code: 'CARD-ECG-02', dept: 'Cardiology Diagnostics', qty: 1, unitPrice: 2800, coveredByInsurance: true },
  { id: 'proc-3', desc: 'Comprehensive Metabolic Panel (HbA1c, Lipid & Renal Profile)', code: 'LAB-CMP-104', dept: 'Clinical Biochemistry', qty: 1, unitPrice: 1800, coveredByInsurance: true },
  { id: 'proc-4', desc: 'Daycare Observation Ward Care & IV Medication Administration', code: 'ADM-DAY-CARE', dept: 'Observation & Daycare', qty: 1, unitPrice: 1500, coveredByInsurance: true }
];

const PHARMACY_MEDICINES = [
  { id: 'rx-1', name: 'Telmisartan 40mg + Amlodipine 5mg (Telma-AM)', form: 'Tablet (Strip of 15)', batch: 'TM-9041', exp: '12/2027', qty: 30, unitPrice: 12.5, gstPct: 5, coveredByInsurance: true },
  { id: 'rx-2', name: 'Atorvastatin 20mg (Atorva)', form: 'Tablet (Strip of 10)', batch: 'AT-3312', exp: '09/2027', qty: 30, unitPrice: 18.0, gstPct: 5, coveredByInsurance: true },
  { id: 'rx-3', name: 'Metformin Hydrochloride 500mg (Glycomet ER)', form: 'Tablet (Strip of 20)', batch: 'MF-8819', exp: '06/2028', qty: 60, unitPrice: 4.2, gstPct: 5, coveredByInsurance: true },
  { id: 'rx-4', name: 'Pantoprazole 40mg Gastro-Resistant (Pan-40)', form: 'Tablet (Strip of 15)', batch: 'PN-4402', exp: '11/2028', qty: 30, unitPrice: 9.0, gstPct: 5, coveredByInsurance: true },
  { id: 'rx-5', name: 'Sterile IV Infusion Set & Normal Saline 500mL', form: 'Sterile Infusion Kit', batch: 'NS-1044', exp: '04/2029', qty: 1, unitPrice: 280, gstPct: 12, coveredByInsurance: true }
];

// Rich settled receipts archive for the dedicated Settlement & Receipts tab
const SETTLED_RECEIPTS_DATA = [
  {
    id: 'RCP-2026-081',
    invNo: 'INV-2026-0914',
    patientName: 'Devika Krishnan',
    mrn: 'MRN-2026-0042',
    phone: '+91 98412 88201',
    age: 48,
    gender: 'Female',
    doctor: 'Dr. Ananya Sharma',
    dept: 'Cardiology',
    method: 'UPI',
    methodLabel: 'Dynamic UPI QR',
    ref: 'UPI-849102-HDFC',
    amount: 14250,
    gross: 14250,
    scheme: 'Direct Self-Pay',
    date: 'Today, 04:32 PM',
    status: 'SETTLED',
    abdmLinked: true
  },
  {
    id: 'RCP-2026-080',
    invNo: 'INV-2026-0913',
    patientName: 'Mohammad Farooq',
    mrn: 'MRN-2026-0038',
    phone: '+91 97110 44290',
    age: 56,
    gender: 'Male',
    doctor: 'Dr. Kiran Patel',
    dept: 'Internal Medicine',
    method: 'PM_JAY',
    methodLabel: 'Ayushman Bharat PM-JAY',
    ref: 'NHA-ABPMJAY-99412',
    amount: 0,
    gross: 18500,
    scheme: 'PM-JAY 100% Cashless',
    date: 'Today, 03:55 PM',
    status: 'SETTLED',
    abdmLinked: true
  },
  {
    id: 'RCP-2026-079',
    invNo: 'INV-2026-0912',
    patientName: 'Kavita Sundaram',
    mrn: 'MRN-2026-0035',
    phone: '+91 98200 11923',
    age: 39,
    gender: 'Female',
    doctor: 'Dr. Alok Mehta',
    dept: 'General Surgery',
    method: 'CARD',
    methodLabel: 'POS Card Swipe (VISA)',
    ref: 'AUTH-661902-ICICI',
    amount: 9800,
    gross: 24500,
    scheme: 'Star Health (75% Claim)',
    date: 'Today, 03:15 PM',
    status: 'SETTLED',
    abdmLinked: true
  },
  {
    id: 'RCP-2026-078',
    invNo: 'INV-2026-0911',
    patientName: 'Rajeshwer Sen',
    mrn: 'MRN-2026-0031',
    phone: '+91 99401 22345',
    age: 62,
    gender: 'Male',
    doctor: 'Dr. Ananya Sharma',
    dept: 'Cardiology',
    method: 'CASH',
    methodLabel: 'Cash Counter Drawer',
    ref: 'SLIP-CSH-014',
    amount: 3200,
    gross: 3200,
    scheme: 'Direct Cash',
    date: 'Today, 02:40 PM',
    status: 'SETTLED',
    abdmLinked: true
  },
  {
    id: 'RCP-2026-077',
    invNo: 'INV-2026-0910',
    patientName: 'Sunita Mehra',
    mrn: 'MRN-2026-0029',
    phone: '+91 94451 88921',
    age: 51,
    gender: 'Female',
    doctor: 'Dr. Kiran Patel',
    dept: 'Internal Medicine',
    method: 'UPI',
    methodLabel: 'Dynamic UPI QR',
    ref: 'UPI-771923-SBI',
    amount: 8400,
    gross: 8400,
    scheme: 'Direct Self-Pay',
    date: 'Today, 01:50 PM',
    status: 'SETTLED',
    abdmLinked: true
  },
  {
    id: 'RCP-2026-076',
    invNo: 'INV-2026-0909',
    patientName: 'Govind Narayanan',
    mrn: 'MRN-2026-0026',
    phone: '+91 98840 55192',
    age: 67,
    gender: 'Male',
    doctor: 'Dr. Alok Mehta',
    dept: 'Cardiology Diagnostics',
    method: 'TPA',
    methodLabel: 'Private TPA Pre-Auth',
    ref: 'TPA-MEDV-19924',
    amount: 4500,
    gross: 28000,
    scheme: 'Medi Assist TPA',
    date: 'Today, 01:10 PM',
    status: 'SETTLED',
    abdmLinked: true
  },
  {
    id: 'RCP-2026-075',
    invNo: 'INV-2026-0908',
    patientName: 'Anil Sengupta',
    mrn: 'MRN-2026-0022',
    phone: '+91 97177 33419',
    age: 44,
    gender: 'Male',
    doctor: 'Dr. Kiran Patel',
    dept: 'Internal Medicine',
    method: 'CASH',
    methodLabel: 'Cash Counter Drawer',
    ref: 'SLIP-CSH-013',
    amount: 6500,
    gross: 6500,
    scheme: 'Direct Cash',
    date: 'Today, 12:20 PM',
    status: 'SETTLED',
    abdmLinked: true
  },
  {
    id: 'RCP-2026-074',
    invNo: 'INV-2026-0907',
    patientName: 'Lakshmi Venkatesh',
    mrn: 'MRN-2026-0019',
    phone: '+91 99620 44810',
    age: 58,
    gender: 'Female',
    doctor: 'Dr. Ananya Sharma',
    dept: 'Cardiology Diagnostics',
    method: 'PM_JAY',
    methodLabel: 'Ayushman Bharat PM-JAY',
    ref: 'NHA-ABPMJAY-88102',
    amount: 0,
    gross: 22000,
    scheme: 'PM-JAY 100% Cashless',
    date: 'Today, 11:45 AM',
    status: 'SETTLED',
    abdmLinked: true
  }
];

// Hourly inflow telemetry data for interactive analytics graph
const HOURLY_INFLOW_DATA = [
  { hour: '08:00 AM', label: '08:00', amount: 12400, tx: 4 },
  { hour: '09:00 AM', label: '09:00', amount: 28600, tx: 7 },
  { hour: '10:00 AM', label: '10:00', amount: 46800, tx: 11 },
  { hour: '11:00 AM', label: '11:00', amount: 68400, tx: 15, isPeak: true },
  { hour: '12:00 PM', label: '12:00', amount: 54200, tx: 12 },
  { hour: '01:00 PM', label: '01:00', amount: 38900, tx: 9 },
  { hour: '02:00 PM', label: '02:00', amount: 49100, tx: 10 },
  { hour: '03:00 PM', label: '03:00', amount: 31200, tx: 6 },
  { hour: '04:00 PM', label: '04:00', amount: 13200, tx: 3, isLive: true }
];

export default function CashierPage({ currentRole = 'cashier', onSwitchRole, activeSubTab = 'billing', onLogout }) {
  const { patients, selectedPatientId, setSelectedPatientId, updatePatient, addToast } = usePatients();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [cashierNav, setCashierNav] = useState(activeSubTab || 'billing'); // 'dashboard' | 'billing' | 'receipt'
  const [activeBillTab, setActiveBillTab] = useState('ALL'); // 'ALL' | 'MEDICINES' | 'PROCEDURES'
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showBillPopupModal, setShowBillPopupModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cashierNotes, setCashierNotes] = useState('');
  const [cashReceived, setCashReceived] = useState('');
  const [billingFilter, setBillingFilter] = useState('ALL'); // 'ALL' | 'READY' | 'PAID' | 'GOVT' | 'INSURANCE' | 'CASH'

  // Dedicated state for Settlement & Receipts tab
  const [receiptSearchQuery, setReceiptSearchQuery] = useState('');
  const [receiptFilter, setReceiptFilter] = useState('ALL'); // 'ALL' | 'UPI' | 'CASH' | 'CARD' | 'PM_JAY' | 'TPA'
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // Interactive graph hover state
  const [hoveredHourIdx, setHoveredHourIdx] = useState(null);

  // Synchronize state when activeSubTab prop changes
  useEffect(() => {
    if (activeSubTab) {
      setCashierNav(activeSubTab);
      if (activeSubTab === 'receipt') {
        setBillingFilter('PAID');
      } else if (activeSubTab === 'billing') {
        setBillingFilter('READY');
      }
    }
  }, [activeSubTab]);

  const getInitials = (name) => {
    const parts = name.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const filteredPatients = useMemo(() => {
    return patients.filter(p => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        p.fullName.toLowerCase().includes(q) ||
        p.mrn.toLowerCase().includes(q) ||
        p.phone.includes(q) ||
        (p.insurance?.provider || '').toLowerCase().includes(q) ||
        (p.insurance?.policyNumber || '').toLowerCase().includes(q);

      if (!matchesSearch) return false;

      const isPaid = p.billingStatus === 'PAID';
      const isReady = !isPaid && (p.status === 'COMPLETED' || p.status === 'INSIGHTS_READY');
      const isGovt = p.insurance?.type === 'GOVT_SCHEME';
      const isInsured = p.insurance?.type === 'INSURANCE';
      const isCash = p.insurance?.type === 'CASH';

      if (billingFilter === 'ALL') return true;
      if (billingFilter === 'READY') return isReady;
      if (billingFilter === 'PAID') return isPaid;
      if (billingFilter === 'GOVT') return isGovt;
      if (billingFilter === 'INSURANCE') return isInsured;
      if (billingFilter === 'CASH') return isCash;

      return true;
    });
  }, [patients, searchQuery, billingFilter]);

  // Filtered receipts for Tab 3
  const filteredReceipts = useMemo(() => {
    return SETTLED_RECEIPTS_DATA.filter(r => {
      const q = receiptSearchQuery.toLowerCase();
      const matchesSearch =
        r.patientName.toLowerCase().includes(q) ||
        r.mrn.toLowerCase().includes(q) ||
        r.invNo.toLowerCase().includes(q) ||
        r.ref.toLowerCase().includes(q) ||
        r.doctor.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (receiptFilter === 'ALL') return true;
      if (receiptFilter === 'UPI') return r.method === 'UPI';
      if (receiptFilter === 'CASH') return r.method === 'CASH';
      if (receiptFilter === 'CARD') return r.method === 'CARD';
      if (receiptFilter === 'PM_JAY') return r.method === 'PM_JAY';
      if (receiptFilter === 'TPA') return r.method === 'TPA';

      return true;
    });
  }, [receiptSearchQuery, receiptFilter]);

  // Selected patient for billing
  const patient = patients.find(p => p.id === selectedPatientId) || patients[0] || null;

  // Coverage type detection
  const isGovtScheme = patient?.insurance?.type === 'GOVT_SCHEME';
  const isPrivateInsured = patient?.insurance?.type === 'INSURANCE';
  const isSelfPay = patient?.insurance?.type === 'CASH';

  // Default payment method based on coverage
  const [paymentMethod, setPaymentMethod] = useState(() => {
    if (isGovtScheme) return 'GOVT_PORTAL';
    if (isPrivateInsured) return 'TPA';
    return 'CARD';
  });

  // Calculate Itemized Pharmacy Medicines Subtotal + GST
  const activePharmacyMedicines = useMemo(() => {
    if (patient?.prescriptions && patient.prescriptions.length > 0) {
      return patient.prescriptions.map((rx, idx) => {
        const qtyNum = parseInt(rx.qty, 10) || 14;
        return {
          id: rx.id || `rx-dyn-${idx}`,
          name: rx.drug,
          form: `${rx.dose} • ${rx.freq} (${rx.mealTiming})`,
          batch: `BT-2026-${100 + idx}`,
          exp: '12/2027',
          qty: qtyNum,
          unitPrice: 42,
          gstPct: 5,
          coveredByInsurance: true
        };
      });
    }
    return PHARMACY_MEDICINES;
  }, [patient?.prescriptions]);

  // Calculate Hospital Clinical Procedures Subtotal
  const clinicalGross = CLINICAL_PROCEDURES.reduce((sum, item) => sum + (item.qty * item.unitPrice), 0);
  const pharmacyBase = activePharmacyMedicines.reduce((sum, item) => sum + (item.qty * item.unitPrice), 0);
  const pharmacyGst = activePharmacyMedicines.reduce((sum, item) => sum + Math.round((item.qty * item.unitPrice) * (item.gstPct / 100)), 0);
  const pharmacyGross = pharmacyBase + pharmacyGst;
  const grandGrossTotal = clinicalGross + pharmacyGross;

  // Claim settlement calculations
  let insuranceClaim = 0;
  let deductible = 0;
  let patientNetPayable = 0;

  if (isGovtScheme) {
    insuranceClaim = grandGrossTotal;
    deductible = 0;
    patientNetPayable = 0;
  } else if (isPrivateInsured && patient?.insurance) {
    const coverageRate = (patient.insurance.coveragePct || 80) / 100;
    insuranceClaim = Math.round(grandGrossTotal * coverageRate);
    deductible = patient.insurance.deductible || 0;
    const patientShare = grandGrossTotal - insuranceClaim;
    patientNetPayable = Math.max(deductible, patientShare);
  } else {
    insuranceClaim = 0;
    deductible = 0;
    patientNetPayable = grandGrossTotal;
  }

  const isAlreadyBilled = patient?.billingStatus === 'PAID';

  const handleProcessPayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      updatePatient(patient.id, { billingStatus: 'PAID', status: 'COMPLETED' });
      setIsProcessing(false);
      setShowInvoiceModal(true);
      if (isGovtScheme) {
        addToast(`Government PM-JAY 100% Cashless Settlement approved (₹0 Out-of-pocket) for ${patient.fullName}!`, 'success');
      } else {
        addToast(`Payment of ₹${patientNetPayable.toLocaleString()} collected for ${patient.fullName}!`, 'success');
      }
    }, 600);
  };

  const handleApplyGovtScheme = () => {
    updatePatient(patient.id, {
      insurance: {
        ...patient.insurance,
        type: 'GOVT_SCHEME',
        provider: 'Ayushman Bharat — PM-JAY (AB-PMJAY)',
        policyNumber: patient.insurance.policyNumber || 'PMJAY-TN-9821034',
        coveragePct: 100,
        deductible: 0,
        preAuthNumber: 'PMJAY-PREAUTH-APPROVED'
      }
    });
    setPaymentMethod('GOVT_PORTAL');
    addToast(`Applied Ayushman Bharat PM-JAY 100% Cashless Package to ${patient.fullName}`, 'success');
  };

  // Active invoice details for Invoice Modal (handles both Patient queue and Settled receipts archive)
  const activeInvoiceData = useMemo(() => {
    if (selectedReceipt) {
      return {
        id: selectedReceipt.id,
        invNo: selectedReceipt.invNo,
        fullName: selectedReceipt.patientName,
        age: selectedReceipt.age,
        gender: selectedReceipt.gender,
        mrn: selectedReceipt.mrn,
        phone: selectedReceipt.phone,
        doctorAssigned: `${selectedReceipt.doctor} (${selectedReceipt.dept})`,
        provider: selectedReceipt.scheme,
        policyNumber: selectedReceipt.ref,
        paymentMethod: selectedReceipt.methodLabel,
        patientNetPayable: selectedReceipt.amount,
        grandGrossTotal: selectedReceipt.gross,
        isGovtScheme: selectedReceipt.method === 'PM_JAY',
        insuranceClaim: selectedReceipt.method === 'PM_JAY' ? selectedReceipt.gross : (selectedReceipt.gross - selectedReceipt.amount),
        date: selectedReceipt.date
      };
    }
    return {
      id: patient?.id,
      invNo: `INV-2026-09-${patient?.id || '01'}`,
      fullName: patient?.fullName || 'Patient',
      age: patient?.age || 40,
      gender: patient?.gender || 'Male',
      mrn: patient?.mrn || 'MRN-2026-0001',
      phone: patient?.phone || '+91 98000 00000',
      doctorAssigned: patient?.doctorAssigned || 'Dr. Ananya Sharma (General Medicine)',
      provider: patient?.insurance?.provider || 'Direct Self-Pay',
      policyNumber: patient?.insurance?.policyNumber || 'POL-9921034',
      paymentMethod: paymentMethod === 'GOVT_PORTAL' ? 'PM-JAY NHA Cashless Portal' : paymentMethod,
      patientNetPayable: patientNetPayable,
      grandGrossTotal: grandGrossTotal,
      isGovtScheme: isGovtScheme,
      insuranceClaim: insuranceClaim,
      date: `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    };
  }, [selectedReceipt, patient, paymentMethod, patientNetPayable, grandGrossTotal, isGovtScheme, insuranceClaim]);

  return (
    <div className="m3-app-shell cashier-theme">
      {/* Sidebar Navigation Drawer for Cashier */}
      <Sidebar 
        role="cashier"
        activeTab={cashierNav}
        setActiveTab={setCashierNav}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />

      <div className="m3-main-viewport">
        <Navbar 
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          currentRole={currentRole}
          onRoleChange={onSwitchRole}
          onLogout={onLogout}
        />

        <main 
          className="page-container cashier-page-container m3-page-animate" 
          style={{ 
            maxWidth: '100%', 
            width: '100%', 
            margin: '0', 
            padding: '16px 20px 80px', 
            boxSizing: 'border-box',
            overflowY: 'auto',
            height: 'calc(100vh - 50px)',
            maxHeight: 'calc(100vh - 50px)',
            scrollBehavior: 'smooth'
          }}
        >
          {/* =========================================================================
              VIEW 1: BILLING DASHBOARD (cashierNav === 'dashboard')
              Executive Command Center, KPIs, Interactive Revenue Graphs, Tender Cards, Ledger
             ========================================================================= */}
          {cashierNav === 'dashboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Executive Header Banner */}
              <div 
                className="m3-doctor-patient-banner" 
                style={{ 
                  margin: 0, 
                  border: '1.5px solid var(--csh-banner-border, #fde68a)', 
                  background: 'var(--csh-banner-bg, linear-gradient(135deg, #ffffff 0%, #fef9f1 100%))' 
                }}
              >
                <div className="stat-card-accent-blob blob-yellow" style={{ top: -20, right: -20, width: 96, height: 96, opacity: 0.65 }} />
                <div className="m3-patient-banner-info" style={{ position: 'relative', zIndex: 1 }}>
                  <div 
                    className="stat-squircle-badge" 
                    style={{ 
                      width: 44, 
                      height: 44, 
                      borderRadius: 13, 
                      fontSize: 16, 
                      background: 'var(--csh-brand-gradient, linear-gradient(135deg, #f59e0b, #d97706))', 
                      color: '#ffffff', 
                      boxShadow: 'var(--csh-brand-shadow, 0 4px 10px rgba(245, 158, 11, 0.35))' 
                    }}
                  >
                    <BarChart3 size={20} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <h2 style={{ fontSize: 19, fontWeight: 900, color: '#78350f', margin: 0 }}>
                        Front Desk Fiscal Command & Analytics
                      </h2>
                      <span className="badge badge-ready">Real-Time ABDM & TPA Active</span>
                    </div>
                    <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 2, margin: 0 }}>
                      Live cashier revenue telemetry, payment tender balancing, and end-of-day audit settlement ledger.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button 
                    className="m3-btn m3-btn-filled"
                    onClick={() => setCashierNav('billing')}
                    style={{ 
                      background: 'linear-gradient(135deg, #f59e0b, #d97706)', 
                      color: '#ffffff', 
                      height: 36, 
                      fontSize: 12.5, 
                      padding: '0 14px', 
                      gap: 6,
                      boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)' 
                    }}
                  >
                    <Receipt size={15} />
                    <span>Open Itemized Checkout Queue →</span>
                  </button>
                </div>
              </div>

              {/* 4 Top KPI Stat Cards - Crisp Black Amounts, No Greenery */}
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-card-accent-blob blob-yellow" />
                  <div className="stat-squircle-badge" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#ffffff' }}>
                    <Receipt size={16} strokeWidth={2.4} />
                  </div>
                  <div className="stat-card-value" style={{ color: '#0f172a', fontWeight: 900 }}>₹3,42,800</div>
                  <div className="stat-card-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>Gross Collections Today</span>
                    <span className="cashier-income-pill" style={{ fontSize: 9.5, padding: '1px 6px', borderRadius: 9999 }}>+18.4%</span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-card-accent-blob blob-yellow" />
                  <div className="stat-squircle-badge" style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', color: '#ffffff' }}>
                    <Clock size={16} strokeWidth={2.4} />
                  </div>
                  <div className="stat-card-value" style={{ color: '#0f172a', fontWeight: 900 }}>
                    {patients.filter(p => p.billingStatus !== 'PAID').length}
                  </div>
                  <div className="stat-card-label">Unbilled Queue Accounts</div>
                </div>

                <div className="stat-card">
                  <div className="stat-card-accent-blob blob-yellow" />
                  <div className="stat-squircle-badge" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#ffffff' }}>
                    <CheckCircle2 size={16} strokeWidth={2.4} />
                  </div>
                  <div className="stat-card-value" style={{ color: '#0f172a', fontWeight: 900 }}>
                    24 Invoices
                  </div>
                  <div className="stat-card-label">Invoices Settled & Archived</div>
                </div>

                <div className="stat-card">
                  <div className="stat-card-accent-blob blob-yellow" />
                  <div className="stat-squircle-badge" style={{ background: 'linear-gradient(135deg, #f59e0b, #b45309)', color: '#ffffff' }}>
                    <Landmark size={16} strokeWidth={2.4} />
                  </div>
                  <div className="stat-card-value" style={{ color: '#0f172a', fontWeight: 900 }}>100%</div>
                  <div className="stat-card-label">PM-JAY Cashless Cleared</div>
                </div>
              </div>

              {/* =====================================================================
                  INTERACTIVE REVENUE & CASHIER GRAPHS SECTION
                  Graph 1: Hourly Inflow & Billing Volume Curve
                  Graph 2: Tender Channel Revenue Share
                  Graph 3: Fiscal Counter Telemetry & Speed Meters
                 ===================================================================== */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1.2fr', gap: 14 }}>
                {/* Graph 1: Hourly Inflow & Billing Volume Curve */}
                <div className="card" style={{ padding: 18, background: '#ffffff', border: '1px solid var(--border-default)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#d97706' }} />
                        <h3 style={{ fontSize: 14.5, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                          Today's Hourly Revenue Inflow & Velocity Curve
                        </h3>
                      </div>
                      <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', margin: '3px 0 0' }}>
                        Peak collections between 10:00 AM – 01:00 PM • Shift Counter B-02
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="badge badge-ready" style={{ fontSize: 10.5 }}>
                        <TrendingUp size={12} /> Peak: ₹68.4k (11 AM)
                      </span>
                      <span className="cashier-income-pill" style={{ fontSize: 10.5, padding: '2px 8px', borderRadius: 9999 }}>
                        Avg Tx: ₹14,280
                      </span>
                    </div>
                  </div>

                  {/* Hourly Bar Chart Visualizer */}
                  <div style={{ height: 160, display: 'flex', alignItems: 'flex-end', gap: 10, padding: '0 4px', borderBottom: '1px solid var(--border-subtle)', position: 'relative' }}>
                    {HOURLY_INFLOW_DATA.map((item, idx) => {
                      const maxAmount = 68400;
                      const heightPct = Math.round((item.amount / maxAmount) * 125);
                      const isHovered = hoveredHourIdx === idx;

                      return (
                        <div 
                          key={idx}
                          style={{ 
                            flex: 1, 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center', 
                            height: '100%', 
                            justifyContent: 'flex-end',
                            cursor: 'pointer',
                            position: 'relative'
                          }}
                          onMouseEnter={() => setHoveredHourIdx(idx)}
                          onMouseLeave={() => setHoveredHourIdx(null)}
                        >
                          {/* Tooltip on hover */}
                          {isHovered && (
                            <div style={{
                              position: 'absolute',
                              bottom: heightPct + 12,
                              background: '#0f172a',
                              color: '#ffffff',
                              padding: '4px 8px',
                              borderRadius: 6,
                              fontSize: 10.5,
                              whiteSpace: 'nowrap',
                              zIndex: 10,
                              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                              pointerEvents: 'none',
                              textAlign: 'center'
                            }}>
                              <div style={{ fontWeight: 800 }}>₹{item.amount.toLocaleString()}</div>
                              <div style={{ fontSize: 9.5, color: '#fde68a' }}>{item.tx} Bills Settled</div>
                            </div>
                          )}

                          {/* Bar Amount Tag */}
                          <span style={{ 
                            fontSize: 9, 
                            fontWeight: 800, 
                            color: item.isPeak ? '#b45309' : '#0f172a', 
                            marginBottom: 4 
                          }}>
                            {(item.amount / 1000).toFixed(1)}k
                          </span>

                          {/* Bar Element */}
                          <div 
                            style={{
                              width: '100%',
                              height: `${heightPct}px`,
                              background: item.isPeak 
                                ? 'linear-gradient(180deg, #d97706 0%, #b45309 100%)' 
                                : isHovered
                                ? 'linear-gradient(180deg, #fbbf24 0%, #d97706 100%)'
                                : 'linear-gradient(180deg, #f59e0b 0%, #d97706 100%)',
                              borderRadius: '6px 6px 2px 2px',
                              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                              boxShadow: isHovered ? '0 4px 12px rgba(217, 119, 6, 0.35)' : 'none',
                              opacity: hoveredHourIdx !== null && !isHovered ? 0.65 : 1
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* X-Axis Hour Labels */}
                  <div style={{ display: 'flex', gap: 10, padding: '8px 4px 0', marginTop: 2 }}>
                    {HOURLY_INFLOW_DATA.map((item, idx) => (
                      <div key={idx} style={{ flex: 1, textAlign: 'center', fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>
                        {item.label}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Graph 2: Payment Tender Channel Revenue Share */}
                <div className="card" style={{ padding: 18, background: '#ffffff', border: '1px solid var(--border-default)', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div>
                      <h3 style={{ fontSize: 14.5, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                        Tender Channel Revenue Share
                      </h3>
                      <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                        Settlement channel distribution across Counter B-02
                      </p>
                    </div>
                    <span className="cashier-income-pill" style={{ fontSize: 10, padding: '2px 8px', borderRadius: 9999 }}>
                      100% Reconciled
                    </span>
                  </div>

                  {/* Composite Segmented Progress Bar */}
                  <div style={{ height: 12, width: '100%', borderRadius: 9999, overflow: 'hidden', display: 'flex', gap: 2, marginBottom: 14, background: '#f1f5f9' }}>
                    <div style={{ width: '36.2%', background: '#d97706' }} title="PM-JAY 36.2%" />
                    <div style={{ width: '24.6%', background: '#0284c7' }} title="UPI QR 24.6%" />
                    <div style={{ width: '18.1%', background: '#6366f1' }} title="POS Card 18.1%" />
                    <div style={{ width: '14.1%', background: '#b45309' }} title="Cash Counter 14.1%" />
                    <div style={{ width: '7.0%', background: '#9333ea' }} title="Private TPA 7.0%" />
                  </div>

                  {/* Channel Items List - Bold Black Amounts */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, justifyContent: 'space-between' }}>
                    {[
                      { name: 'Ayushman Bharat PM-JAY', share: '36.2%', amount: '₹1,24,000', count: '12 Patients', dot: '#d97706' },
                      { name: 'Dynamic UPI QR Transfers', share: '24.6%', amount: '₹84,500', count: '28 Slips', dot: '#0284c7' },
                      { name: 'POS Card Swipes', share: '18.1%', amount: '₹62,100', count: '16 Slips', dot: '#6366f1' },
                      { name: 'Cash Counter Drawer', share: '14.1%', amount: '₹48,200', count: '14 Slips', dot: '#b45309' },
                      { name: 'Private TPA Claims', share: '7.0%', amount: '₹23,200', count: '4 Claims', dot: '#9333ea' }
                    ].map((ch, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11.5 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: ch.dot }} />
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{ch.name}</span>
                          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>({ch.count})</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-secondary)' }}>{ch.share}</span>
                          <span style={{ fontWeight: 900, color: '#0f172a', minWidth: 68, textAlign: 'right' }}>{ch.amount}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Payment Mode Tender Breakdown - 5 Clean White Cards (No Greenery, Crisp Black Text) */}
              <div className="card" style={{ padding: 16, background: '#ffffff', border: '1px solid var(--border-default)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                      Payment Tender Settlement Breakdown & Register Reconciliation
                    </h3>
                    <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                      Drawer balancing: track physical cash in register vs electronic UPI / TPA credits
                    </p>
                  </div>
                  <span className="badge badge-ready">Register Reconciled</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                  {[
                    { tender: 'Cash Counter Drawer', amount: '₹48,200', count: '14 Slips', tag: 'Physical Cash' },
                    { tender: 'UPI QR Transfers', amount: '₹84,500', count: '28 Slips', tag: 'Direct HDFC VPA' },
                    { tender: 'POS Card Swipes', amount: '₹62,100', count: '16 Slips', tag: 'Station 03 Batch' },
                    { tender: 'PM-JAY Govt Cashless', amount: '₹1,24,000', count: '12 Patients', tag: '100% Cashless' },
                    { tender: 'Private TPA Claims', amount: '₹23,200', count: '4 Claims', tag: 'Pre-Authorized' }
                  ].map((t, idx) => (
                    <div 
                      key={idx} 
                      style={{ 
                        padding: '12px 14px', 
                        borderRadius: 'var(--radius-md)', 
                        background: '#ffffff', 
                        border: '1px solid var(--border-default)',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>{t.tender}</div>
                        <span style={{ fontSize: 9.5, padding: '1px 5px', borderRadius: 4, background: '#f8fafc', color: '#64748b', fontWeight: 600 }}>{t.tag}</span>
                      </div>
                      <div style={{ fontSize: 19, fontWeight: 900, color: '#0f172a', marginTop: 4 }}>
                        {t.amount}
                      </div>
                      <div style={{ fontSize: 10.5, color: '#64748b', marginTop: 3 }}>{t.count} settled</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* End-of-Day Fiscal Counter Balancing & ABDM Claim Settlement Ledger */}
              <div 
                className="card" 
                style={{ 
                  padding: '18px 22px', 
                  border: '1.5px solid #fde68a', 
                  background: 'linear-gradient(135deg, #ffffff 0%, #fef9f1 100%)' 
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div 
                      className="stat-squircle-badge" 
                      style={{ 
                        width: 36, 
                        height: 36, 
                        borderRadius: 10, 
                        background: 'linear-gradient(135deg, #f59e0b, #d97706)', 
                        color: '#ffffff', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        boxShadow: '0 4px 10px rgba(245, 158, 11, 0.35)' 
                      }}
                    >
                      <Landmark size={18} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: 14.5, fontWeight: 800, color: '#78350f', margin: 0 }}>
                        End-of-Day Fiscal Counter Balancing & ABDM Claim Settlement Ledger
                      </h3>
                      <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                        Counter B-02 daily reconciliation status • ABDM Insurance Claims & PM-JAY Cashless Package verification audit
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="badge badge-ready">
                      <ShieldCheck size={12} /> Cash Register Balanced
                    </span>
                    <span className="cashier-income-pill" style={{ padding: '2px 8px', borderRadius: 9999, fontSize: 10.5 }}>
                      Audit ID #CSH-2026-B02
                    </span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12, marginBottom: 14 }}>
                  <div style={{ background: '#ffffff', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>Physical Currency in Register</div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', marginTop: 3 }}>₹48,200.00</div>
                    <div style={{ fontSize: 10.5, color: '#64748b', marginTop: 2, fontWeight: 600 }}>14 Cash receipts verified • Exact tally</div>
                  </div>

                  <div style={{ background: '#ffffff', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>Dynamic UPI / QR Settlement</div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', marginTop: 3 }}>₹84,500.00</div>
                    <div style={{ fontSize: 10.5, color: '#64748b', marginTop: 2, fontWeight: 600 }}>28 Instant bank settlements cleared</div>
                  </div>

                  <div style={{ background: '#ffffff', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>POS Debit / Credit Card Swipes</div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', marginTop: 3 }}>₹62,100.00</div>
                    <div style={{ fontSize: 10.5, color: '#64748b', marginTop: 2, fontWeight: 600 }}>16 Slips • Merchant batch closed</div>
                  </div>

                  <div style={{ background: '#ffffff', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>Ayushman Bharat PM-JAY Cashless</div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', marginTop: 3 }}>₹1,24,000.00</div>
                    <div style={{ fontSize: 10.5, color: '#64748b', marginTop: 2, fontWeight: 600 }}>12 Beneficiary packages transmitted</div>
                  </div>

                  <div style={{ background: '#ffffff', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>Private TPA Insurance Pre-Auth</div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', marginTop: 3 }}>₹23,200.00</div>
                    <div style={{ fontSize: 10.5, color: '#64748b', marginTop: 2, fontWeight: 600 }}>4 Claims pending cashless adjudication</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #fde68a', paddingTop: 12, flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CheckCircle2 size={14} color="#d97706" />
                    <span>GST Tax Invoices synchronized with ABDM Health Facility Registry (HFR #TN-HFR-8812)</span>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      className="m3-btn m3-btn-outlined"
                      onClick={() => addToast('Daily Tally & ERP CSV Ledger export downloaded.', 'success')}
                      style={{ height: 30, fontSize: 11, padding: '0 12px' }}
                    >
                      <Download size={13} /> Export Ledger CSV
                    </button>
                    <button
                      type="button"
                      className="m3-btn m3-btn-filled"
                      onClick={() => addToast('Counter B-02 Day-End Settlement scroll printed.', 'success')}
                      style={{ height: 30, fontSize: 11, padding: '0 12px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)' }}
                    >
                      <Printer size={13} /> Print Day-End Scroll
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 2: ITEMIZED CHECKOUT QUEUE (cashierNav === 'billing')
              Dedicated Second Page: Unbuggy Full-Width Patient Billing & Settlement Queue
             ========================================================================= */}
          {cashierNav === 'billing' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Itemized Checkout Desk Banner */}
              <div 
                className="m3-doctor-patient-banner" 
                style={{ 
                  margin: 0, 
                  border: '1.5px solid var(--csh-banner-border, #fde68a)', 
                  background: 'var(--csh-banner-bg, linear-gradient(135deg, #ffffff 0%, #fef9f1 100%))' 
                }}
              >
                <div className="stat-card-accent-blob blob-yellow" style={{ top: -20, right: -20, width: 96, height: 96, opacity: 0.65 }} />
                <div className="m3-patient-banner-info" style={{ position: 'relative', zIndex: 1 }}>
                  <div 
                    className="stat-squircle-badge" 
                    style={{ 
                      width: 44, 
                      height: 44, 
                      borderRadius: 13, 
                      fontSize: 16, 
                      background: 'var(--csh-brand-gradient, linear-gradient(135deg, #f59e0b, #d97706))', 
                      color: '#ffffff', 
                      boxShadow: 'var(--csh-brand-shadow, 0 4px 10px rgba(245, 158, 11, 0.35))' 
                    }}
                  >
                    <Receipt size={20} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <h2 style={{ fontSize: 19, fontWeight: 900, color: 'var(--csh-banner-title, #78350f)', margin: 0 }}>
                        Itemized Checkout & Patient Settlement Queue
                      </h2>
                      <span className="badge badge-ready">Real-Time TPA & ABDM Connected</span>
                      {isGovtScheme && (
                        <span className="badge badge-active" style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }}>
                          <Landmark size={12} /> Ayushman Bharat PM-JAY Active
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 2, margin: 0 }}>
                      Comprehensive hospital invoice with itemized pharmacy dispensing bill and ABDM / Ayushman Bharat cashless settlement.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {onSwitchRole && (
                    <button 
                      className="m3-btn m3-btn-tonal"
                      onClick={() => onSwitchRole('doctor')}
                      title="Jump to Doctor Workspace"
                    >
                      <Stethoscope size={15} />
                      <span>Doctor Workspace</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Full-Width Billing Queue Table Card */}
              <div className="card m3-table-card" style={{ margin: 0 }}>
                <div className="card-header">
                  <div className="card-title-group">
                    <h2 className="card-title">Billing & Settlement Queue</h2>
                    <div className="card-subtitle-count">
                      {filteredPatients.length} Active Accounts • Click any patient row or "Settle Bill" to open itemized checkout dialog
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="badge badge-ready">Real-Time ABDM & TPA Active</span>
                  </div>
                </div>

                <div className="toolbar">
                  <div className="search-box" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Search size={16} color="var(--primary)" />
                    <input
                      type="text"
                      placeholder="Search billing accounts by patient name, MRN, phone, policy..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{ paddingRight: 34 }}
                    />
                    <SpeechMicButton 
                      onTranscript={(text) => setSearchQuery(text)} 
                      title="Voice search billing accounts"
                      style={{ position: 'absolute', right: 8 }}
                    />
                  </div>

                  <div className="filter-tabs">
                    <button
                      className={`filter-tab ${billingFilter === 'ALL' ? 'active' : ''}`}
                      onClick={() => setBillingFilter('ALL')}
                    >
                      All ({patients.length})
                    </button>
                    <button
                      className={`filter-tab ${billingFilter === 'READY' ? 'active' : ''}`}
                      onClick={() => setBillingFilter('READY')}
                    >
                      Ready to Settle
                    </button>
                    <button
                      className={`filter-tab ${billingFilter === 'PAID' ? 'active' : ''}`}
                      onClick={() => setBillingFilter('PAID')}
                    >
                      Settled ({patients.filter(p => p.billingStatus === 'PAID').length})
                    </button>
                    <button
                      className={`filter-tab ${billingFilter === 'GOVT' ? 'active' : ''}`}
                      onClick={() => setBillingFilter('GOVT')}
                    >
                      PM-JAY Scheme
                    </button>
                    <button
                      className={`filter-tab ${billingFilter === 'INSURANCE' ? 'active' : ''}`}
                      onClick={() => setBillingFilter('INSURANCE')}
                    >
                      Private TPA
                    </button>
                    <button
                      className={`filter-tab ${billingFilter === 'CASH' ? 'active' : ''}`}
                      onClick={() => setBillingFilter('CASH')}
                    >
                      Direct Cash
                    </button>
                  </div>
                </div>

                <div className="table-wrapper" style={{ overflowX: 'auto', width: '100%' }}>
                  <table className="patient-table">
                    <thead>
                      <tr>
                        <th style={{ width: 80, minWidth: 70 }}>MRN</th>
                        <th style={{ minWidth: 150 }}>Patient Information</th>
                        <th style={{ minWidth: 110 }}>Consulting Doctor</th>
                        <th style={{ minWidth: 115 }}>Coverage & ABHA</th>
                        <th style={{ width: 75, minWidth: 70 }}>Total Gross</th>
                        <th style={{ width: 95, minWidth: 90 }}>Patient Payable</th>
                        <th style={{ width: 85, minWidth: 80 }}>Billing Status</th>
                        <th style={{ width: 120, minWidth: 115, textAlign: 'right', paddingRight: 10 }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPatients.length === 0 ? (
                        <tr>
                          <td colSpan={8}>
                            <div className="empty-state">
                              <AlertCircle size={36} className="empty-icon" />
                              <p style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 15 }}>No matching billing accounts found</p>
                              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: 4 }}>
                                Try adjusting your search query or switching the filter tabs.
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredPatients.map((p, index) => {
                          const isSelected = p.id === patient?.id;
                          const isPaid = p.billingStatus === 'PAID';
                          const isReady = p.status === 'COMPLETED' || p.status === 'INSIGHTS_READY';
                          const pIsGovt = p.insurance?.type === 'GOVT_SCHEME';
                          const pIsInsured = p.insurance?.type === 'INSURANCE';
                          const avatarBg = AVATAR_COLORS[index % AVATAR_COLORS.length];

                          let pDue = grandGrossTotal;
                          if (pIsGovt) {
                            pDue = 0;
                          } else if (pIsInsured) {
                            const cov = (p.insurance?.coveragePct || 80) / 100;
                            const claim = Math.round(grandGrossTotal * cov);
                            pDue = Math.max(p.insurance?.deductible || 0, grandGrossTotal - claim);
                          }

                          return (
                            <tr
                              key={p.id}
                              className={`m3-row-animate ${isSelected ? 'selected' : ''}`}
                              onClick={() => {
                                setSelectedPatientId(p.id);
                                setSelectedReceipt(null);
                                if (pIsGovt) {
                                  setPaymentMethod('GOVT_PORTAL');
                                } else if (pIsInsured) {
                                  setPaymentMethod('TPA');
                                } else {
                                  setPaymentMethod('CARD');
                                }
                                setShowBillPopupModal(true);
                              }}
                              title="Click row to open itemized patient bill dialog"
                            >
                              <td>
                                <span className="mrn-tag">{p.mrn}</span>
                              </td>
                              <td>
                                <div className="patient-cell-wrapper">
                                  <div className="patient-avatar-chip" style={{ background: avatarBg }}>
                                    {getInitials(p.fullName)}
                                  </div>
                                  <div className="patient-name-cell">
                                    <span className="patient-name">{p.fullName}</span>
                                    <span className="patient-demographics-sub">
                                      {p.age} yrs • {p.gender} • <span style={{ color: 'var(--text-muted)' }}>{p.phone}</span>
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                                  {p.doctorAssigned.split('(')[0]}
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>
                                  {p.doctorAssigned.split('(')[1]?.replace(')', '') || 'General Medicine'}
                                </div>
                              </td>
                              <td>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                  <div style={{ fontSize: '12px', fontWeight: 700, color: pIsGovt ? '#b45309' : pIsInsured ? '#0284c7' : '#78350f' }}>
                                    {pIsGovt ? '🇮🇳 Ayushman Bharat PM-JAY' : pIsInsured ? `${p.insurance.provider.split(' ')[0]} (${p.insurance.coveragePct}%)` : 'Direct Self-Pay'}
                                  </div>
                                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '10.5px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                                    <Award size={11} color="#d97706" />
                                    <span>ABHA: {p.abhaId || p.insurance?.abhaId || '91-4820-1928-3819'}</span>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div style={{ fontWeight: 800, fontSize: 13, color: '#0f172a' }}>
                                  ₹{grandGrossTotal.toLocaleString()}
                                </div>
                                <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
                                  Proc: ₹14k • Meds: ₹6.1k
                                </div>
                              </td>
                              <td>
                                {pIsGovt ? (
                                  <div>
                                    <span style={{ fontSize: 13.5, fontWeight: 900, color: '#0f172a' }}>₹0</span>
                                    <div style={{ fontSize: 10, color: '#92400e', fontWeight: 700 }}>Ayushman Bharat 100% Cashless</div>
                                  </div>
                                ) : (
                                  <div>
                                    <span style={{ fontSize: 13.5, fontWeight: 900, color: '#0f172a' }}>
                                      ₹{pDue.toLocaleString()}
                                    </span>
                                    {pIsInsured && (
                                      <div style={{ fontSize: 10, color: '#0284c7' }}>After TPA Claim</div>
                                    )}
                                  </div>
                                )}
                              </td>
                              <td>
                                {isPaid ? (
                                  <span className="badge badge-ready" style={{ fontSize: 11 }}>
                                    <CheckCircle2 size={12} /> Settled
                                  </span>
                                ) : isReady ? (
                                  <span className="badge badge-active" style={{ fontSize: 11 }}>
                                    Ready to Settle
                                  </span>
                                ) : (
                                  <span className="badge badge-neutral" style={{ fontSize: 11 }}>
                                    In Session
                                  </span>
                                )}
                              </td>
                              <td style={{ textAlign: 'right', paddingRight: 24 }}>
                                {isPaid ? (
                                  <button
                                    type="button"
                                    className="m3-btn m3-btn-tonal"
                                    style={{ height: 32, fontSize: 11.5, padding: '0 12px', gap: 5 }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedPatientId(p.id);
                                      setSelectedReceipt(null);
                                      setShowInvoiceModal(true);
                                    }}
                                    title="View / Print Tax Invoice"
                                  >
                                    <Printer size={13} />
                                    <span>Invoice</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    className="m3-btn m3-btn-filled m3-btn-success"
                                    style={{ height: 32, fontSize: 11.5, padding: '0 12px', gap: 5 }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedPatientId(p.id);
                                      setSelectedReceipt(null);
                                      if (pIsGovt) {
                                        setPaymentMethod('GOVT_PORTAL');
                                      } else if (pIsInsured) {
                                        setPaymentMethod('TPA');
                                      } else {
                                        setPaymentMethod('CARD');
                                      }
                                      setShowBillPopupModal(true);
                                    }}
                                    title="Open Bill & Settle Pop-up"
                                  >
                                    <Receipt size={13} />
                                    <span>Settle Bill</span>
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 3: SETTLEMENT & RECEIPTS ARCHIVE (cashierNav === 'receipt')
              Dedicated Third Page: Reconciled Hospital Invoices, Tax Receipts & Print
             ========================================================================= */}
          {cashierNav === 'receipt' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Receipts Archive Header Banner */}
              <div 
                className="m3-doctor-patient-banner" 
                style={{ 
                  margin: 0, 
                  border: '1.5px solid var(--csh-banner-border, #fde68a)', 
                  background: 'var(--csh-banner-bg, linear-gradient(135deg, #ffffff 0%, #fef9f1 100%))' 
                }}
              >
                <div className="stat-card-accent-blob blob-yellow" style={{ top: -20, right: -20, width: 96, height: 96, opacity: 0.65 }} />
                <div className="m3-patient-banner-info" style={{ position: 'relative', zIndex: 1 }}>
                  <div 
                    className="stat-squircle-badge" 
                    style={{ 
                      width: 44, 
                      height: 44, 
                      borderRadius: 13, 
                      fontSize: 16, 
                      background: 'var(--csh-brand-gradient, linear-gradient(135deg, #f59e0b, #d97706))', 
                      color: '#ffffff', 
                      boxShadow: 'var(--csh-brand-shadow, 0 4px 10px rgba(245, 158, 11, 0.35))' 
                    }}
                  >
                    <FileCheck size={20} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <h2 style={{ fontSize: 19, fontWeight: 900, color: 'var(--csh-banner-title, #78350f)', margin: 0 }}>
                        Settlement & Receipts Archive
                      </h2>
                      <span className="badge badge-ready">24 Settled Slips Reconciled Today</span>
                    </div>
                    <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 2, margin: 0 }}>
                      Official fiscal receipts ledger, ABDM linked invoices, and payment tender audit trail with instant reprint support.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button 
                    className="m3-btn m3-btn-outlined"
                    onClick={() => addToast('Downloading comprehensive daily receipt register (PDF)...', 'success')}
                    style={{ height: 34, fontSize: 12, padding: '0 12px' }}
                  >
                    <Download size={14} /> Export Register PDF
                  </button>
                  <button 
                    className="m3-btn m3-btn-filled"
                    onClick={() => window.print()}
                    style={{ 
                      height: 34, 
                      fontSize: 12, 
                      padding: '0 12px', 
                      background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                      boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)' 
                    }}
                  >
                    <Printer size={14} /> Batch Print
                  </button>
                </div>
              </div>

              {/* Receipts KPI Summary Strip - Black Amounts */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                <div style={{ background: '#ffffff', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: '14px 16px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>Today's Settled Gross Volume</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', marginTop: 3 }}>₹3,42,800</div>
                  <div style={{ fontSize: 10.5, color: '#64748b', marginTop: 2 }}>24 Hospital invoices cleared</div>
                </div>

                <div style={{ background: '#ffffff', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: '14px 16px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>Dynamic UPI / Card Settled</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', marginTop: 3 }}>₹1,46,600</div>
                  <div style={{ fontSize: 10.5, color: '#64748b', marginTop: 2 }}>44 Electronic bank transfers</div>
                </div>

                <div style={{ background: '#ffffff', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: '14px 16px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>Ayushman Bharat PM-JAY Settled</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', marginTop: 3 }}>₹1,24,000</div>
                  <div style={{ fontSize: 10.5, color: '#64748b', marginTop: 2 }}>12 Govt beneficiary packages</div>
                </div>

                <div style={{ background: '#ffffff', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: '14px 16px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>Cash Register Drawer Verified</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', marginTop: 3 }}>₹48,200</div>
                  <div style={{ fontSize: 10.5, color: '#64748b', marginTop: 2 }}>14 Physical receipts reconciled</div>
                </div>
              </div>

              {/* Settled Receipts Ledger Table Card */}
              <div className="card m3-table-card" style={{ margin: 0 }}>
                <div className="card-header">
                  <div className="card-title-group">
                    <h2 className="card-title">Fiscal Settlement Archive & Invoices Ledger</h2>
                    <div className="card-subtitle-count">
                      {filteredReceipts.length} Settled Invoices Reconciled • Click "View Tax Invoice" or print receipt for official duplicate
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="badge badge-ready">Audit Status: 100% Balanced</span>
                  </div>
                </div>

                <div className="toolbar">
                  <div className="search-box" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Search size={16} color="var(--primary)" />
                    <input
                      type="text"
                      placeholder="Search settled receipts by invoice #, patient, MRN, transaction ID..."
                      value={receiptSearchQuery}
                      onChange={(e) => setReceiptSearchQuery(e.target.value)}
                      style={{ paddingRight: 34 }}
                    />
                    <SpeechMicButton 
                      onTranscript={(text) => setReceiptSearchQuery(text)} 
                      title="Voice search receipts"
                      style={{ position: 'absolute', right: 8 }}
                    />
                  </div>

                  <div className="filter-tabs">
                    <button
                      className={`filter-tab ${receiptFilter === 'ALL' ? 'active' : ''}`}
                      onClick={() => setReceiptFilter('ALL')}
                    >
                      All Receipts ({SETTLED_RECEIPTS_DATA.length})
                    </button>
                    <button
                      className={`filter-tab ${receiptFilter === 'UPI' ? 'active' : ''}`}
                      onClick={() => setReceiptFilter('UPI')}
                    >
                      UPI / QR
                    </button>
                    <button
                      className={`filter-tab ${receiptFilter === 'CASH' ? 'active' : ''}`}
                      onClick={() => setReceiptFilter('CASH')}
                    >
                      Cash Drawer
                    </button>
                    <button
                      className={`filter-tab ${receiptFilter === 'CARD' ? 'active' : ''}`}
                      onClick={() => setReceiptFilter('CARD')}
                    >
                      POS Cards
                    </button>
                    <button
                      className={`filter-tab ${receiptFilter === 'PM_JAY' ? 'active' : ''}`}
                      onClick={() => setReceiptFilter('PM_JAY')}
                    >
                      PM-JAY Cashless
                    </button>
                    <button
                      className={`filter-tab ${receiptFilter === 'TPA' ? 'active' : ''}`}
                      onClick={() => setReceiptFilter('TPA')}
                    >
                      Private TPA
                    </button>
                  </div>
                </div>

                <div className="table-wrapper" style={{ overflowX: 'auto', width: '100%' }}>
                  <table className="patient-table">
                    <thead>
                      <tr>
                        <th style={{ width: 110, minWidth: 100 }}>Invoice #</th>
                        <th style={{ minWidth: 150 }}>Patient Details</th>
                        <th style={{ minWidth: 120 }}>Date & Time</th>
                        <th style={{ minWidth: 130 }}>Consulting Doctor</th>
                        <th style={{ minWidth: 140 }}>Payment Method & Ref</th>
                        <th style={{ width: 95, minWidth: 90 }}>Settled (₹)</th>
                        <th style={{ width: 90, minWidth: 85 }}>ABDM Status</th>
                        <th style={{ width: 140, minWidth: 130, textAlign: 'right', paddingRight: 10 }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReceipts.length === 0 ? (
                        <tr>
                          <td colSpan={8}>
                            <div className="empty-state">
                              <AlertCircle size={36} className="empty-icon" />
                              <p style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 15 }}>No matching settled receipts found</p>
                              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: 4 }}>
                                Try adjusting your search query or switching payment method filters.
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredReceipts.map((rcp, index) => {
                          const avatarBg = AVATAR_COLORS[index % AVATAR_COLORS.length];

                          return (
                            <tr key={rcp.id} className="m3-row-animate">
                              <td>
                                <span className="mrn-tag" style={{ fontFamily: 'monospace' }}>{rcp.invNo}</span>
                              </td>
                              <td>
                                <div className="patient-cell-wrapper">
                                  <div className="patient-avatar-chip" style={{ background: avatarBg }}>
                                    {getInitials(rcp.patientName)}
                                  </div>
                                  <div className="patient-name-cell">
                                    <span className="patient-name">{rcp.patientName}</span>
                                    <span className="patient-demographics-sub">
                                      {rcp.mrn} • {rcp.age}y / {rcp.gender}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{rcp.date}</div>
                                <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>NABH Certified</div>
                              </td>
                              <td>
                                <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>{rcp.doctor}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{rcp.dept}</div>
                              </td>
                              <td>
                                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                                  {rcp.methodLabel}
                                </div>
                                <div style={{ fontSize: 10.5, color: '#78350f', fontFamily: 'monospace', fontWeight: 600 }}>
                                  Ref: {rcp.ref}
                                </div>
                              </td>
                              <td>
                                {rcp.method === 'PM_JAY' ? (
                                  <div>
                                    <span style={{ fontSize: 14, fontWeight: 900, color: '#0f172a' }}>₹0</span>
                                    <div style={{ fontSize: 10, color: '#92400e', fontWeight: 700 }}>100% Cashless</div>
                                  </div>
                                ) : (
                                  <div>
                                    <span style={{ fontSize: 14, fontWeight: 900, color: '#0f172a' }}>
                                      ₹{rcp.amount.toLocaleString()}
                                    </span>
                                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                                      Gross: ₹{rcp.gross.toLocaleString()}
                                    </div>
                                  </div>
                                )}
                              </td>
                              <td>
                                <span className="badge badge-ready" style={{ fontSize: 10.5 }}>
                                  <CheckCircle2 size={11} /> Verified
                                </span>
                              </td>
                              <td style={{ textAlign: 'right', paddingRight: 20 }}>
                                <div style={{ display: 'inline-flex', gap: 6 }}>
                                  <button
                                    type="button"
                                    className="m3-btn m3-btn-tonal"
                                    style={{ height: 30, fontSize: 11, padding: '0 10px', gap: 4 }}
                                    onClick={() => {
                                      setSelectedReceipt(rcp);
                                      setShowInvoiceModal(true);
                                    }}
                                    title="View Hospital Tax Invoice"
                                  >
                                    <Printer size={12} />
                                    <span>Invoice</span>
                                  </button>
                                  <button
                                    type="button"
                                    className="m3-btn m3-btn-outlined"
                                    style={{ height: 30, fontSize: 11, padding: '0 8px' }}
                                    onClick={() => addToast(`Receipt ${rcp.invNo} reprinted successfully.`, 'success')}
                                    title="Quick reprint"
                                  >
                                    <Download size={12} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* =========================================================================
          FULL ITEMIZED BILL & SETTLEMENT POP-UP MODAL
          Warm Amber Palette, Crisp Black Text, Zero Greenery
         ========================================================================= */}
      {showBillPopupModal && patient && (
        <div className="modal-overlay m3-dialog-backdrop" onClick={() => setShowBillPopupModal(false)}>
          <div 
            className="modal-content m3-dialog-container" 
            style={{ maxWidth: 860, padding: 24, maxHeight: '88vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }} 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="m3-dialog-header" style={{ padding: '16px 24px 14px', margin: '-24px -24px 16px -24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexShrink: 0 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="mrn-tag">{patient.mrn}</span>
                  {isGovtScheme ? (
                    <span className="badge badge-ready" style={{ fontSize: 11 }}>
                      <Landmark size={12} /> Ayushman Bharat PM-JAY Cashless
                    </span>
                  ) : isPrivateInsured ? (
                    <span className="badge badge-active" style={{ fontSize: 11 }}>
                      Private TPA Policy
                    </span>
                  ) : (
                    <span className="badge badge-neutral" style={{ fontSize: 11 }}>
                      Direct Self-Pay
                    </span>
                  )}
                  <span className="badge badge-ready" style={{ fontSize: 11 }}>
                    ABHA: {patient.abhaId || patient.insurance?.abhaId || '91-4820-1928-3819'}
                  </span>
                  {!isGovtScheme && (
                    <button 
                      type="button"
                      className="m3-btn m3-btn-tonal"
                      onClick={handleApplyGovtScheme}
                      style={{ color: '#78350f', background: '#fef3c7', border: '1px solid #fde68a', fontSize: 11, padding: '3px 8px', gap: 4 }}
                      title="Switch this patient to 100% Cashless Ayushman Bharat PM-JAY Scheme"
                    >
                      <Landmark size={12} />
                      <span>Apply PM-JAY Scheme</span>
                    </button>
                  )}
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 900, color: '#ffffff', marginTop: 4, letterSpacing: '-0.01em' }}>
                  Itemized Bill & Pharmacy Dispensing — {patient.fullName}
                </h3>
                <div style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.95)', marginTop: 2 }}>
                  {patient.age}y {patient.gender} • Doctor: {patient.doctorAssigned} • Insurance: {patient.insurance.provider}
                </div>
              </div>

              <button 
                className="icon-btn" 
                onClick={() => setShowBillPopupModal(false)}
                style={{ color: '#ffffff', background: 'rgba(255, 255, 255, 0.15)' }}
                title="Close Pop-up"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="m3-scrollable-body" style={{ flex: 1, overflowY: 'auto', paddingRight: 6 }}>
              {/* Part 1: Hospital Clinical Services */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FileCheck size={15} color="var(--primary)" />
                    <span>Hospital Clinical & Diagnostic Procedures</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#0f172a' }}>
                    Subtotal: ₹{clinicalGross.toLocaleString()}
                  </span>
                </div>

                <div className="table-wrapper">
                  <table className="patient-table">
                    <thead>
                      <tr>
                        <th>Item Description</th>
                        <th>Code</th>
                        <th>Qty</th>
                        <th>Unit Rate (₹)</th>
                        <th>Scheme</th>
                        <th style={{ textAlign: 'right' }}>Total (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {CLINICAL_PROCEDURES.map((item) => (
                        <tr key={item.id}>
                          <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{item.desc}</td>
                          <td><span className="mrn-tag" style={{ fontSize: 10 }}>{item.code}</span></td>
                          <td>{item.qty}</td>
                          <td style={{ color: '#0f172a', fontWeight: 600 }}>₹{item.unitPrice.toLocaleString()}</td>
                          <td>
                            {isGovtScheme ? (
                              <span style={{ color: '#b45309', fontWeight: 700, fontSize: 11 }}>✓ 100% PM-JAY</span>
                            ) : isPrivateInsured ? (
                              <span style={{ color: '#0284c7', fontWeight: 700, fontSize: 11 }}>✓ TPA ({patient.insurance.coveragePct}%)</span>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Self-Pay</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>₹{(item.qty * item.unitPrice).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Part 2: Hospital Pharmacy Medicines */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Pill size={15} color="#d97706" />
                    <span>Dispensed Hospital Pharmacy Medicines</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#0f172a' }}>
                    Subtotal: ₹{pharmacyGross.toLocaleString()} (Incl. ₹{pharmacyGst} GST)
                  </span>
                </div>

                <div className="table-wrapper">
                  <table className="patient-table">
                    <thead>
                      <tr>
                        <th>Medicine & Formulation</th>
                        <th>Batch</th>
                        <th>Exp</th>
                        <th>Qty</th>
                        <th>Unit Rate (₹)</th>
                        <th>GST</th>
                        <th style={{ textAlign: 'right' }}>Total (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activePharmacyMedicines.map((med) => {
                        const base = med.qty * med.unitPrice;
                        const gst = Math.round(base * (med.gstPct / 100));
                        const lineTotal = base + gst;
                        return (
                          <tr key={med.id}>
                            <td>
                              <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{med.name}</div>
                              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{med.form}</div>
                            </td>
                            <td><span className="mrn-tag" style={{ fontSize: 10 }}>{med.batch}</span></td>
                            <td style={{ fontSize: 11 }}>{med.exp}</td>
                            <td style={{ fontWeight: 600 }}>{med.qty}</td>
                            <td style={{ color: '#0f172a', fontWeight: 600 }}>₹{med.unitPrice.toLocaleString()}</td>
                            <td style={{ fontSize: 10.5 }}>{med.gstPct}%</td>
                            <td style={{ textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>₹{lineTotal.toLocaleString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Part 3: Financial Summary Grid - Bold Black Numbers, Warm Amber Highlight */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', 
                gap: 12, 
                backgroundColor: 'var(--bg-subtle)', 
                borderRadius: 'var(--radius-lg)', 
                padding: 14, 
                border: 'none',
                marginBottom: 16 
              }}>
                <div>
                  <span className="info-key">Total Gross Invoice</span>
                  <div style={{ fontSize: 16, fontWeight: 900, color: '#0f172a', marginTop: 2 }}>
                    ₹{grandGrossTotal.toLocaleString()}
                  </div>
                </div>

                <div>
                  <span className="info-key">{isGovtScheme ? 'Govt PM-JAY Coverage' : 'TPA Claim Settlement'}</span>
                  <div style={{ fontSize: 16, fontWeight: 900, color: '#78350f', marginTop: 2 }}>
                    - ₹{insuranceClaim.toLocaleString()}
                  </div>
                </div>

                <div>
                  <span className="info-key">Deductible / Co-Pay</span>
                  <div style={{ fontSize: 16, fontWeight: 900, color: '#b45309', marginTop: 2 }}>
                    ₹{deductible.toLocaleString()}
                  </div>
                </div>

                <div style={{ 
                  background: '#fef3c7', 
                  padding: '8px 14px', 
                  borderRadius: 'var(--radius-md)', 
                  border: '1.5px solid #fde68a'
                }}>
                  <span className="info-key" style={{ color: '#78350f', fontWeight: 800 }}>
                    {isGovtScheme ? 'Out-of-Pocket Net' : 'Net Amount Due'}
                  </span>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', marginTop: 2 }}>
                    ₹{patientNetPayable.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Part 4: Settlement Method Selection */}
              <div style={{ marginTop: 14, marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div className="section-label" style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Select Settlement Method
                  </div>
                  {isGovtScheme && (
                    <span style={{ fontSize: 11, color: '#b45309', fontWeight: 700 }}>
                      ✓ PM-JAY Cashless Auto-Selected (₹0 Out-of-pocket)
                    </span>
                  )}
                </div>

                <div className="m3-payment-options-grid">
                  <div
                    className={`m3-payment-card ${paymentMethod === 'GOVT_PORTAL' ? 'active' : ''}`}
                    onClick={() => {
                      if (!isGovtScheme) handleApplyGovtScheme();
                      setPaymentMethod('GOVT_PORTAL');
                    }}
                  >
                    <Landmark size={20} color={paymentMethod === 'GOVT_PORTAL' ? '#78350f' : '#d97706'} />
                    <span className="m3-payment-title">PM-JAY Govt Cashless</span>
                  </div>

                  <div
                    className={`m3-payment-card ${paymentMethod === 'TPA' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('TPA')}
                  >
                    <ShieldCheck size={20} color={paymentMethod === 'TPA' ? '#78350f' : 'var(--primary)'} />
                    <span className="m3-payment-title">TPA Pre-Approved</span>
                  </div>

                  <div
                    className={`m3-payment-card ${paymentMethod === 'CARD' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('CARD')}
                  >
                    <CreditCard size={20} color={paymentMethod === 'CARD' ? '#78350f' : 'var(--text-secondary)'} />
                    <span className="m3-payment-title">Credit / Debit Card</span>
                  </div>

                  <div
                    className={`m3-payment-card ${paymentMethod === 'UPI' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('UPI')}
                  >
                    <QrCode size={20} color={paymentMethod === 'UPI' ? '#78350f' : 'var(--text-secondary)'} />
                    <span className="m3-payment-title">UPI / QR Code</span>
                  </div>

                  <div
                    className={`m3-payment-card ${paymentMethod === 'CASH' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('CASH')}
                  >
                    <Banknote size={20} color={paymentMethod === 'CASH' ? '#78350f' : 'var(--text-secondary)'} />
                    <span className="m3-payment-title">Cash Counter</span>
                  </div>
                </div>

                {/* Interactive Dynamic Payment Channel Preview */}
                {paymentMethod === 'UPI' && (
                  <div style={{
                    marginTop: 10,
                    padding: '12px 16px',
                    borderRadius: 10,
                    background: '#f8fafc',
                    border: '1.5px solid #0284c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 12
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 48,
                        height: 48,
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: 8,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <QrCode size={34} color="#0284c7" />
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)' }}>
                          Dynamic Patient UPI QR Code
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                          VPA: <strong>brightsolutions@hdfcbank</strong> • Amount: <strong style={{ color: '#0f172a' }}>₹{patientNetPayable.toLocaleString()}</strong>
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                          Scan with BHIM, Google Pay, PhonePe, or Paytm
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="m3-btn m3-btn-sm"
                      onClick={() => {
                        const ref = `UPI-${Math.floor(100000 + Math.random() * 900000)}`;
                        setCashierNotes(`Verified via UPI QR • Ref #${ref}`);
                        addToast(`UPI Payment of ₹${patientNetPayable.toLocaleString()} confirmed via QR scan!`, 'success');
                      }}
                      style={{ height: 28, fontSize: 11, background: '#0284c7', color: '#ffffff' }}
                    >
                      ⚡ Simulate UPI Scan & Pay
                    </button>
                  </div>
                )}

                {paymentMethod === 'CARD' && (
                  <div style={{
                    marginTop: 10,
                    padding: '10px 14px',
                    borderRadius: 10,
                    background: '#fef9f1',
                    border: '1px solid #fde68a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: 11.5,
                    color: '#78350f'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <CreditCard size={18} color="#d97706" />
                      <span><strong>POS Card Terminal Station 03:</strong> Ready for Chip, Contactless NFC Tap, or Swipe.</span>
                    </div>
                    <button
                      type="button"
                      className="m3-btn m3-btn-sm"
                      onClick={() => {
                        setCashierNotes(`Card Auth Code: AUTH-${Math.floor(100000 + Math.random() * 900000)} (VISA/MC Chip verified)`);
                        addToast('Card chip read successful! Transaction pre-authorized.', 'success');
                      }}
                      style={{ height: 26, fontSize: 10.5, background: '#d97706', color: '#ffffff' }}
                    >
                      Simulate Tap / Chip
                    </button>
                  </div>
                )}

                {/* Cash Tender & Live Change Due Calculator */}
                {paymentMethod === 'CASH' && (
                  <div style={{
                    marginTop: 10,
                    padding: '12px 16px',
                    borderRadius: 10,
                    background: '#fefce8',
                    border: '1.5px solid #fde047',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Banknote size={18} color="#ca8a04" />
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)' }}>
                            Cash Change Calculator
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                            Eliminates register mental math errors during physical cash collection
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {[patientNetPayable, Math.ceil(patientNetPayable / 500) * 500, Math.ceil(patientNetPayable / 1000) * 1000, Math.ceil(patientNetPayable / 2000) * 2000].filter((v, i, a) => v > 0 && a.indexOf(v) === i).slice(0, 3).map((val, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setCashReceived(String(val))}
                            className="m3-btn m3-btn-tonal"
                            style={{ height: 26, fontSize: 11, padding: '0 8px' }}
                          >
                            ₹{val.toLocaleString()}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, alignItems: 'center' }}>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                          Cash Tender Amount Received (₹):
                        </label>
                        <input
                          type="number"
                          value={cashReceived}
                          onChange={(e) => setCashReceived(e.target.value)}
                          placeholder={`Enter amount (e.g. ₹${patientNetPayable})`}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-default)',
                            background: '#ffffff',
                            color: '#0f172a',
                            fontSize: 13,
                            fontWeight: 700,
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      <div style={{
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-sm)',
                        background: '#ffffff',
                        border: '1px solid #fde047',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center'
                      }}>
                        <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                          Change Due to Patient:
                        </span>
                        <div style={{
                          fontSize: 18,
                          fontWeight: 900,
                          color: '#0f172a'
                        }}>
                          ₹{Math.max(0, (Number(cashReceived) || 0) - patientNetPayable).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Cashier Remarks / Reference with STT */}
                <div style={{ marginTop: 12 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                    Cashier Remarks & Transaction Note (Optional)
                  </label>
                  <div className="m3-input-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type="text"
                      className="m3-input"
                      placeholder="e.g. UPI Ref #98124, DD received, or cash counter receipt..."
                      value={cashierNotes}
                      onChange={(e) => setCashierNotes(e.target.value)}
                      style={{ height: 36, fontSize: 12, paddingLeft: 12, paddingRight: 36 }}
                    />
                    <SpeechMicButton 
                      onTranscript={(text) => setCashierNotes(prev => prev ? `${prev} ${text}` : text)}
                      title="Voice dictate cashier remarks"
                      style={{ position: 'absolute', right: 8 }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Bottom Action Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: 14, marginTop: 12, flexShrink: 0 }}>
              <button className="m3-btn m3-btn-outlined" onClick={() => setShowBillPopupModal(false)}>
                Close Pop-up
              </button>

              <div style={{ display: 'flex', gap: 10 }}>
                {isAlreadyBilled && (
                  <button 
                    className="m3-btn m3-btn-outlined"
                    onClick={() => {
                      setShowBillPopupModal(false);
                      setShowInvoiceModal(true);
                    }}
                  >
                    <Printer size={15} />
                    <span>View / Print Invoice</span>
                  </button>
                )}

                <button
                  className="m3-btn m3-btn-filled m3-btn-success"
                  onClick={() => {
                    handleProcessPayment();
                    setShowBillPopupModal(false);
                  }}
                  disabled={isProcessing}
                  style={{ 
                    height: 38,
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    color: '#ffffff',
                    boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)'
                  }}
                >
                  <Receipt size={15} />
                  <span>
                    {isProcessing 
                      ? 'Processing...' 
                      : isGovtScheme 
                      ? 'Settle 100% Cashless' 
                      : `Collect ₹${patientNetPayable.toLocaleString()} & Settle`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          OFFICIAL TAX INVOICE & MEDICINE DISPENSING RECEIPT MODAL
          Shared by Itemized Checkout and Settlement & Receipts Archive
         ========================================================================= */}
      {showInvoiceModal && activeInvoiceData && (
        <div className="modal-overlay m3-dialog-backdrop" onClick={() => setShowInvoiceModal(false)}>
          <div 
            className="modal-content m3-dialog-container" 
            style={{ maxWidth: 760, padding: 28, maxHeight: '90vh', overflowY: 'auto' }} 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Invoice Hospital Header */}
            <div className="m3-dialog-header" style={{ padding: '18px 24px 14px', margin: '-28px -28px 18px -28px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ fontSize: 19, fontWeight: 900, color: '#ffffff' }}>
                  BRIGHT SOLUTIONS MULTISPECIALITY HOSPITAL
                </h2>
                <p style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.92)', marginTop: 2 }}>
                  NABH Accredited Multispeciality Medical Centre • GSTIN: 33AAACG1234F1Z8 • DL: 20B/21B-44120
                </p>
                <p style={{ fontSize: 10.5, color: 'rgba(255, 255, 255, 0.85)' }}>
                  124 Healthcare Boulevard, Medical District • ABDM Facility ID: IN33000881
                </p>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span className="badge badge-ready" style={{ fontSize: 11.5, padding: '4px 10px', background: '#fef3c7', color: '#78350f', border: '1px solid #fde68a' }}>
                  {activeInvoiceData.isGovtScheme ? 'GOVT CASHLESS SETTLEMENT' : 'PAID IN FULL'}
                </span>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#ffffff', marginTop: 5, letterSpacing: '0.02em', textShadow: '0 1px 2px rgba(0,0,0,0.15)' }}>
                  {activeInvoiceData.invNo}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.92)', fontWeight: 500 }}>
                  Date: {activeInvoiceData.date}
                </div>
              </div>
            </div>

            {/* Patient & Scheme Meta Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16, fontSize: 11.5, background: 'var(--bg-subtle)', padding: 12, borderRadius: 'var(--radius-sm)' }}>
              <div>
                <strong>Billed To:</strong>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>{activeInvoiceData.fullName} ({activeInvoiceData.age}y / {activeInvoiceData.gender})</div>
                <div>MRN: {activeInvoiceData.mrn} • Phone: {activeInvoiceData.phone}</div>
                <div style={{ color: '#0284c7', fontWeight: 600 }}>
                  ABHA ID: 91-4820-1928-3819
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <strong>Billing & Scheme Details:</strong>
                <div>Coverage: {activeInvoiceData.provider}</div>
                <div>Policy / Ref: {activeInvoiceData.policyNumber}</div>
                <div style={{ color: '#78350f', fontWeight: 600 }}>
                  Settlement Method: {activeInvoiceData.paymentMethod}
                </div>
              </div>
            </div>

            {/* Part 1: Hospital Clinical Services */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
                1. Clinical Consultations & Diagnostic Imaging
              </div>
              <table style={{ width: '100%', fontSize: 11.5, borderCollapse: 'collapse', border: '1px solid var(--border-default)' }}>
                <thead style={{ background: 'var(--bg-subtle)' }}>
                  <tr>
                    <th style={{ padding: '6px 10px', textAlign: 'left' }}>Description</th>
                    <th style={{ padding: '6px 10px', textAlign: 'center' }}>Code</th>
                    <th style={{ padding: '6px 10px', textAlign: 'center' }}>Qty</th>
                    <th style={{ padding: '6px 10px', textAlign: 'right' }}>Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {CLINICAL_PROCEDURES.map((item) => (
                    <tr key={item.id} style={{ borderTop: '1px solid var(--border-default)' }}>
                      <td style={{ padding: '6px 10px' }}>{item.desc}</td>
                      <td style={{ padding: '6px 10px', textAlign: 'center', fontFamily: 'monospace', fontSize: 10.5 }}>{item.code}</td>
                      <td style={{ padding: '6px 10px', textAlign: 'center' }}>{item.qty}</td>
                      <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>₹{(item.qty * item.unitPrice).toLocaleString()}</td>
                    </tr>
                  ))}
                  <tr style={{ borderTop: '1px solid var(--border-default)', background: 'var(--bg-subtle)', fontWeight: 700 }}>
                    <td colSpan={3} style={{ padding: '6px 10px' }}>Clinical Services Subtotal</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 900, color: '#0f172a' }}>₹{clinicalGross.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Part 2: Itemized Pharmacy Medicine Dispensing */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
                2. Itemized Hospital Pharmacy Medicines Dispensed
              </div>
              <table style={{ width: '100%', fontSize: 11.5, borderCollapse: 'collapse', border: '1px solid var(--border-default)' }}>
                <thead style={{ background: 'var(--bg-subtle)' }}>
                  <tr>
                    <th style={{ padding: '6px 10px', textAlign: 'left' }}>Medicine & Form</th>
                    <th style={{ padding: '6px 10px', textAlign: 'center' }}>Batch</th>
                    <th style={{ padding: '6px 10px', textAlign: 'center' }}>Exp</th>
                    <th style={{ padding: '6px 10px', textAlign: 'center' }}>Qty</th>
                    <th style={{ padding: '6px 10px', textAlign: 'center' }}>GST</th>
                    <th style={{ padding: '6px 10px', textAlign: 'right' }}>Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {activePharmacyMedicines.map((med) => {
                    const base = med.qty * med.unitPrice;
                    const gst = Math.round(base * (med.gstPct / 100));
                    const total = base + gst;

                    return (
                      <tr key={med.id} style={{ borderTop: '1px solid var(--border-default)' }}>
                        <td style={{ padding: '6px 10px' }}>
                          <strong>{med.name}</strong> <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>({med.form})</span>
                        </td>
                        <td style={{ padding: '6px 10px', textAlign: 'center', fontFamily: 'monospace', fontSize: 10 }}>{med.batch}</td>
                        <td style={{ padding: '6px 10px', textAlign: 'center', fontSize: 10.5 }}>{med.exp}</td>
                        <td style={{ padding: '6px 10px', textAlign: 'center' }}>{med.qty}</td>
                        <td style={{ padding: '6px 10px', textAlign: 'center', fontSize: 10 }}>{med.gstPct}%</td>
                        <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>₹{total.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                  <tr style={{ borderTop: '1px solid var(--border-default)', background: 'var(--bg-subtle)', fontWeight: 700 }}>
                    <td colSpan={5} style={{ padding: '6px 10px' }}>Pharmacy Medicines Subtotal (Incl. ₹{pharmacyGst} GST)</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 900, color: '#0f172a' }}>₹{pharmacyGross.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Total Settlement Box - Warm Amber Border & Crisp Black Text */}
            <div style={{ border: '1.5px solid #fde68a', borderRadius: 'var(--radius-md)', padding: 14, background: '#fef9f1', marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4, color: 'var(--text-secondary)' }}>
                <span>Gross Hospital Invoice (Clinical + Medicines):</span>
                <strong style={{ color: '#0f172a' }}>₹{activeInvoiceData.grandGrossTotal.toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#78350f', marginBottom: 4 }}>
                <span>{activeInvoiceData.isGovtScheme ? 'Ayushman Bharat PM-JAY Cashless Package:' : 'TPA Claim Settlement:'}</span>
                <strong>- ₹{activeInvoiceData.insuranceClaim.toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 900, borderTop: '1px solid #fde68a', paddingTop: 6, color: '#0f172a' }}>
                <span>Net Amount Paid by Patient ({activeInvoiceData.paymentMethod}):</span>
                <span style={{ fontSize: 18, fontWeight: 900, color: '#0f172a' }}>₹{activeInvoiceData.patientNetPayable.toLocaleString()}</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: 14 }}>
              <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
                Official ABDM & GST Compliant Digital Tax Invoice. Computer verified.
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button 
                  className="m3-btn m3-btn-outlined" 
                  onClick={() => {
                    addToast(`Official Tax Invoice PDF downloaded for ${activeInvoiceData.fullName}.`, 'success');
                  }}
                  style={{ height: 32, fontSize: 11.5 }}
                >
                  <Download size={14} /> Download PDF
                </button>
                <button 
                  className="m3-btn m3-btn-outlined" 
                  onClick={() => {
                    addToast(`Tax invoice & gate pass sent via WhatsApp/SMS to ${activeInvoiceData.phone}.`, 'success');
                  }}
                  style={{ height: 32, fontSize: 11.5 }}
                >
                  <Phone size={14} /> Send WhatsApp
                </button>
                <button 
                  className="m3-btn m3-btn-outlined" 
                  onClick={() => window.print()}
                  style={{ height: 32, fontSize: 11.5 }}
                >
                  <Printer size={14} /> Print Invoice
                </button>
                <button 
                  className="m3-btn m3-btn-filled" 
                  onClick={() => setShowInvoiceModal(false)}
                  style={{ 
                    height: 32, 
                    fontSize: 11.5,
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    color: '#ffffff'
                  }}
                >
                  Close & Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
