import React, { useState } from 'react';
import { usePatients } from '../context/PatientContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { WHO_GENERIC_SUBSTITUTIONS } from '../utils/nursingAndPharmacyData';
import { 
  Pill, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  Search, 
  FileText, 
  QrCode, 
  Package, 
  ShieldCheck, 
  Sparkles, 
  Clock, 
  ArrowRight, 
  Printer, 
  RefreshCw, 
  X, 
  Check, 
  Activity, 
  Building2, 
  DollarSign, 
  Thermometer, 
  Scan, 
  Copy, 
  TrendingDown,
  Info,
  Calendar,
  Lock,
  ChevronRight
} from 'lucide-react';

export default function ChemistPage({ 
  currentRole = 'chemist', 
  onSwitchRole, 
  activeSubTab = 'queue',
  onLogout 
}) {
  const { 
    pharmacyQueue, 
    pharmacyInventory, 
    verifyPharmacyRx, 
    dispensePharmacyRx, 
    reorderInventoryItem, 
    stats,
    addToast 
  } = usePatients();

  const [activeTab, setActiveTab] = useState(activeSubTab || 'queue');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterScheme, setFilterScheme] = useState('ALL');

  // Selected Rx for review or dispense
  const [selectedRx, setSelectedRx] = useState(pharmacyQueue[0] || null);

  // Modals
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [isDispenseModalOpen, setIsDispenseModalOpen] = useState(false);
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
  const [selectedInvItem, setSelectedInvItem] = useState(null);
  const [reorderQty, setReorderQty] = useState(100);

  // WHO Generic Substitution Search & Calculator
  const [genericSearch, setGenericSearch] = useState('');
  const [selectedGenericItem, setSelectedGenericItem] = useState(WHO_GENERIC_SUBSTITUTIONS[0]);

  // Inventory Filter
  const [inventoryCategory, setInventoryCategory] = useState('ALL');

  // Stats calculation
  const pendingCount = pharmacyQueue.filter(r => r.status === 'PENDING_VERIFICATION').length;
  const readyCount = pharmacyQueue.filter(r => r.status === 'READY_FOR_DISPENSE').length;
  const dispensedCount = pharmacyQueue.filter(r => r.status === 'DISPENSED').length;
  const lowStockCount = pharmacyInventory.filter(i => i.stock <= i.minThreshold).length;

  // Filtered Queue
  const filteredQueue = pharmacyQueue.filter(rx => {
    const matchesSearch = 
      rx.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rx.mrn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rx.tokenNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rx.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    if (filterScheme === 'PMJAY') return rx.schemeType.includes('PM-JAY');
    if (filterScheme === 'INSURANCE') return rx.schemeType.includes('Health') || rx.schemeType.includes('TPA');
    if (filterScheme === 'SELF') return rx.schemeType.includes('Cash') || rx.schemeType.includes('Self');
    return true;
  });

  // Filtered Inventory
  const filteredInventory = pharmacyInventory.filter(item => {
    const matchesSearch = 
      item.genericName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.brandName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.rack.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    if (inventoryCategory === 'LOW') return item.stock <= item.minThreshold;
    if (inventoryCategory === 'COLD') return item.temp.includes('Cold');
    if (inventoryCategory === 'CONTROLLED') return item.rack.includes('Vault');
    return true;
  });

  // Filtered WHO Generics
  const filteredGenerics = WHO_GENERIC_SUBSTITUTIONS.filter(g => 
    g.brandName.toLowerCase().includes(genericSearch.toLowerCase()) ||
    g.genericInn.toLowerCase().includes(genericSearch.toLowerCase()) ||
    g.therapeuticClass.toLowerCase().includes(genericSearch.toLowerCase())
  );

  const handleOpenVerify = (rx) => {
    setSelectedRx(rx);
    setIsVerifyModalOpen(true);
  };

  const handleConfirmVerify = () => {
    if (!selectedRx) return;
    verifyPharmacyRx(selectedRx.id);
    setIsVerifyModalOpen(false);
  };

  const handleOpenDispense = (rx) => {
    setSelectedRx(rx);
    setIsDispenseModalOpen(true);
  };

  const handleConfirmDispense = () => {
    if (!selectedRx) return;
    dispensePharmacyRx(selectedRx.id, { dispensedBy: 'Karthik Ramamurthy, RPh' });
    setIsDispenseModalOpen(false);
  };

  const handleOpenReorder = (item) => {
    setSelectedInvItem(item);
    setReorderQty(100);
    setIsReorderModalOpen(true);
  };

  const handleConfirmReorder = () => {
    if (!selectedInvItem) return;
    reorderInventoryItem(selectedInvItem.id, Number(reorderQty) || 100);
    setIsReorderModalOpen(false);
  };

  return (
    <div className="m3-app-shell chemist-theme" style={{ display: 'flex', height: '100vh', width: '100%', overflow: 'hidden' }}>
      {/* Navigation Sidebar */}
      <Sidebar 
        role="chemist"
        activeTab={activeTab === 'dashboard' ? 'queue' : activeTab}
        setActiveTab={setActiveTab}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />

      <div className="m3-main-viewport" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        {/* Top App Bar with Chemist / Dispensary Branding */}
        <Navbar 
          currentRole="chemist"
          onRoleChange={onSwitchRole}
          onLogout={onLogout}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Main Content Area */}
        <main className="page-container m3-page-animate" style={{ maxWidth: '100%', width: '100%', margin: 0, padding: '16px 20px', boxSizing: 'border-box', overflowY: 'auto', flex: 1 }}>
          
          {/* Hero Header Banner */}
          <div 
            className="m3-card anim-hover-lift"
            style={{ 
              background: 'linear-gradient(135deg, rgba(22, 163, 74, 0.08) 0%, rgba(5, 150, 105, 0.03) 100%)',
              border: '1px solid rgba(22, 163, 74, 0.25)',
              borderRadius: 16,
              padding: '24px 28px',
              marginBottom: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 20
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <div 
                style={{ 
                  width: 54, 
                  height: 54, 
                  borderRadius: 14, 
                  background: 'linear-gradient(135deg, #16a34a, #059669)',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: '#ffffff',
                  boxShadow: '0 6px 16px rgba(22, 163, 74, 0.3)'
                }}
              >
                <Pill size={28} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
                    Dispensary & Pharmacotherapy OS
                  </h1>
                  <span 
                    style={{ 
                      fontSize: 10, 
                      fontWeight: 800, 
                      background: '#dcfce7', 
                      color: '#15803d', 
                      border: '1px solid #bbf7d0',
                      padding: '2px 8px', 
                      borderRadius: 9999,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} />
                    EPIC WILLOW PHARMACY COMPATIBLE
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>Chief Pharmacist: <strong>Karthik Ramamurthy, RPh</strong></span>
                  <span>•</span>
                  <span>Central Dispensary Counter 01</span>
                  <span>•</span>
                  <span>Auto CDSS Allergy Screening & WHO EML Generic Engine</span>
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <button 
                className="m3-btn m3-btn-outlined anim-hover-lift"
                onClick={() => setActiveTab('generics')}
                style={{ 
                  borderColor: '#16a34a', 
                  color: '#15803d', 
                  background: '#f0fdf4',
                  fontSize: 12,
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  borderRadius: 8,
                  padding: '8px 14px'
                }}
              >
                <Sparkles size={14} />
                <span>WHO EML Generic Substitutions</span>
              </button>
              <button 
                className="m3-btn anim-hover-lift"
                onClick={() => {
                  const firstPending = pharmacyQueue.find(r => r.status === 'PENDING_VERIFICATION') || pharmacyQueue[0];
                  if (firstPending) handleOpenVerify(firstPending);
                }}
                style={{ 
                  background: 'linear-gradient(135deg, #16a34a, #059669)', 
                  color: '#ffffff',
                  fontSize: 12,
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  borderRadius: 8,
                  padding: '8px 16px',
                  boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)'
                }}
              >
                <Scan size={14} />
                <span>Review Next e-Rx Queue ({pendingCount})</span>
              </button>
            </div>
          </div>

          {/* Operational Metrics Cards (4-Grid) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 16, marginBottom: 24 }}>
            {/* Card 1: Pending Clinical Verification */}
            <div 
              className="m3-card anim-hover-lift" 
              onClick={() => setActiveTab('queue')}
              style={{ 
                padding: '16px 20px', 
                borderRadius: 14, 
                border: activeTab === 'queue' ? '2px solid #16a34a' : '1px solid var(--border-default)',
                background: 'var(--bg-surface)',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>e-Rx Queue (Pending)</span>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b45309' }}>
                  <Clock size={18} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 28, fontWeight: 900, color: '#b45309' }}>{pendingCount}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#b45309' }}>Awaiting RPh Sign-off</span>
              </div>
              <p style={{ margin: '6px 0 0', fontSize: 11, color: 'var(--text-tertiary)' }}>
                CDSS drug-interaction & allergy gate
              </p>
            </div>

            {/* Card 2: Ready for Barcode Dispense */}
            <div 
              className="m3-card anim-hover-lift" 
              onClick={() => setActiveTab('dispense')}
              style={{ 
                padding: '16px 20px', 
                borderRadius: 14, 
                border: activeTab === 'dispense' ? '2px solid #16a34a' : '1px solid var(--border-default)',
                background: 'var(--bg-surface)',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>Ready for Dispense</span>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#15803d' }}>
                  <Package size={18} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 28, fontWeight: 900, color: '#15803d' }}>{readyCount}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#15803d' }}>Verified by Pharmacist</span>
              </div>
              <p style={{ margin: '6px 0 0', fontSize: 11, color: 'var(--text-tertiary)' }}>
                Printable label with safety instructions
              </p>
            </div>

            {/* Card 3: Low Stock Formulary Alerts */}
            <div 
              className="m3-card anim-hover-lift" 
              onClick={() => { setActiveTab('inventory'); setInventoryCategory('LOW'); }}
              style={{ 
                padding: '16px 20px', 
                borderRadius: 14, 
                border: activeTab === 'inventory' && inventoryCategory === 'LOW' ? '2px solid #dc2626' : '1px solid var(--border-default)',
                background: 'var(--bg-surface)',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>Low Formulary Stock</span>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626' }}>
                  <AlertTriangle size={18} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 28, fontWeight: 900, color: '#dc2626' }}>{lowStockCount}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#dc2626' }}>Critical Thresholds</span>
              </div>
              <p style={{ margin: '6px 0 0', fontSize: 11, color: 'var(--text-tertiary)' }}>
                Antibiotics & cold-chain insulins
              </p>
            </div>

            {/* Card 4: Cashless PM-JAY & Schemes */}
            <div 
              className="m3-card anim-hover-lift" 
              onClick={() => { setActiveTab('queue'); setFilterScheme('PMJAY'); }}
              style={{ 
                padding: '16px 20px', 
                borderRadius: 14, 
                border: '1px solid var(--border-default)',
                background: 'var(--bg-surface)',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>Ayushman Bharat PM-JAY</span>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1d4ed8' }}>
                  <ShieldCheck size={18} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 28, fontWeight: 900, color: '#1d4ed8' }}>100%</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#1d4ed8' }}>Direct Cashless Claims</span>
              </div>
              <p style={{ margin: '6px 0 0', fontSize: 11, color: 'var(--text-tertiary)' }}>
                ABDM e-claim synchronized to counter
              </p>
            </div>
          </div>

          {/* Sub-Navigation Tabs */}
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              borderBottom: '1px solid var(--border-default)',
              marginBottom: 20,
              paddingBottom: 2,
              gap: 16,
              flexWrap: 'wrap'
            }}
          >
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button 
                className={`m3-btn ${activeTab === 'queue' || activeTab === 'dashboard' ? 'm3-btn-primary' : 'm3-btn-subtle'}`}
                onClick={() => setActiveTab('queue')}
                style={{
                  borderRadius: '10px 10px 0 0',
                  padding: '9px 18px',
                  fontWeight: 700,
                  fontSize: 13,
                  backgroundColor: activeTab === 'queue' || activeTab === 'dashboard' ? '#16a34a' : 'transparent',
                  color: activeTab === 'queue' || activeTab === 'dashboard' ? '#ffffff' : 'var(--text-secondary)',
                  borderBottom: activeTab === 'queue' || activeTab === 'dashboard' ? '3px solid #15803d' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                <Clock size={16} />
                <span>e-Rx Verification Queue</span>
                <span 
                  style={{ 
                    fontSize: 10, 
                    fontWeight: 800, 
                    padding: '1px 6px', 
                    borderRadius: 9999,
                    background: activeTab === 'queue' || activeTab === 'dashboard' ? 'rgba(255,255,255,0.25)' : '#fef3c7',
                    color: activeTab === 'queue' || activeTab === 'dashboard' ? '#ffffff' : '#92400e'
                  }}
                >
                  {pendingCount}
                </span>
              </button>

              <button 
                className={`m3-btn ${activeTab === 'dispense' ? 'm3-btn-primary' : 'm3-btn-subtle'}`}
                onClick={() => setActiveTab('dispense')}
                style={{
                  borderRadius: '10px 10px 0 0',
                  padding: '9px 18px',
                  fontWeight: 700,
                  fontSize: 13,
                  backgroundColor: activeTab === 'dispense' ? '#16a34a' : 'transparent',
                  color: activeTab === 'dispense' ? '#ffffff' : 'var(--text-secondary)',
                  borderBottom: activeTab === 'dispense' ? '3px solid #15803d' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                <Package size={16} />
                <span>Barcode Dispense Desk</span>
                <span 
                  style={{ 
                    fontSize: 10, 
                    fontWeight: 800, 
                    padding: '1px 6px', 
                    borderRadius: 9999,
                    background: activeTab === 'dispense' ? 'rgba(255,255,255,0.25)' : '#dcfce7',
                    color: activeTab === 'dispense' ? '#ffffff' : '#15803d'
                  }}
                >
                  {readyCount}
                </span>
              </button>

              <button 
                className={`m3-btn ${activeTab === 'generics' ? 'm3-btn-primary' : 'm3-btn-subtle'}`}
                onClick={() => setActiveTab('generics')}
                style={{
                  borderRadius: '10px 10px 0 0',
                  padding: '9px 18px',
                  fontWeight: 700,
                  fontSize: 13,
                  backgroundColor: activeTab === 'generics' ? '#16a34a' : 'transparent',
                  color: activeTab === 'generics' ? '#ffffff' : 'var(--text-secondary)',
                  borderBottom: activeTab === 'generics' ? '3px solid #15803d' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                <Sparkles size={16} />
                <span>WHO EML Generic Engine</span>
              </button>

              <button 
                className={`m3-btn ${activeTab === 'inventory' ? 'm3-btn-primary' : 'm3-btn-subtle'}`}
                onClick={() => setActiveTab('inventory')}
                style={{
                  borderRadius: '10px 10px 0 0',
                  padding: '9px 18px',
                  fontWeight: 700,
                  fontSize: 13,
                  backgroundColor: activeTab === 'inventory' ? '#16a34a' : 'transparent',
                  color: activeTab === 'inventory' ? '#ffffff' : 'var(--text-secondary)',
                  borderBottom: activeTab === 'inventory' ? '3px solid #15803d' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                <Building2 size={16} />
                <span>Formulary & Stock Control</span>
                {lowStockCount > 0 && (
                  <span 
                    style={{ 
                      fontSize: 10, 
                      fontWeight: 800, 
                      padding: '1px 6px', 
                      borderRadius: 9999,
                      background: activeTab === 'inventory' ? 'rgba(255,255,255,0.25)' : '#fee2e2',
                      color: activeTab === 'inventory' ? '#ffffff' : '#dc2626'
                    }}
                  >
                    {lowStockCount} LOW
                  </span>
                )}
              </button>
            </div>

            {/* Quick Search */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ position: 'relative', minWidth: 260 }}>
                <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                <input 
                  type="text"
                  placeholder="Search patient, MRN, drug, batch..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 34px',
                    borderRadius: 8,
                    border: '1px solid var(--border-default)',
                    background: 'var(--bg-surface)',
                    fontSize: 12.5,
                    outline: 'none',
                    color: 'var(--text-primary)'
                  }}
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* TAB 1: e-Rx Verification Queue */}
          {(activeTab === 'queue' || activeTab === 'dashboard') && (
            <div>
              {/* Filter Pills for Schemes */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>Scheme Filter:</span>
                {[
                  { id: 'ALL', label: 'All Schemes' },
                  { id: 'PMJAY', label: 'Ayushman Bharat PM-JAY (100% Cashless)' },
                  { id: 'INSURANCE', label: 'Private TPA / Star Health' },
                  { id: 'SELF', label: 'Self-Pay / Cash' }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setFilterScheme(item.id)}
                    style={{
                      fontSize: 11.5,
                      fontWeight: filterScheme === item.id ? 800 : 600,
                      padding: '4px 12px',
                      borderRadius: 9999,
                      border: filterScheme === item.id ? '1px solid #16a34a' : '1px solid var(--border-default)',
                      background: filterScheme === item.id ? '#dcfce7' : 'var(--bg-surface)',
                      color: filterScheme === item.id ? '#15803d' : 'var(--text-secondary)',
                      cursor: 'pointer'
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Prescription Cards List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {filteredQueue.map(rx => {
                  const isVerified = rx.status === 'READY_FOR_DISPENSE';
                  const isDispensed = rx.status === 'DISPENSED';
                  const isPending = rx.status === 'PENDING_VERIFICATION';

                  return (
                    <div 
                      key={rx.id}
                      className="m3-card anim-hover-lift"
                      style={{ 
                        borderRadius: 14, 
                        border: isPending ? '1.5px solid #fde68a' : isVerified ? '1.5px solid #bbf7d0' : '1px solid var(--border-default)',
                        background: 'var(--bg-surface)',
                        padding: '18px 22px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span 
                            style={{ 
                              fontSize: 13, 
                              fontWeight: 900, 
                              background: '#f1f5f9', 
                              color: '#334155', 
                              padding: '3px 10px', 
                              borderRadius: 6 
                            }}
                          >
                            {rx.tokenNumber}
                          </span>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                                {rx.patientName}
                              </h3>
                              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                                ({rx.age}y • {rx.gender})
                              </span>
                              <span style={{ fontSize: 11, fontWeight: 700, color: '#0284c7', background: '#e0f2fe', padding: '1px 6px', borderRadius: 4 }}>
                                {rx.mrn}
                              </span>
                            </div>
                            <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 2 }}>
                              Prescribed by <strong>{rx.prescribedBy}</strong> • {rx.wardBed} • Prescribed at {rx.prescribedAt}
                            </div>
                          </div>
                        </div>

                        {/* Status & Scheme Badges */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span 
                            style={{ 
                              fontSize: 11, 
                              fontWeight: 800, 
                              padding: '3px 10px', 
                              borderRadius: 9999,
                              background: rx.schemeType.includes('PM-JAY') ? '#dbeafe' : rx.schemeType.includes('Health') ? '#f3e8ff' : '#f1f5f9',
                              color: rx.schemeType.includes('PM-JAY') ? '#1e40af' : rx.schemeType.includes('Health') ? '#6b21a8' : '#475569',
                              border: '1px solid rgba(0,0,0,0.06)'
                            }}
                          >
                            {rx.schemeType} ({rx.schemeBadge})
                          </span>

                          <span 
                            style={{ 
                              fontSize: 11, 
                              fontWeight: 800, 
                              padding: '3px 10px', 
                              borderRadius: 9999,
                              background: isPending ? '#fef3c7' : isVerified ? '#dcfce7' : '#e2e8f0',
                              color: isPending ? '#92400e' : isVerified ? '#15803d' : '#334155',
                              border: isPending ? '1px solid #fde68a' : isVerified ? '1px solid #86efac' : '1px solid #cbd5e1',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5
                            }}
                          >
                            {isPending && <Clock size={12} />}
                            {isVerified && <CheckCircle2 size={12} />}
                            {isDispensed && <Check size={12} />}
                            {isPending ? 'Pending RPh Review' : isVerified ? 'Verified & Ready' : 'Dispensed'}
                          </span>
                        </div>
                      </div>

                      {/* CDSS Alerts Callout Banner */}
                      {rx.cdssAlerts && rx.cdssAlerts.length > 0 && (
                        <div 
                          style={{ 
                            background: '#fffbeb', 
                            borderLeft: '4px solid #f59e0b', 
                            padding: '10px 14px', 
                            borderRadius: '0 8px 8px 0', 
                            marginBottom: 14 
                          }}
                        >
                          <div style={{ fontSize: 11.5, fontWeight: 800, color: '#92400e', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                            <ShieldCheck size={14} color="#d97706" />
                            <span>Clinical Decision Support System (CDSS) Safety Screening:</span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            {rx.cdssAlerts.map((alt, idx) => (
                              <div key={idx} style={{ fontSize: 11, color: '#78350f', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span 
                                  style={{ 
                                    fontSize: 9, 
                                    fontWeight: 900, 
                                    padding: '1px 5px', 
                                    borderRadius: 3, 
                                    background: alt.severity === 'CRITICAL' ? '#fee2e2' : '#fef3c7',
                                    color: alt.severity === 'CRITICAL' ? '#dc2626' : '#b45309'
                                  }}
                                >
                                  {alt.type}
                                </span>
                                <span>{alt.text}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Prescribed Items Table */}
                      <div style={{ overflowX: 'auto', marginBottom: 14 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                          <thead>
                            <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-default)', textAlign: 'left' }}>
                              <th style={{ padding: '8px 10px', fontWeight: 700, color: 'var(--text-secondary)' }}>Drug & Brand</th>
                              <th style={{ padding: '8px 10px', fontWeight: 700, color: 'var(--text-secondary)' }}>Form</th>
                              <th style={{ padding: '8px 10px', fontWeight: 700, color: 'var(--text-secondary)' }}>Prescribed Qty</th>
                              <th style={{ padding: '8px 10px', fontWeight: 700, color: 'var(--text-secondary)' }}>Batch & Expiry</th>
                              <th style={{ padding: '8px 10px', fontWeight: 700, color: 'var(--text-secondary)' }}>Dispensary Stock</th>
                              <th style={{ padding: '8px 10px', fontWeight: 700, color: 'var(--text-secondary)', textAlign: 'right' }}>Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rx.items.map(item => (
                              <tr key={item.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                <td style={{ padding: '8px 10px' }}>
                                  <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{item.drug}</div>
                                  <div style={{ fontSize: 10.5, color: 'var(--text-tertiary)' }}>Brand: {item.brand}</div>
                                </td>
                                <td style={{ padding: '8px 10px', color: 'var(--text-secondary)' }}>{item.form}</td>
                                <td style={{ padding: '8px 10px', fontWeight: 700, color: 'var(--text-primary)' }}>{item.qty} units</td>
                                <td style={{ padding: '8px 10px', fontSize: 11, color: 'var(--text-secondary)' }}>
                                  <div>{item.batch}</div>
                                  <div style={{ color: 'var(--text-tertiary)' }}>Exp: {item.expiry}</div>
                                </td>
                                <td style={{ padding: '8px 10px' }}>
                                  <span 
                                    style={{ 
                                      fontSize: 10.5, 
                                      fontWeight: 800, 
                                      padding: '2px 6px', 
                                      borderRadius: 4, 
                                      background: item.stockAvailable > 100 ? '#dcfce7' : '#fee2e2',
                                      color: item.stockAvailable > 100 ? '#15803d' : '#dc2626'
                                    }}
                                  >
                                    {item.stockAvailable} in rack
                                  </span>
                                </td>
                                <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>
                                  ₹{(item.qty * item.unitPrice).toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Financial Footer & Actions */}
                      <div 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between', 
                          flexWrap: 'wrap', 
                          gap: 12, 
                          paddingTop: 10,
                          borderTop: '1px solid var(--border-subtle)' 
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12 }}>
                          <div>
                            <span style={{ color: 'var(--text-secondary)' }}>Total: </span>
                            <strong>₹{rx.subtotal.toFixed(2)}</strong>
                          </div>
                          <div>
                            <span style={{ color: '#15803d' }}>Scheme/Insurance: </span>
                            <strong style={{ color: '#15803d' }}>-₹{rx.insuranceCovered.toFixed(2)}</strong>
                          </div>
                          <div>
                            <span style={{ color: 'var(--text-secondary)' }}>Patient Payable: </span>
                            <strong style={{ color: rx.patientPayable === 0 ? '#15803d' : '#b45309', fontSize: 13 }}>
                              {rx.patientPayable === 0 ? '₹0.00 (100% Cashless)' : `₹${rx.patientPayable.toFixed(2)}`}
                            </strong>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {isPending && (
                            <button
                              className="m3-btn m3-btn-primary anim-hover-lift"
                              onClick={() => handleOpenVerify(rx)}
                              style={{ 
                                background: 'linear-gradient(135deg, #16a34a, #059669)',
                                color: '#ffffff',
                                fontSize: 11.5,
                                fontWeight: 800,
                                padding: '6px 14px',
                                borderRadius: 6,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6
                              }}
                            >
                              <ShieldCheck size={14} />
                              <span>Clinical Verification & Approval</span>
                            </button>
                          )}

                          {isVerified && (
                            <button
                              className="m3-btn anim-hover-lift"
                              onClick={() => handleOpenDispense(rx)}
                              style={{ 
                                background: '#16a34a',
                                color: '#ffffff',
                                fontSize: 11.5,
                                fontWeight: 800,
                                padding: '6px 14px',
                                borderRadius: 6,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6
                              }}
                            >
                              <Package size={14} />
                              <span>Dispense & Generate Pill Label</span>
                            </button>
                          )}

                          {isDispensed && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 11.5, color: '#15803d', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <CheckCircle2 size={14} /> Dispensed at {rx.dispensedAt || '12:45 PM'}
                              </span>
                              <button
                                className="m3-btn m3-btn-outlined anim-hover-lift"
                                onClick={() => handleOpenDispense(rx)}
                                style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, borderColor: 'var(--border-default)' }}
                              >
                                <Printer size={12} /> Reprint Label
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: Barcode Dispense Desk */}
          {activeTab === 'dispense' && (
            <div>
              <div 
                className="m3-card"
                style={{ 
                  padding: '20px 24px', 
                  borderRadius: 14, 
                  background: 'var(--bg-surface)', 
                  border: '1px solid var(--border-default)',
                  marginBottom: 20 
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
                  <div>
                    <h2 style={{ fontSize: 17, fontWeight: 800, margin: '0 0 4px', color: 'var(--text-primary)' }}>
                      Barcode Dispense Verification Desk
                    </h2>
                    <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-secondary)' }}>
                      Ensure 100% accuracy before patient handover: Match bottle QR code with doctor e-Rx batch & issue compliance label.
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ padding: '8px 14px', background: '#f0fdf4', border: '1px dashed #86efac', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                      <Scan size={16} color="#16a34a" />
                      <span style={{ color: '#15803d', fontWeight: 700 }}>Barcode Scanner Live & Ready</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ready Orders Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
                {pharmacyQueue.filter(r => r.status === 'READY_FOR_DISPENSE' || r.status === 'DISPENSED').map(rx => {
                  const isDispensed = rx.status === 'DISPENSED';
                  return (
                    <div 
                      key={rx.id}
                      className="m3-card anim-hover-lift"
                      style={{ 
                        borderRadius: 12, 
                        border: isDispensed ? '1px solid var(--border-default)' : '1.5px solid #86efac',
                        background: 'var(--bg-surface)',
                        padding: '18px 20px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                          <span style={{ fontSize: 12, fontWeight: 900, background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: 4 }}>
                            {rx.tokenNumber}
                          </span>
                          <span 
                            style={{ 
                              fontSize: 10.5, 
                              fontWeight: 800, 
                              padding: '2px 8px', 
                              borderRadius: 9999,
                              background: isDispensed ? '#e2e8f0' : '#dcfce7',
                              color: isDispensed ? '#475569' : '#15803d'
                            }}
                          >
                            {isDispensed ? 'COMPLETED' : 'AWAITING HANDOVER'}
                          </span>
                        </div>

                        <h4 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 4px', color: 'var(--text-primary)' }}>
                          {rx.patientName}
                        </h4>
                        <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginBottom: 10 }}>
                          MRN: {rx.mrn} • Location: {rx.wardBed}
                        </div>

                        <div style={{ background: 'var(--bg-subtle)', borderRadius: 8, padding: '10px 12px', marginBottom: 12 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                            Items to Bag & Label ({rx.items.length}):
                          </div>
                          {rx.items.map(item => (
                            <div key={item.id} style={{ fontSize: 11.5, display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>• {item.drug}</span>
                              <span style={{ color: 'var(--text-secondary)' }}>x{item.qty} ({item.batch})</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div style={{ paddingTop: 10, borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ fontSize: 11.5 }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Co-Pay: </span>
                          <strong style={{ color: rx.patientPayable === 0 ? '#15803d' : '#b45309' }}>
                            {rx.patientPayable === 0 ? 'Cashless' : `₹${rx.patientPayable.toFixed(2)}`}
                          </strong>
                        </div>

                        <button 
                          className="m3-btn anim-hover-lift"
                          onClick={() => handleOpenDispense(rx)}
                          style={{ 
                            background: isDispensed ? 'var(--bg-subtle)' : '#16a34a',
                            color: isDispensed ? 'var(--text-primary)' : '#ffffff',
                            border: isDispensed ? '1px solid var(--border-default)' : 'none',
                            fontSize: 11.5,
                            fontWeight: 700,
                            padding: '6px 14px',
                            borderRadius: 6,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6
                          }}
                        >
                          <Printer size={13} />
                          <span>{isDispensed ? 'View Pill Label' : 'Print Label & Dispense'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: WHO EML Generic Substitution Engine */}
          {activeTab === 'generics' && (
            <div>
              <div 
                className="m3-card"
                style={{ 
                  padding: '22px 26px', 
                  borderRadius: 14, 
                  background: 'linear-gradient(135deg, rgba(22, 163, 74, 0.08) 0%, rgba(2, 132, 199, 0.04) 100%)', 
                  border: '1px solid rgba(22, 163, 74, 0.25)',
                  marginBottom: 20 
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <Sparkles size={18} color="#16a34a" />
                      <h2 style={{ fontSize: 17, fontWeight: 900, margin: 0, color: 'var(--text-primary)' }}>
                        WHO Essential Medicines List (EML) Substitution Engine
                      </h2>
                    </div>
                    <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-secondary)' }}>
                      Automatically map doctor-prescribed expensive brand-names to WHO bioequivalent INN generics. Save patients up to 88% out-of-pocket costs.
                    </p>
                  </div>

                  <div style={{ position: 'relative', minWidth: 300 }}>
                    <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                    <input 
                      type="text"
                      placeholder="Search brand, generic INN, or ATC class..."
                      value={genericSearch}
                      onChange={(e) => setGenericSearch(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px 8px 34px',
                        borderRadius: 8,
                        border: '1px solid var(--border-default)',
                        background: '#ffffff',
                        fontSize: 12.5,
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Generics Comparison Table */}
              <div 
                className="m3-card"
                style={{ 
                  borderRadius: 14, 
                  border: '1px solid var(--border-default)', 
                  background: 'var(--bg-surface)', 
                  overflow: 'hidden' 
                }}
              >
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-default)', textAlign: 'left' }}>
                        <th style={{ padding: '12px 16px', fontWeight: 800, color: 'var(--text-secondary)' }}>Prescribed Brand Name</th>
                        <th style={{ padding: '12px 16px', fontWeight: 800, color: 'var(--text-secondary)' }}>WHO Bioequivalent Generic (INN)</th>
                        <th style={{ padding: '12px 16px', fontWeight: 800, color: 'var(--text-secondary)' }}>Therapeutic Class & ATC</th>
                        <th style={{ padding: '12px 16px', fontWeight: 800, color: 'var(--text-secondary)', textAlign: 'right' }}>Brand MRP</th>
                        <th style={{ padding: '12px 16px', fontWeight: 800, color: 'var(--text-secondary)', textAlign: 'right' }}>Generic Price</th>
                        <th style={{ padding: '12px 16px', fontWeight: 800, color: 'var(--text-secondary)', textAlign: 'center' }}>Patient Savings</th>
                        <th style={{ padding: '12px 16px', fontWeight: 800, color: 'var(--text-secondary)', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredGenerics.map((item, idx) => (
                        <tr 
                          key={idx} 
                          style={{ 
                            borderBottom: '1px solid var(--border-subtle)',
                            background: idx % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.01)'
                          }}
                        >
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{item.brandName}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{item.dosageForm}</div>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ fontWeight: 700, color: '#15803d' }}>{item.genericInn}</div>
                            <div style={{ fontSize: 10.5, color: '#16a34a' }}>WHO Code: {item.whoEmlCode}</div>
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: 11.5, color: 'var(--text-secondary)' }}>
                            {item.therapeuticClass}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'right', color: '#94a3b8', textDecoration: 'line-through' }}>
                            ₹{item.brandPrice.toFixed(2)}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 800, color: '#15803d', fontSize: 14 }}>
                            ₹{item.genericPrice.toFixed(2)}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                            <span 
                              style={{ 
                                fontSize: 11, 
                                fontWeight: 900, 
                                background: '#dcfce7', 
                                color: '#15803d', 
                                padding: '3px 8px', 
                                borderRadius: 9999,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 3
                              }}
                            >
                              <TrendingDown size={11} /> {item.savingsPct}% SAVED
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                            <button
                              className="m3-btn m3-btn-outlined anim-hover-lift"
                              onClick={() => {
                                navigator.clipboard.writeText(`${item.genericInn} (${item.dosageForm}) - WHO Code: ${item.whoEmlCode}`);
                                addToast(`Copied WHO Generic: "${item.genericInn}" to clipboard`, 'success');
                              }}
                              style={{ 
                                fontSize: 11, 
                                fontWeight: 700, 
                                padding: '5px 10px', 
                                borderRadius: 6,
                                borderColor: '#16a34a',
                                color: '#15803d',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4
                              }}
                            >
                              <Copy size={12} />
                              <span>Substitute</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Formulary Stock & Inventory Control */}
          {activeTab === 'inventory' && (
            <div>
              {/* Category Filters & Quick Reorder */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>Formulary View:</span>
                  {[
                    { id: 'ALL', label: 'All Drugs (13)' },
                    { id: 'LOW', label: `Low Stock (${lowStockCount})` },
                    { id: 'COLD', label: 'Cold Chain (2-8°C)' },
                    { id: 'CONTROLLED', label: 'Narcotics & Controlled Vault' }
                  ].map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setInventoryCategory(cat.id)}
                      style={{
                        fontSize: 11.5,
                        fontWeight: inventoryCategory === cat.id ? 800 : 600,
                        padding: '4px 12px',
                        borderRadius: 9999,
                        border: inventoryCategory === cat.id ? '1px solid #16a34a' : '1px solid var(--border-default)',
                        background: inventoryCategory === cat.id ? '#dcfce7' : 'var(--bg-surface)',
                        color: inventoryCategory === cat.id ? '#15803d' : 'var(--text-secondary)',
                        cursor: 'pointer'
                      }}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                <button 
                  className="m3-btn anim-hover-lift"
                  onClick={() => {
                    const firstLow = pharmacyInventory.find(i => i.stock <= i.minThreshold) || pharmacyInventory[0];
                    if (firstLow) handleOpenReorder(firstLow);
                  }}
                  style={{ 
                    background: '#16a34a', 
                    color: '#ffffff', 
                    fontSize: 12, 
                    fontWeight: 700, 
                    padding: '6px 14px', 
                    borderRadius: 8,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <RefreshCw size={13} />
                  <span>Generate Purchase Order Reorder</span>
                </button>
              </div>

              {/* Inventory Table */}
              <div 
                className="m3-card"
                style={{ 
                  borderRadius: 14, 
                  border: '1px solid var(--border-default)', 
                  background: 'var(--bg-surface)', 
                  overflow: 'hidden' 
                }}
              >
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-default)', textAlign: 'left' }}>
                        <th style={{ padding: '12px 14px', fontWeight: 800, color: 'var(--text-secondary)' }}>Item & Generic Name</th>
                        <th style={{ padding: '12px 14px', fontWeight: 800, color: 'var(--text-secondary)' }}>Category</th>
                        <th style={{ padding: '12px 14px', fontWeight: 800, color: 'var(--text-secondary)' }}>Storage & Rack</th>
                        <th style={{ padding: '12px 14px', fontWeight: 800, color: 'var(--text-secondary)' }}>Batch & Expiry</th>
                        <th style={{ padding: '12px 14px', fontWeight: 800, color: 'var(--text-secondary)', textAlign: 'center' }}>Stock In Hand</th>
                        <th style={{ padding: '12px 14px', fontWeight: 800, color: 'var(--text-secondary)', textAlign: 'right' }}>Unit MRP</th>
                        <th style={{ padding: '12px 14px', fontWeight: 800, color: 'var(--text-secondary)', textAlign: 'right' }}>Restock PO</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInventory.map(item => {
                        const isLow = item.stock <= item.minThreshold;
                        const isCold = item.temp.includes('Cold');

                        return (
                          <tr key={item.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            <td style={{ padding: '12px 14px' }}>
                              <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{item.genericName}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                                Brand: <strong>{item.brandName}</strong> • {item.strength} • {item.form}
                              </div>
                            </td>
                            <td style={{ padding: '12px 14px', fontSize: 11.5, color: 'var(--text-secondary)' }}>
                              {item.category}
                            </td>
                            <td style={{ padding: '12px 14px' }}>
                              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.rack}</div>
                              <div style={{ fontSize: 10.5, color: isCold ? '#0284c7' : 'var(--text-tertiary)', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                {isCold && <Thermometer size={10} />}
                                {item.temp}
                              </div>
                            </td>
                            <td style={{ padding: '12px 14px', fontSize: 11 }}>
                              <div>{item.batch}</div>
                              <div style={{ color: 'var(--text-tertiary)' }}>Exp: {item.expiry}</div>
                            </td>
                            <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                              <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
                                <span 
                                  style={{ 
                                    fontSize: 13, 
                                    fontWeight: 900, 
                                    color: isLow ? '#dc2626' : '#15803d' 
                                  }}
                                >
                                  {item.stock}
                                </span>
                                <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
                                  Min: {item.minThreshold}
                                </span>
                              </div>
                            </td>
                            <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>
                              ₹{item.unitPrice.toFixed(2)}
                            </td>
                            <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                              <button
                                className={`m3-btn ${isLow ? 'm3-btn-primary' : 'm3-btn-outlined'} anim-hover-lift`}
                                onClick={() => handleOpenReorder(item)}
                                style={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  padding: '4px 10px',
                                  borderRadius: 6,
                                  backgroundColor: isLow ? '#dc2626' : 'transparent',
                                  borderColor: isLow ? '#dc2626' : 'var(--border-default)',
                                  color: isLow ? '#ffffff' : 'var(--text-secondary)'
                                }}
                              >
                                {isLow ? '+ Quick Restock' : '+ Order'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: Clinical Pharmacist Verification Gate                           */}
      {/* ========================================================================= */}
      {isVerifyModalOpen && selectedRx && (
        <div 
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            backgroundColor: 'rgba(15, 23, 42, 0.65)', 
            backdropFilter: 'blur(4px)', 
            zIndex: 9999, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            padding: 20
          }}
        >
          <div 
            className="m3-dialog-container"
            style={{ 
              background: 'var(--bg-surface)', 
              borderRadius: 16, 
              width: '100%', 
              maxWidth: 680, 
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              border: '1px solid var(--border-default)',
              overflow: 'hidden'
            }}
          >
            {/* Modal Header */}
            <div 
              style={{ 
                padding: '18px 24px', 
                borderBottom: '1px solid var(--border-default)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <ShieldCheck size={22} color="#16a34a" />
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 900, margin: 0, color: '#14532d' }}>
                    Clinical e-Rx Verification Gate
                  </h3>
                  <p style={{ margin: 0, fontSize: 11.5, color: '#166534' }}>
                    Rx #{selectedRx.id} • Token {selectedRx.tokenNumber} • Patient: {selectedRx.patientName}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsVerifyModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#166534' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px 24px', maxHeight: '70vh', overflowY: 'auto' }}>
              
              {/* CDSS Safety Gate Summary */}
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#92400e', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertCircle size={14} color="#d97706" />
                  <span>Clinical Safety & Allergen Screening Passed</span>
                </div>
                <div style={{ fontSize: 11.5, color: '#78350f' }}>
                  No lethal drug-drug interactions detected between prescribed items. Beta-lactam and NSAID checks cleared against patient allergy profile.
                </div>
              </div>

              {/* Items Verification Checklist */}
              <div style={{ marginBottom: 16 }}>
                <h4 style={{ fontSize: 13, fontWeight: 800, margin: '0 0 10px', color: 'var(--text-primary)' }}>
                  Formulary & Batch Verification ({selectedRx.items.length} items):
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {selectedRx.items.map((item, idx) => (
                    <div 
                      key={item.id}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        padding: '10px 14px', 
                        background: 'var(--bg-subtle)', 
                        borderRadius: 8,
                        border: '1px solid var(--border-subtle)'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>
                          {idx + 1}. {item.drug}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                          Batch: {item.batch} • Exp: {item.expiry} • Prescribed: {item.qty} {item.form}s
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: 10.5, fontWeight: 800, background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: 4 }}>
                          ✓ In Stock ({item.stockAvailable})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Co-Pay confirmation */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 16px', fontSize: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: '#64748b' }}>Coverage Scheme:</span>
                  <strong style={{ color: '#0f172a' }}>{selectedRx.schemeType}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: '#64748b' }}>Total Billed Value:</span>
                  <span>₹{selectedRx.subtotal.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
                  <span style={{ color: '#0f172a' }}>Patient Co-Pay at Counter:</span>
                  <span style={{ color: selectedRx.patientPayable === 0 ? '#15803d' : '#b45309' }}>
                    {selectedRx.patientPayable === 0 ? '₹0.00 (100% Cashless Govt/TPA)' : `₹${selectedRx.patientPayable.toFixed(2)}`}
                  </span>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div 
              style={{ 
                padding: '14px 24px', 
                borderTop: '1px solid var(--border-default)', 
                display: 'flex', 
                justifyContent: 'flex-end', 
                gap: 10,
                background: 'var(--bg-subtle)'
              }}
            >
              <button 
                className="m3-btn m3-btn-subtle"
                onClick={() => setIsVerifyModalOpen(false)}
                style={{ fontSize: 12, fontWeight: 600 }}
              >
                Cancel
              </button>
              <button 
                className="m3-btn m3-btn-primary"
                onClick={handleConfirmVerify}
                style={{ 
                  background: 'linear-gradient(135deg, #16a34a, #059669)',
                  color: '#ffffff',
                  fontSize: 12, 
                  fontWeight: 800,
                  padding: '8px 18px',
                  borderRadius: 8,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <CheckCircle2 size={15} />
                <span>Sign & Move to Dispense Desk</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: Pill Container Dispensing Label Preview & Print                 */}
      {/* ========================================================================= */}
      {isDispenseModalOpen && selectedRx && (
        <div 
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            backgroundColor: 'rgba(15, 23, 42, 0.65)', 
            backdropFilter: 'blur(4px)', 
            zIndex: 9999, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            padding: 20
          }}
        >
          <div 
            className="m3-dialog-container"
            style={{ 
              background: 'var(--bg-surface)', 
              borderRadius: 16, 
              width: '100%', 
              maxWidth: 620, 
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              border: '1px solid var(--border-default)',
              overflow: 'hidden'
            }}
          >
            {/* Header */}
            <div 
              style={{ 
                padding: '16px 22px', 
                borderBottom: '1px solid var(--border-default)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Printer size={20} color="#16a34a" />
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 900, margin: 0, color: '#14532d' }}>
                    Printable Pill Dispensing Label
                  </h3>
                  <p style={{ margin: 0, fontSize: 11, color: '#166534' }}>
                    Standardised Hospital Pharmacy Label (ABDM & NABH Compliant)
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsDispenseModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#166534' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Label Body Preview */}
            <div style={{ padding: '22px' }}>
              
              {/* Actual Printable Label Box */}
              <div 
                style={{ 
                  border: '2px solid #0f172a', 
                  borderRadius: 10, 
                  padding: '16px 20px', 
                  background: '#ffffff',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
                }}
              >
                {/* Hospital Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1.5px solid #0f172a', paddingBottom: 10, marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>
                      BRIGHT MULTISPECIALITY HOSPITAL
                    </div>
                    <div style={{ fontSize: 10, color: '#475569' }}>
                      Central Pharmacy Counter 01 • Tel: +91 22 4590 1200
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, fontWeight: 900, color: '#0f172a' }}>
                      Token: {selectedRx.tokenNumber}
                    </div>
                    <div style={{ fontSize: 9.5, color: '#475569' }}>
                      Date: 22-OCT-2026
                    </div>
                  </div>
                </div>

                {/* Patient Demographics */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 12 }}>
                  <div>
                    <span style={{ color: '#64748b' }}>Patient: </span>
                    <strong style={{ color: '#0f172a', fontSize: 13 }}>{selectedRx.patientName}</strong>
                    <span style={{ color: '#64748b' }}> ({selectedRx.age}y / {selectedRx.gender})</span>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>MRN: </span>
                    <strong style={{ color: '#0f172a' }}>{selectedRx.mrn}</strong>
                  </div>
                </div>

                {/* Prescribed Items & Instructions */}
                <div style={{ borderTop: '1px dashed #cbd5e1', borderBottom: '1px dashed #cbd5e1', padding: '10px 0', marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>
                    MEDICATIONS PRESCRIBED:
                  </div>
                  {selectedRx.items.map((it, i) => (
                    <div key={it.id} style={{ fontSize: 12, marginBottom: 6 }}>
                      <div style={{ fontWeight: 800, color: '#0f172a' }}>
                        {i + 1}. {it.drug} — Qty: {it.qty} ({it.batch})
                      </div>
                      <div style={{ fontSize: 11, color: '#166534', fontWeight: 600 }}>
                        Directions: Take as prescribed by {selectedRx.prescribedBy}. Store below 25°C.
                      </div>
                    </div>
                  ))}
                </div>

                {/* Warnings & QR Code */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 10, color: '#64748b', maxWidth: 360 }}>
                    <p style={{ margin: '0 0 2px', fontWeight: 700, color: '#dc2626' }}>
                      CAUTION: KEEP OUT OF REACH OF CHILDREN.
                    </p>
                    <p style={{ margin: 0 }}>
                      Dispensed by: Karthik Ramamurthy, RPh (Reg: PH-MH-2018-9941)
                    </p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: 44, height: 44, background: '#f1f5f9', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4 }}>
                      <QrCode size={36} color="#0f172a" />
                    </div>
                    <span style={{ fontSize: 8, color: '#64748b', marginTop: 2 }}>SCAN TO VERIFY</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Footer */}
            <div 
              style={{ 
                padding: '14px 22px', 
                borderTop: '1px solid var(--border-default)', 
                display: 'flex', 
                justifyContent: 'flex-end', 
                gap: 10,
                background: 'var(--bg-subtle)'
              }}
            >
              <button 
                className="m3-btn m3-btn-subtle"
                onClick={() => setIsDispenseModalOpen(false)}
                style={{ fontSize: 12, fontWeight: 600 }}
              >
                Close
              </button>
              <button 
                className="m3-btn anim-hover-lift"
                onClick={() => {
                  window.print();
                  addToast('Dispensary label sent to thermal barcode printer', 'info');
                }}
                style={{ 
                  background: '#ffffff', 
                  border: '1px solid var(--border-default)', 
                  color: 'var(--text-primary)',
                  fontSize: 12, 
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <Printer size={14} />
                <span>Print Thermal Label</span>
              </button>
              {selectedRx.status !== 'DISPENSED' && (
                <button 
                  className="m3-btn m3-btn-primary anim-hover-lift"
                  onClick={handleConfirmDispense}
                  style={{ 
                    background: '#16a34a',
                    color: '#ffffff',
                    fontSize: 12, 
                    fontWeight: 800,
                    padding: '8px 18px',
                    borderRadius: 8,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <CheckCircle2 size={15} />
                  <span>Confirm Dispense & Deduct Stock</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: Purchase Order / Inventory Restock Modal                        */}
      {/* ========================================================================= */}
      {isReorderModalOpen && selectedInvItem && (
        <div 
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            backgroundColor: 'rgba(15, 23, 42, 0.65)', 
            backdropFilter: 'blur(4px)', 
            zIndex: 9999, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            padding: 20
          }}
        >
          <div 
            className="m3-dialog-container"
            style={{ 
              background: 'var(--bg-surface)', 
              borderRadius: 16, 
              width: '100%', 
              maxWidth: 500, 
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              border: '1px solid var(--border-default)',
              overflow: 'hidden'
            }}
          >
            <div 
              style={{ 
                padding: '16px 20px', 
                borderBottom: '1px solid var(--border-default)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                background: 'var(--bg-subtle)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Package size={18} color="#16a34a" />
                <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  Hospital Formulary Restock PO
                </h3>
              </div>
              <button 
                onClick={() => setIsReorderModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: '20px' }}>
              <div style={{ marginBottom: 14 }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Item:</span>
                <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>
                  {selectedInvItem.genericName} ({selectedInvItem.brandName} - {selectedInvItem.strength})
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>
                  Current Stock: {selectedInvItem.stock} | Safety Threshold: {selectedInvItem.minThreshold}
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: 6 }}>
                  Restock Quantity (Units):
                </label>
                <input 
                  type="number"
                  min="10"
                  step="10"
                  value={reorderQty}
                  onChange={(e) => setReorderQty(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--border-default)',
                    background: 'var(--bg-surface)',
                    fontSize: 14,
                    fontWeight: 700,
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ background: '#f8fafc', borderRadius: 8, padding: '12px', fontSize: 12, marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: '#64748b' }}>Unit Cost:</span>
                  <span>₹{selectedInvItem.unitPrice.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
                  <span style={{ color: '#0f172a' }}>Estimated PO Total:</span>
                  <span style={{ color: '#16a34a', fontSize: 13 }}>
                    ₹{(Number(reorderQty || 0) * selectedInvItem.unitPrice).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div 
              style={{ 
                padding: '12px 20px', 
                borderTop: '1px solid var(--border-default)', 
                display: 'flex', 
                justifyContent: 'flex-end', 
                gap: 8,
                background: 'var(--bg-subtle)'
              }}
            >
              <button 
                className="m3-btn m3-btn-subtle"
                onClick={() => setIsReorderModalOpen(false)}
                style={{ fontSize: 12, fontWeight: 600 }}
              >
                Cancel
              </button>
              <button 
                className="m3-btn m3-btn-primary"
                onClick={handleConfirmReorder}
                style={{ 
                  background: '#16a34a', 
                  color: '#ffffff',
                  fontSize: 12, 
                  fontWeight: 800,
                  padding: '6px 16px',
                  borderRadius: 6
                }}
              >
                Submit PO & Replenish Stock
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
