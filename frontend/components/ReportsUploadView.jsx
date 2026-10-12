import React, { useState } from 'react';
import { 
  UploadCloud, 
  FileText, 
  Layers, 
  Activity, 
  CheckCircle2, 
  X, 
  AlertCircle, 
  Trash2, 
  Eye, 
  Clock,
  ArrowRight
} from 'lucide-react';
import { usePatients } from '../context/PatientContext';
import { reports as reportsApi } from '../services/api';

const REPORT_TYPES = [
  { id: 'DICOM_SCAN', label: 'DICOM Scan (CT / MRI / PET / X-Ray)', icon: Layers, accept: '.dcm,.zip,.tar.gz,.png,.jpg' },
  { id: 'ECG_WAVEFORM', label: '12-Lead ECG Waveform Strip', icon: Activity, accept: '.pdf,.png,.jpg,.svg' },
  { id: 'LAB_BLOODWORK', label: 'Clinical Lab Bloodwork & Biochemistry', icon: FileText, accept: '.pdf,.png,.jpg' },
  { id: 'DISCHARGE_SUMMARY', label: 'Prior Hospital Discharge Summary', icon: FileText, accept: '.pdf,.docx,.jpg' }
];

const SAMPLE_EXISTING_REPORTS = [
  { id: 'rep-01', patientId: 'pat-001', fileName: 'CT_Thorax_Contrast_148sl.dcm', type: 'DICOM_SCAN', size: '28.4 MB', uploadedAt: '09:05 AM', status: 'VERIFIED' },
  { id: 'rep-02', patientId: 'pat-001', fileName: 'Histopath_Biopsy_IDC_Grade2.pdf', type: 'LAB_BLOODWORK', size: '2.1 MB', uploadedAt: '09:08 AM', status: 'VERIFIED' },
  { id: 'rep-03', patientId: 'pat-002', fileName: 'Resting_12Lead_ECG_Strip.pdf', type: 'ECG_WAVEFORM', size: '840 KB', uploadedAt: '09:22 AM', status: 'VERIFIED' },
  { id: 'rep-04', patientId: 'pat-004', fileName: 'PET_CT_Restaging_WholeBody.dcm', type: 'DICOM_SCAN', size: '42.8 MB', uploadedAt: '08:40 AM', status: 'VERIFIED' }
];

