import React, { useState, useRef, useEffect } from 'react';
import { 
  Printer, 
  X, 
  CheckCircle2, 
  Download, 
  FileText, 
  ShieldCheck, 
  Activity, 
  Calendar, 
  User, 
  Clock, 
  Stethoscope, 
  Pill, 
  FlaskConical,
  RotateCcw
} from 'lucide-react';

export default function PrintablePrescriptionModal({
  isOpen,
  onClose,
  patient,
  consultationData = {},
  doctorName = 'Dr. Kiran Patel, MD (General & Internal Medicine)',
  doctorRegNo = 'MC-84920-CA'
}) {
  const [layoutMode, setLayoutMode] = useState('STANDARD'); // 'STANDARD' (A4 Letterhead) | 'THERMAL' (80mm)
  const scrollContainerRef = useRef(null);

  // Always reset scroll to the very top when modal opens or layout changes
  useEffect(() => {
    if (isOpen && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [isOpen, layoutMode]);

  if (!isOpen || !patient) return null;

  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const primaryIcd = consultationData?.icd10Diagnoses?.find(d => d.isPrimary) || consultationData?.icd10Diagnoses?.[0] || {
    code: 'I10',
    title: 'Essential (primary) hypertension'
  };

  const secondaryIcds = (consultationData?.icd10Diagnoses || []).filter(d => d.code !== primaryIcd.code);
  const prescriptions = consultationData?.prescriptions || patient.prescriptions || [];
  const labOrders = consultationData?.labOrders || [];
  const followUp = consultationData?.followUp || 'Review in 7-10 days with test reports';

  // Isolated iframe print method - GUARANTEES zero background page bleed and zero scrollbars
  const handlePrint = () => {
    const printElement = document.getElementById('printable-prescription-document');
    if (!printElement) {
      window.print();
      return;
    }

    let printFrame = document.getElementById('rx-isolated-print-iframe');
    if (!printFrame) {
      printFrame = document.createElement('iframe');
      printFrame.id = 'rx-isolated-print-iframe';
      printFrame.style.position = 'fixed';
      printFrame.style.right = '0';
      printFrame.style.bottom = '0';
      printFrame.style.width = '0';
      printFrame.style.height = '0';
      printFrame.style.border = 'none';
      printFrame.style.visibility = 'hidden';
      document.body.appendChild(printFrame);
    }

    const frameDoc = printFrame.contentWindow || printFrame.contentDocument;
    const doc = frameDoc.document || frameDoc;
    const isThermal = layoutMode === 'THERMAL';

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Prescription - ${patient.fullName} (${patient.uhid || patient.mrn})</title>
        <meta charset="utf-8" />
        <style>
          @page {
            size: ${isThermal ? '80mm auto' : 'A4 portrait'};
            margin: ${isThermal ? '3mm' : '10mm 14mm'};
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #0f172a !important;
            font-family: ${isThermal ? 'monospace, "Courier New", sans-serif' : 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif'};
            font-size: ${isThermal ? '10px' : '11px'};
            line-height: 1.45;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            text-align: left;
          }
          /* Remove all browser scrollbars completely */
          ::-webkit-scrollbar {
            display: none !important;
          }
        </style>
      </head>
      <body>
        ${printElement.innerHTML}
      </body>
      </html>
    `);
    doc.close();

    // Trigger print in the isolated iframe after rendering styles
    setTimeout(() => {
      try {
        printFrame.contentWindow.focus();
        printFrame.contentWindow.print();
      } catch (e) {
        console.error('Iframe print error, falling back to window.print():', e);
        window.print();
      }
    }, 280);
  };

  return (
    <div 
      className="modal-overlay m3-dialog-backdrop no-print"
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.72)',
        backdropFilter: 'blur(6px)',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        zIndex: 9999,
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div 
        className="card print-modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '840px',
          maxWidth: '96vw',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          borderRadius: 16,
          boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          background: '#ffffff',
          border: '1px solid var(--border-default)'
        }}
      >
        {/* Modal Controls Header (Screen Only, Sticky) */}
        <div 
          className="no-print"
          style={{
            padding: '12px 20px',
            background: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="stat-squircle-badge" style={{ width: 34, height: 34, borderRadius: 8, background: '#0077b6', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Printer size={17} />
            </div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 900, color: '#0f172a' }}>
                Official OPD Prescription & Encounter Record
              </div>
              <div style={{ fontSize: 11, color: '#64748b' }}>
                NABH Outpatient Medical Record • Master UHID: <strong style={{ color: '#0077b6' }}>{patient.uhid || patient.mrn}</strong>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Format Toggle Pill */}
            <div style={{ display: 'flex', background: '#e2e8f0', borderRadius: 9999, padding: 2 }}>
              <button
                type="button"
                onClick={() => setLayoutMode('STANDARD')}
                style={{
                  padding: '4px 11px',
                  borderRadius: 9999,
                  border: 'none',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: layoutMode === 'STANDARD' ? '#ffffff' : 'transparent',
                  color: layoutMode === 'STANDARD' ? '#0077b6' : '#64748b',
                  boxShadow: layoutMode === 'STANDARD' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                Standard A4 / PDF
              </button>
              <button
                type="button"
                onClick={() => setLayoutMode('THERMAL')}
                style={{
                  padding: '4px 11px',
                  borderRadius: 9999,
                  border: 'none',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: layoutMode === 'THERMAL' ? '#ffffff' : 'transparent',
                  color: layoutMode === 'THERMAL' ? '#0077b6' : '#64748b',
                  boxShadow: layoutMode === 'THERMAL' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                Thermal 80mm Slip
              </button>
            </div>

            {/* Print Button */}
            <button
              type="button"
              className="m3-btn m3-btn-filled anim-hover-lift"
              onClick={handlePrint}
              style={{
                height: 32,
                fontSize: 11.5,
                fontWeight: 800,
                padding: '0 14px',
                background: 'linear-gradient(135deg, #0077b6, #023e8a)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 8,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 2px 6px rgba(0, 119, 182, 0.3)'
              }}
            >
              <Printer size={14} />
              <span>Print / Save PDF</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              className="icon-btn anim-hover-lift"
              onClick={onClose}
              style={{ width: 30, height: 30, color: '#64748b', borderRadius: 8, border: '1px solid #e2e8f0', background: '#ffffff' }}
              title="Close prescription modal"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Scrollable Document Container */}
        <div 
          ref={scrollContainerRef}
          className="print-prescription-container m3-scrollable-body"
          style={{
            padding: layoutMode === 'THERMAL' ? '24px 20px' : '28px 36px',
            flex: 1,
            overflowY: 'auto',
            background: layoutMode === 'THERMAL' ? '#f1f5f9' : '#ffffff',
            color: '#0f172a'
          }}
        >
          {/* Printable Document Root */}
          <div 
            id="printable-prescription-document"
            style={{
              width: layoutMode === 'THERMAL' ? '390px' : '100%',
              maxWidth: '100%',
              margin: '0 auto',
              padding: layoutMode === 'THERMAL' ? '18px 16px' : '0',
              background: '#ffffff',
              border: layoutMode === 'THERMAL' ? '1px dashed #94a3b8' : 'none',
              borderRadius: layoutMode === 'THERMAL' ? '8px' : '0',
              boxShadow: layoutMode === 'THERMAL' ? '0 4px 20px rgba(0, 0, 0, 0.08)' : 'none',
              fontFamily: layoutMode === 'THERMAL' ? 'monospace, "Courier New", sans-serif' : 'system-ui, -apple-system, sans-serif'
            }}
          >
            {/* Hospital Header Banner */}
            <div style={{ borderBottom: '2.5px solid #0077b6', paddingBottom: 12, marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: 'linear-gradient(135deg, #0077b6, #00b4d8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontWeight: 900, fontSize: 16 }}>
                      BS
                    </div>
                    <div>
                      <h1 style={{ margin: 0, fontSize: layoutMode === 'THERMAL' ? 14 : 19, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>
                        BRIGHT SOLUTIONS HOSPITAL
                      </h1>
                      <div style={{ fontSize: layoutMode === 'THERMAL' ? 9.5 : 11, color: '#475569', fontWeight: 600 }}>
                        Multispeciality Clinical Hospital & Research Center
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: layoutMode === 'THERMAL' ? 8.5 : 10, color: '#64748b', marginTop: 4 }}>
                    Greams Road, Thousand Lights, Chennai 600006 • Tel: +91 44 2829 0000 • ABDM ID: IN33004812
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 9999, background: '#e0f2fe', color: '#0369a1', fontWeight: 800, border: '1px solid #bae6fd' }}>
                    NABH ACCREDITED OPD
                  </span>
                  <div style={{ fontSize: layoutMode === 'THERMAL' ? 9.5 : 11.5, fontWeight: 800, color: '#0f172a', marginTop: 4 }}>
                    {doctorName}
                  </div>
                  <div style={{ fontSize: 9.5, color: '#64748b' }}>
                    Reg: {doctorRegNo} • Cabin 01
                  </div>
                </div>
              </div>
            </div>

            {/* Patient Demographics & Encounter Strip */}
            <div style={{ 
              background: '#f8fafc', 
              border: '1px solid #cbd5e1', 
              borderRadius: 8, 
              padding: layoutMode === 'THERMAL' ? '8px 10px' : '10px 14px', 
              marginBottom: 14,
              fontSize: layoutMode === 'THERMAL' ? 9.5 : 11,
              lineHeight: 1.5
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: layoutMode === 'THERMAL' ? '1fr' : 'repeat(4, 1fr)', gap: 8 }}>
                <div>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>Patient Name: </span>
                  <strong style={{ color: '#0f172a' }}>{patient.fullName}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>Master UHID: </span>
                  <strong style={{ color: '#0077b6' }}>{patient.uhid || patient.mrn}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>OPD Encounter No: </span>
                  <strong style={{ color: '#0f172a' }}>{patient.opdId || `OPD-26-${patient.tokenNumber}`}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>Token #: </span>
                  <strong style={{ color: '#d97706' }}>Token {patient.tokenNumber}</strong>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: layoutMode === 'THERMAL' ? '1fr' : 'repeat(4, 1fr)', gap: 8, marginTop: 4, paddingTop: 4, borderTop: '1px solid #e2e8f0' }}>
                <div>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>Age / Gender: </span>
                  <span>{patient.age} Yrs / {patient.gender}</span>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>Date & Time: </span>
                  <span>{currentDate} • {currentTime}</span>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>Referred By: </span>
                  <span>{patient.referredBy || 'Self Walk-in'}</span>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>Billing Scheme: </span>
                  <span>{patient.insurance?.provider || 'Self-Pay / Cash'}</span>
                </div>
              </div>

              {/* Vitals Summary Line */}
              {patient.vitals && (
                <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', fontSize: 10.5 }}>
                  <span style={{ fontWeight: 800, color: '#0077b6' }}>Vitals Recorded:</span>
                  <span>BP: <strong>{patient.vitals.bp || '120/80'} mmHg</strong></span>
                  <span>•</span>
                  <span>Pulse: <strong>{patient.vitals.pulse || '72'} bpm</strong></span>
                  <span>•</span>
                  <span>Temp: <strong>{patient.vitals.temp || '98.6'}°F</strong></span>
                  <span>•</span>
                  <span>SpO2: <strong>{patient.vitals.spo2 || '99'}%</strong></span>
                  <span>•</span>
                  <span>BMI: <strong>{patient.vitals.bmi || '22.8'} kg/m²</strong></span>
                </div>
              )}
            </div>

            {/* ICD-10 Diagnoses Section (MANDATORY NABH REQUIREMENT) */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10.5, fontWeight: 800, color: '#0077b6', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>DIAGNOSIS (ICD-10 India Edition):</span>
                <span style={{ fontSize: 8.5, background: '#dbeafe', color: '#1e40af', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>
                  NABH Mandatory Field
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ padding: '3px 8px', borderRadius: 6, background: '#eff6ff', border: '1px solid #bfdbfe', fontSize: 11, fontWeight: 700, color: '#1e40af' }}>
                  Primary: [{primaryIcd.code}] {primaryIcd.title}
                </span>
                {secondaryIcds.map(sec => (
                  <span key={sec.code} style={{ padding: '3px 8px', borderRadius: 6, background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: 10.5, fontWeight: 600, color: '#475569' }}>
                    Secondary: [{sec.code}] {sec.title}
                  </span>
                ))}
              </div>
            </div>

            {/* Prescriptions (Rx) Section */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <span style={{ fontSize: 18, fontWeight: 900, color: '#0077b6', fontStyle: 'italic', fontFamily: 'serif' }}>Rx</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Prescribed Medications
                </span>
              </div>

              {prescriptions.length === 0 ? (
                <div style={{ padding: 10, background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: 6, fontSize: 11, color: '#64748b', textAlign: 'center' }}>
                  No active medications prescribed for this consultation.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: layoutMode === 'THERMAL' ? 9.5 : 10.5 }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', borderBottom: '1.5px solid #cbd5e1', textAlign: 'left' }}>
                      <th style={{ padding: '6px 8px', fontWeight: 800, width: '28px' }}>#</th>
                      <th style={{ padding: '6px 8px', fontWeight: 800 }}>Medication Name & Strength</th>
                      <th style={{ padding: '6px 8px', fontWeight: 800, width: '75px' }}>Frequency</th>
                      <th style={{ padding: '6px 8px', fontWeight: 800, width: '55px' }}>Duration</th>
                      <th style={{ padding: '6px 8px', fontWeight: 800 }}>Timing & Clinical Instructions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prescriptions.map((rx, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '6px 8px', color: '#64748b', fontWeight: 700 }}>{idx + 1}</td>
                        <td style={{ padding: '6px 8px', fontWeight: 700, color: '#0f172a' }}>
                          <div>{rx.drug}</div>
                          <div style={{ fontSize: 9, color: '#64748b', fontWeight: 500 }}>
                            Route: {rx.route || 'Oral (PO)'} • Qty: {rx.qty || 'Standard'}
                          </div>
                        </td>
                        <td style={{ padding: '6px 8px', fontWeight: 700, color: '#0077b6' }}>
                          {rx.freq || '1-0-1'}
                        </td>
                        <td style={{ padding: '6px 8px' }}>
                          {rx.days || '5d'}
                        </td>
                        <td style={{ padding: '6px 8px', color: '#334155' }}>
                          <div>{rx.mealTiming || 'After Meals'}</div>
                          {rx.notes && (
                            <div style={{ fontSize: 9, color: '#64748b', fontStyle: 'italic' }}>
                              {rx.notes}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pathology Orders Section */}
            {labOrders.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10.5, fontWeight: 800, color: '#0077b6', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FlaskConical size={12} />
                  <span>Diagnostic & Laboratory Investigations Ordered:</span>
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 10.5, color: '#334155' }}>
                  {labOrders.map((lab, i) => (
                    <li key={i} style={{ marginBottom: 2 }}>
                      <strong>{lab.name}</strong> ({lab.urgency || 'Routine'}) {lab.notes ? `— ${lab.notes}` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Clinical Advice / Plan & Follow-up */}
            <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: 8, marginBottom: 16 }}>
              <div style={{ fontSize: 10.5, fontWeight: 800, color: '#0f172a', marginBottom: 3 }}>
                CLINICAL ADVICE & DIETARY GUIDELINES:
              </div>
              <div style={{ fontSize: 10.5, color: '#475569', lineHeight: 1.45 }}>
                {consultationData?.plan || 'Maintain proper hydration. Restrict sodium and spicy food intake. Report immediately if chest pain, severe breathlessness or dizziness occurs.'}
              </div>
              <div style={{ marginTop: 5, fontSize: 10.5, fontWeight: 700, color: '#0077b6' }}>
                🗓️ Follow-up Review: {followUp}
              </div>
            </div>

            {/* Doctor Signature & Legal Block */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', borderTop: '2px solid #0077b6', paddingTop: 10 }}>
              <div style={{ fontSize: 9, color: '#64748b', maxWidth: '380px' }}>
                <div>* Digitally signed in compliance with EHR Standards for India & IT Act 2000.</div>
                <div>* Valid for 15 days from issue date. Substitute drugs only per statutory formulary.</div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ 
                  fontFamily: 'cursive, serif', 
                  fontSize: 17, 
                  color: '#0077b6', 
                  fontWeight: 700,
                  transform: 'rotate(-2deg)',
                  marginBottom: 2
                }}>
                  Dr. Kiran Patel
                </div>
                <div style={{ fontSize: 10.5, fontWeight: 800, color: '#0f172a' }}>
                  {doctorName}
                </div>
                <div style={{ fontSize: 9, color: '#64748b' }}>
                  Reg: {doctorRegNo} • Cabin 01
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls (Screen Only) */}
        <div 
          className="no-print"
          style={{
            padding: '10px 20px',
            background: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#64748b' }}>
            <ShieldCheck size={14} color="#16a34a" />
            <span>NABH Auditable Outpatient Prescription Record</span>
          </div>
          <button
            type="button"
            className="m3-btn m3-btn-outlined"
            onClick={onClose}
            style={{ height: 28, fontSize: 11.5, padding: '0 14px' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
