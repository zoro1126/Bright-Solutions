import React, { useState, useMemo } from 'react';
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
  Clock
} from 'lucide-react';
import SpeechMicButton from '../components/SpeechMicButton';

const AVATAR_COLORS = [
  'linear-gradient(135deg, #0284c7, #0369a1)',
  'linear-gradient(135deg, #10b981, #059669)',
  'linear-gradient(135deg, #6366f1, #4f46e5)',
  'linear-gradient(135deg, #f59e0b, #d97706)',
  'linear-gradient(135deg, #ec4899, #db2777)'
];

const CLINICAL_PROCEDURES = [
  { id: 'proc-1', desc: 'Specialist Medical Oncology Consultation (Dr. Kiran Patel)', code: 'ONC-CONS-01', dept: 'Clinical Oncology', qty: 1, unitPrice: 2500, coveredByInsurance: true },
  { id: 'proc-2', desc: 'High-Resolution Contrast CT Chest Scan (148 Slices)', code: 'RAD-CT-CHEST', dept: 'Radiology Imaging', qty: 1, unitPrice: 6800, coveredByInsurance: true },
  { id: 'proc-3', desc: 'Oncology Serum Biomarker Panel (CA 15-3 & CEA)', code: 'LAB-BIO-153', dept: 'Clinical Biochemistry', qty: 1, unitPrice: 3200, coveredByInsurance: true },
  { id: 'proc-4', desc: 'Daycare Oncology Infusion Chair & Clinical Triage Administration', code: 'ADM-DAY-TRIAGE', dept: 'Daycare Chemotherapy', qty: 1, unitPrice: 1500, coveredByInsurance: true }
];