export default function ReportsUploadView({ onSwitchToDoctor }) {
  const { patients, selectedPatientId, setSelectedPatientId, addToast } = usePatients();
  const [selectedType, setSelectedType] = useState('DICOM_SCAN');
  const [reportsList, setReportsList] = useState(SAMPLE_EXISTING_REPORTS);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const activePatient = patients.find(p => p.id === selectedPatientId) || patients[0];

  const handleFileDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer ? e.dataTransfer.files : e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    simulateUpload(file);
  };

  const simulateUpload = (file) => {
    setIsUploading(true);
    setUploadProgress(15);

    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          setTimeout(() => {
            setIsUploading(false);
            setUploadProgress(0);
            const newRep = {
              id: `rep-${Date.now()}`,
              patientId: activePatient.id,
              fileName: file.name,
              type: selectedType,
              size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
              uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              status: 'VERIFIED'
            };
            setReportsList(prevReps => [newRep, ...prevReps]);
            addToast(`Diagnostic report "${file.name}" uploaded & routed to Dr. Station!`, 'success');
          }, 350);
          return 100;
        }
        return prev + 25;
      });
    }, 200);
  };

  const patientReports = reportsList.filter(r => r.patientId === activePatient?.id);

  return (
    <div className="card m3-page-animate" style={{ padding: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            External Diagnostic Reports Ingestion
          </h2>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2, margin: 0 }}>
            Upload past radiological scans (DICOM), 12-lead ECG strips, and laboratory blood reports for physician review.
          </p>
        </div>

        {/* Patient Token Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)' }}>
            Patient Encounter:
          </label>
          <select
            value={activePatient?.id}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            style={{
              padding: '6px 12px',
              fontSize: 12,
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-default)',
              background: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              fontWeight: 600,
              outline: 'none'
            }}
          >
            {patients.map(p => (
              <option key={p.id} value={p.id}>
                {p.fullName} ({p.mrn}) • {p.appointmentTime}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid: Type Selector + Drop Zone */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 20 }}>
        {/* Left: Report Type Selection */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)' }}>
            Select Medical Report Category:
          </label>
          {REPORT_TYPES.map(type => {
            const Icon = type.icon;
            const isSelected = selectedType === type.id;
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => setSelectedType(type.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: isSelected ? '1.5px solid var(--primary)' : '1px solid var(--border-default)',
                  background: isSelected ? 'var(--bg-active)' : 'var(--bg-surface)',
                  color: isSelected ? 'var(--on-primary-container)' : 'var(--text-primary)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: isSelected ? 'var(--primary)' : 'var(--bg-subtle)',
                  color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Icon size={16} />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>{type.label}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>Accepted: {type.accept}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right: Drag and Drop Area */}
        <div>
          <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>
            File Ingestion Drop Zone:
          </label>
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleFileDrop}
            style={{
              height: 200,
              border: isDragging ? '2px dashed var(--primary)' : '2px dashed var(--border-strong)',
              borderRadius: 'var(--radius-lg)',
              background: isDragging ? 'var(--bg-hover)' : 'var(--bg-subtle)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              position: 'relative',
              transition: 'all 0.2s ease',
              textAlign: 'center',
              padding: 16
            }}
          >
            <input
              type="file"
              onChange={handleFileDrop}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: 0,
                cursor: 'pointer'
              }}
            />
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)',
              marginBottom: 10
            }}>
              <UploadCloud size={24} />
            </div>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>
              Drag & Drop Report Files Here
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
              or click to browse from workstation drive (.dcm, .pdf, .png, .jpg)
            </p>

            {isUploading && (
              <div style={{ width: '80%', marginTop: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                  <span>Uploading to Clinical PACS Archive...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div style={{ width: '100%', height: 6, background: 'var(--border-default)', borderRadius: 9999, overflow: 'hidden' }}>
                  <div style={{ width: `${uploadProgress}%`, height: '100%', background: 'var(--primary)', transition: 'width 0.2s linear' }} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reports Table for Selected Patient */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <h3 style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
            Uploaded Diagnostic Files for {activePatient?.fullName} ({patientReports.length})
          </h3>
          {onSwitchToDoctor && (
            <button
              className="m3-btn m3-btn-tonal"
              onClick={onSwitchToDoctor}
              style={{ height: 26, fontSize: 11 }}
            >
              <span>View in Doctor Workspace</span>
              <ArrowRight size={13} />
            </button>
          )}
        </div>

        {patientReports.length === 0 ? (
          <div style={{
            padding: '24px',
            textAlign: 'center',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-subtle)',
            color: 'var(--text-muted)',
            fontSize: 12
          }}>
            No outside reports attached for this encounter yet. Drop a file above to upload.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="m3-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-default)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '8px 10px' }}>File Name</th>
                  <th style={{ padding: '8px 10px' }}>Category</th>
                  <th style={{ padding: '8px 10px' }}>Size</th>
                  <th style={{ padding: '8px 10px' }}>Uploaded At</th>
                  <th style={{ padding: '8px 10px' }}>Status</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {patientReports.map(rep => (
                  <tr key={rep.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '8px 10px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {rep.fileName}
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      <span className="badge badge-active" style={{ fontSize: 10 }}>{rep.type}</span>
                    </td>
                    <td style={{ padding: '8px 10px', color: 'var(--text-secondary)' }}>{rep.size}</td>
                    <td style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>{rep.uploadedAt}</td>
                    <td style={{ padding: '8px 10px' }}>
                      <span className="badge badge-ready" style={{ fontSize: 10 }}>
                        <CheckCircle2 size={10} /> Verified
                      </span>
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setReportsList(prev => prev.filter(r => r.id !== rep.id));
                          addToast(`Removed ${rep.fileName}`, 'info');
                        }}
                        className="icon-btn"
                        style={{ width: 24, height: 24, color: '#dc2626' }}
                        title="Delete file"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