const PHARMACY_MEDICINES = [
  { id: 'rx-1', name: 'Letrozole 2.5mg (Femara)', form: 'Tablet (Pack of 30)', batch: 'LT-8841', exp: '12/2027', qty: 90, unitPrice: 35, gstPct: 5, coveredByInsurance: true },
  { id: 'rx-2', name: 'Calcium Carbonate + Vit D3 (Shelcal 500)', form: 'Tablet (Pack of 15)', batch: 'CD-2029', exp: '08/2027', qty: 180, unitPrice: 6, gstPct: 5, coveredByInsurance: true },
  { id: 'rx-3', name: 'Ondansetron 4mg (Emeset)', form: 'Tablet (Strip of 10)', batch: 'ON-1140', exp: '05/2028', qty: 15, unitPrice: 18, gstPct: 5, coveredByInsurance: true },
  { id: 'rx-4', name: 'Paracetamol 650mg SOS (Dolo)', form: 'Tablet (Strip of 15)', batch: 'PC-7712', exp: '03/2028', qty: 20, unitPrice: 3.5, gstPct: 5, coveredByInsurance: true },
  { id: 'rx-5', name: 'Sterile Oncology Port Needle & Infusion Line Kit', form: 'Sterile Kit', batch: 'SC-4401', exp: '10/2028', qty: 1, unitPrice: 1200, gstPct: 12, coveredByInsurance: true }
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

  // Calculate Itemized Pharmacy Medicines Subtotal + GST (dynamically linked to Doctor's Digital Rx)
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

  // Grand Gross Total
  const grandGrossTotal = clinicalGross + pharmacyGross;

  // Claim settlement calculations
  let insuranceClaim = 0;
  let deductible = 0;
  let patientNetPayable = 0;

  if (isGovtScheme) {
    // 100% Cashless Government Coverage under Ayushman Bharat PM-JAY / CGHS
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
    // Self-Pay / Cash
    insuranceClaim = 0;
    deductible = 0;
    patientNetPayable = grandGrossTotal;
  }

  const isAlreadyBilled = patient.billingStatus === 'PAID';

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

  // Quick switcher to toggle Govt Scheme / TPA at billing desk
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

  return (
    <div className="m3-app-shell">
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

        <main className="page-container cashier-page-container m3-page-animate" style={{ maxWidth: '100%', width: '100%', margin: '0', padding: '16px 20px', boxSizing: 'border-box' }}>
          {/* Cashier Operations Dashboard KPIs (P-CSH-01) */}
          {cashierNav === 'dashboard' && (
            <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-card-accent-blob blob-green" />
                  <div className="stat-squircle-badge badge-bg-green">
                    <Receipt size={16} strokeWidth={2.4} />
                  </div>
                  <div className="stat-card-value">₹3.42L</div>
                  <div className="stat-card-label">Gross Collections Today</div>
                </div>

                <div className="stat-card">
                  <div className="stat-card-accent-blob blob-yellow" />
                  <div className="stat-squircle-badge badge-bg-yellow">
                    <Clock size={16} strokeWidth={2.4} />
                  </div>
                  <div className="stat-card-value">
                    {patients.filter(p => p.billingStatus !== 'PAID').length}
                  </div>
                  <div className="stat-card-label">Unbilled Queue Count</div>
                </div>

                <div className="stat-card">
                  <div className="stat-card-accent-blob blob-blue" />
                  <div className="stat-squircle-badge badge-bg-blue">
                    <CheckCircle2 size={16} strokeWidth={2.4} />
                  </div>
                  <div className="stat-card-value">
                    {patients.filter(p => p.billingStatus === 'PAID').length + 18}
                  </div>
                  <div className="stat-card-label">Invoices Settled</div>
                </div>

                <div className="stat-card">
                  <div className="stat-card-accent-blob blob-rose" />
                  <div className="stat-squircle-badge badge-bg-rose">
                    <Landmark size={16} strokeWidth={2.4} />
                  </div>
                  <div className="stat-card-value">100%</div>
                  <div className="stat-card-label">PM-JAY Cashless Cleared</div>
                </div>
              </div>

              {/* Payment Mode Tender Breakdown */}
              <div className="card" style={{ padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                      Payment Tender Settlement Breakdown & Register Reconciliation
                    </h3>
                    <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                      Drawer balancing: track physical cash in register vs electronic UPI / TPA credits
                    </p>
                  </div>
                  <span className="badge badge-ready">Register Reconciled</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
                  {[
                    { tender: 'Cash Counter Drawer', amount: '₹48,200', count: '14 Slips', color: '#d97706', bg: '#fef3c7' },
                    { tender: 'UPI QR Transfers', amount: '₹84,500', count: '28 Slips', color: '#0284c7', bg: '#eff6ff' },
                    { tender: 'POS Card Swipes', amount: '₹62,100', count: '16 Slips', color: '#15803d', bg: '#dcfce7' },
                    { tender: 'PM-JAY Govt Cashless', amount: '₹1,24,000', count: '12 Patients', color: '#065f46', bg: '#ecfdf5' },
                    { tender: 'Private TPA Claims', amount: '₹23,200', count: '4 Claims', color: '#7c3aed', bg: '#f3e8ff' }
                  ].map((t, idx) => (
                    <div key={idx} style={{ padding: 12, borderRadius: 'var(--radius-md)', background: t.bg, border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: 10.5, fontWeight: 700, color: t.color }}>{t.tender}</div>
                      <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-primary)', marginTop: 2 }}>{t.amount}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>{t.count} settled</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Cashier Desk Banner - Styled like Reception Stat-Cards */}
          <div className="m3-doctor-patient-banner" style={{ marginBottom: 16 }}>
            {/* Ambient Pastel Blob in Top-Right Corner */}
            <div className="stat-card-accent-blob blob-green" style={{ top: -20, right: -20, width: 96, height: 96, opacity: 0.65 }} />

            <div className="m3-patient-banner-info" style={{ position: 'relative', zIndex: 1 }}>
              <div className="stat-squircle-badge badge-bg-green" style={{ width: 44, height: 44, borderRadius: 13, fontSize: 16 }}>
                <Receipt size={20} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <h2 style={{ fontSize: 19, fontWeight: 800, color: 'var(--text-primary)' }}>
                    Cashier & Settlement Desk
                  </h2>
                  <span className="badge badge-ready">Real-Time TPA & ABDM Connected</span>
                  {isGovtScheme && (
                    <span className="badge badge-active" style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #6ee7b7' }}>
                      <Landmark size={12} /> Ayushman Bharat PM-JAY Active
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 2 }}>
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

          {/* Full-Width Billing Queue Table */}
          <div className="card m3-table-card">
            <div className="card-header">
              <div className="card-title-group">
                <h2 className="card-title">Billing & Settlement Queue</h2>
                <div className="card-subtitle-count">
                  {filteredPatients.length} Active Accounts • Click any patient row or "Settle Bill" to open itemized billing popup
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

            <div className="table-wrapper m3-scrollable-body" style={{ maxHeight: 'calc(100vh - 270px)', overflowY: 'auto' }}>
              <table className="patient-table">
                <thead>
                  <tr>
                    <th style={{ width: 80, minWidth: 70 }}>MRN</th>
                    <th style={{ minWidth: 150 }}>Patient Information</th>
                    <th style={{ minWidth: 110 }}>Consulting Oncologist</th>
                    <th style={{ minWidth: 115 }}>Coverage & ABHA</th>
                    <th style={{ width: 75, minWidth: 70 }}>Total Gross</th>
                    <th style={{ width: 85, minWidth: 80 }}>Patient Payable</th>
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
                      const isSelected = p.id === patient.id;
                      const isPaid = p.billingStatus === 'PAID';
                      const isReady = p.status === 'COMPLETED' || p.status === 'INSIGHTS_READY';
                      const pIsGovt = p.insurance?.type === 'GOVT_SCHEME';
                      const pIsInsured = p.insurance?.type === 'INSURANCE';
                      const avatarBg = AVATAR_COLORS[index % AVATAR_COLORS.length];

                      // Patient calculations
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
                            if (pIsGovt) {
                              setPaymentMethod('GOVT_PORTAL');
                            } else if (pIsInsured) {
                              setPaymentMethod('TPA');
                            } else {
                              setPaymentMethod('CARD');
                            }
                            setShowBillPopupModal(true);
                          }}
                          title="Click row to open itemized patient bill pop-up dialog"
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
                              {p.doctorAssigned.split('(')[1]?.replace(')', '') || 'Medical Oncology'}
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              <div style={{ fontSize: '12px', fontWeight: 700, color: pIsGovt ? '#059669' : pIsInsured ? '#0369a1' : '#b45309' }}>
                                {pIsGovt ? '🇮🇳 Ayushman Bharat PM-JAY' : pIsInsured ? `${p.insurance.provider.split(' ')[0]} (${p.insurance.coveragePct}%)` : 'Direct Self-Pay'}
                              </div>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '10.5px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                                <Award size={11} color={p.abhaId ? '#059669' : '#94a3b8'} />
                                <span>ABHA: {p.abhaId || p.insurance?.abhaId || '91-4820-1928-3819'}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--text-primary)' }}>
                              ₹{grandGrossTotal.toLocaleString()}
                            </div>
                            <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
                              Proc: ₹14k • Meds: ₹6.1k
                            </div>
                          </td>
                          <td>
                            {pIsGovt ? (
                              <div>
                                <span style={{ fontSize: 13, fontWeight: 900, color: '#059669' }}>₹0</span>
                                <div style={{ fontSize: 10, color: '#059669', fontWeight: 700 }}>100% Cashless Govt</div>
                              </div>
                            ) : (
                              <div>
                                <span style={{ fontSize: 13, fontWeight: 900, color: isPaid ? '#059669' : 'var(--text-primary)' }}>
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
                                className="m3-btn m3-btn-outlined"
                                style={{ height: 32, fontSize: 11.5, padding: '0 12px', gap: 5 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedPatientId(p.id);
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
                                data-tour="settle-bill-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedPatientId(p.id);
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
        </main>
      </div>

      {/* Full Itemized Bill & Settlement Pop-up Modal */}
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
                      style={{ color: '#065f46', background: '#ecfdf5', border: '1px solid #a7f3d0', fontSize: 11, padding: '3px 8px', gap: 4 }}
                      title="Switch this patient to 100% Cashless Ayushman Bharat PM-JAY Scheme"
                    >
                      <Landmark size={12} />
                      <span>Apply PM-JAY Scheme</span>
                    </button>
                  )}
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginTop: 4 }}>
                  Itemized Bill & Pharmacy Dispensing — {patient.fullName}
                </h3>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                  {patient.age}y {patient.gender} • Doctor: {patient.doctorAssigned} • Insurance: {patient.insurance.provider}
                </div>
              </div>

              <button 
                className="icon-btn" 
                onClick={() => setShowBillPopupModal(false)}
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
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>
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
                          <td>₹{item.unitPrice.toLocaleString()}</td>
                          <td>
                            {isGovtScheme ? (
                              <span style={{ color: '#059669', fontWeight: 700, fontSize: 11 }}>✓ 100% PM-JAY</span>
                            ) : isPrivateInsured ? (
                              <span style={{ color: '#059669', fontWeight: 700, fontSize: 11 }}>✓ TPA ({patient.insurance.coveragePct}%)</span>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Self-Pay</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 700 }}>₹{(item.qty * item.unitPrice).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Part 2: Oncology Pharmacy Medicines */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Pill size={15} color="#059669" />
                    <span>Dispensed Oncology Pharmacy Medicines</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>
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
                            <td>₹{med.unitPrice.toLocaleString()}</td>
                            <td style={{ fontSize: 10.5 }}>{med.gstPct}%</td>
                            <td style={{ textAlign: 'right', fontWeight: 700 }}>₹{lineTotal.toLocaleString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Part 3: Financial Summary Grid */}
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
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginTop: 2 }}>
                    ₹{grandGrossTotal.toLocaleString()}
                  </div>
                </div>

                <div>
                  <span className="info-key">{isGovtScheme ? 'Govt PM-JAY Coverage' : 'TPA Claim Settlement'}</span>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#059669', marginTop: 2 }}>
                    - ₹{insuranceClaim.toLocaleString()}
                  </div>
                </div>

                <div>
                  <span className="info-key">Deductible / Co-Pay</span>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#d97706', marginTop: 2 }}>
                    ₹{deductible.toLocaleString()}
                  </div>
                </div>

                <div style={{ 
                  background: isGovtScheme ? '#ecfdf5' : '#dcfce7', 
                  padding: '6px 12px', 
                  borderRadius: 'var(--radius-md)', 
                  border: 'none'
                }}>
                  <span className="info-key" style={{ color: isGovtScheme ? '#065f46' : '#166534', fontWeight: 800 }}>
                    {isGovtScheme ? 'Out-of-Pocket Net' : 'Net Amount Due'}
                  </span>
                  <div style={{ fontSize: 18, fontWeight: 800, color: isGovtScheme ? '#059669' : '#15803d', marginTop: 2 }}>
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
                    <span style={{ fontSize: 11, color: '#059669', fontWeight: 700 }}>
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
                    <Landmark size={20} color={paymentMethod === 'GOVT_PORTAL' ? '#065f46' : '#059669'} />
                    <span className="m3-payment-title">PM-JAY Govt Cashless</span>
                  </div>

                  <div
                    className={`m3-payment-card ${paymentMethod === 'TPA' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('TPA')}
                  >
                    <ShieldCheck size={20} color={paymentMethod === 'TPA' ? '#065f46' : 'var(--primary)'} />
                    <span className="m3-payment-title">TPA Pre-Approved</span>
                  </div>

                  <div
                    className={`m3-payment-card ${paymentMethod === 'CARD' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('CARD')}
                  >
                    <CreditCard size={20} color={paymentMethod === 'CARD' ? '#065f46' : 'var(--text-secondary)'} />
                    <span className="m3-payment-title">Credit / Debit Card</span>
                  </div>

                  <div
                    className={`m3-payment-card ${paymentMethod === 'UPI' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('UPI')}
                  >
                    <QrCode size={20} color={paymentMethod === 'UPI' ? '#065f46' : 'var(--text-secondary)'} />
                    <span className="m3-payment-title">UPI / QR Code</span>
                  </div>

                  <div
                    className={`m3-payment-card ${paymentMethod === 'CASH' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('CASH')}
                  >
                    <Banknote size={20} color={paymentMethod === 'CASH' ? '#065f46' : 'var(--text-secondary)'} />
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
                          VPA: <strong>bright.cancercare@hdfcbank</strong> • Amount: <strong>₹{patientNetPayable.toLocaleString()}</strong>
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
                    background: '#f0fdf4',
                    border: '1px solid #86efac',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: 11.5,
                    color: '#166534'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <CreditCard size={18} color="#15803d" />
                      <span><strong>POS Card Terminal Station 03:</strong> Ready for Chip, Contactless NFC Tap, or Swipe.</span>
                    </div>
                    <button
                      type="button"
                      className="m3-btn m3-btn-sm"
                      onClick={() => {
                        setCashierNotes(`Card Auth Code: AUTH-${Math.floor(100000 + Math.random() * 900000)} (VISA/MC Chip verified)`);
                        addToast('Card chip read successful! Transaction pre-authorized.', 'success');
                      }}
                      style={{ height: 26, fontSize: 10.5, background: '#15803d', color: '#ffffff' }}
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
                            color: 'var(--text-primary)',
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
                          color: (Number(cashReceived) || 0) >= patientNetPayable ? '#15803d' : '#dc2626'
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
                  data-tour="settle-payment-btn"
                  disabled={isProcessing}
                  style={{ height: 38 }}
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

      {/* Official Tax Invoice & Medicine Dispensing Receipt Modal */}
      {showInvoiceModal && patient && (
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
                  CANCERCARE ONCOLOGY HOSPITAL & RESEARCH INSTITUTE
                </h2>
                <p style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.92)', marginTop: 2 }}>
                  NABH Accredited Comprehensive Cancer Centre • GSTIN: 33AAACG1234F1Z8 • DL: 20B/21B-44120
                </p>
                <p style={{ fontSize: 10.5, color: 'rgba(255, 255, 255, 0.85)' }}>
                  124 Healthcare Boulevard, Medical District • ABDM Facility ID: IN33000881
                </p>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span className="badge badge-ready" style={{ fontSize: 11.5, padding: '4px 10px', background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' }}>
                  {isGovtScheme ? 'GOVT CASHLESS SETTLEMENT' : 'PAID IN FULL'}
                </span>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#ffffff', marginTop: 5, letterSpacing: '0.02em', textShadow: '0 1px 2px rgba(0,0,0,0.15)' }}>
                  INV-2026-09-{patient.id}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.92)', fontWeight: 500 }}>
                  Date: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>

            {/* Patient & Scheme Meta Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16, fontSize: 11.5, background: 'var(--bg-subtle)', padding: 12, borderRadius: 'var(--radius-sm)' }}>
              <div>
                <strong>Billed To:</strong>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{patient.fullName} ({patient.age}y / {patient.gender})</div>
                <div>MRN: {patient.mrn} • Phone: {patient.phone}</div>
                <div style={{ color: '#0284c7', fontWeight: 600 }}>
                  ABHA ID: {patient.abhaId || patient.insurance?.abhaId || '91-4820-1928-3819'}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <strong>Billing & Scheme Details:</strong>
                <div>{isGovtScheme ? `Scheme: ${patient.insurance.provider}` : `Coverage: ${patient.insurance.provider}`}</div>
                <div>{isGovtScheme ? `Golden Card ID: ${patient.insurance.policyNumber}` : `Policy: ${patient.insurance.policyNumber}`}</div>
                <div style={{ color: '#059669', fontWeight: 600 }}>
                  Settlement Method: {paymentMethod === 'GOVT_PORTAL' ? 'PM-JAY NHA Cashless Portal' : paymentMethod}
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
                      <td style={{ padding: '6px 10px', textAlign: 'right' }}>₹{(item.qty * item.unitPrice).toLocaleString()}</td>
                    </tr>
                  ))}
                  <tr style={{ borderTop: '1px solid var(--border-default)', background: 'var(--bg-subtle)', fontWeight: 700 }}>
                    <td colSpan={3} style={{ padding: '6px 10px' }}>Clinical Services Subtotal</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right' }}>₹{clinicalGross.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Part 2: Itemized Pharmacy Medicine Dispensing */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
                2. Itemized Oncology Pharmacy Medicines Dispensed
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
                        <td style={{ padding: '6px 10px', textAlign: 'right' }}>₹{total.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                  <tr style={{ borderTop: '1px solid var(--border-default)', background: 'var(--bg-subtle)', fontWeight: 700 }}>
                    <td colSpan={5} style={{ padding: '6px 10px' }}>Pharmacy Medicines Subtotal (Incl. ₹{pharmacyGst} GST)</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right' }}>₹{pharmacyGross.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Total Settlement Box */}
            <div style={{ border: 'none', borderRadius: 'var(--radius-md)', padding: 14, background: '#f0fdf4', marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4, color: 'var(--text-secondary)' }}>
                <span>Gross Hospital Invoice (Clinical + Medicines):</span>
                <strong>₹{grandGrossTotal.toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#059669', marginBottom: 4 }}>
                <span>{isGovtScheme ? 'Ayushman Bharat PM-JAY Cashless Package:' : 'TPA Claim Settlement:'}</span>
                <strong>- ₹{insuranceClaim.toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 900, borderTop: '1px solid #bbf7d0', paddingTop: 6, color: '#15803d' }}>
                <span>Net Amount Paid by Patient ({paymentMethod}):</span>
                <span>₹{patientNetPayable.toLocaleString()}</span>
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
                    addToast(`Official Tax Invoice PDF generated for ${patient.fullName}.`, 'success');
                  }}
                  style={{ height: 32, fontSize: 11.5 }}
                >
                  <Download size={14} /> Download PDF
                </button>
                <button 
                  className="m3-btn m3-btn-outlined" 
                  onClick={() => {
                    addToast(`Tax invoice & gate pass sent via WhatsApp/SMS to ${patient.phone}.`, 'success');
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
                  style={{ height: 32, fontSize: 11.5 }}
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
