import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UploadCloud, 
  FileText, 
  Activity, 
  CheckCircle2, 
  Trash2, 
  AlertCircle, 
  FileUp, 
  Search,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  HardDrive
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../components/ui/Toast';
import { api } from '../../services/api';

const MODALITIES = [
  { id: 'DICOM', label: 'DICOM Imaging', icon: HardDrive, desc: 'CT, MRI, X-Ray slice sets (.dcm)' },
  { id: 'ECG', label: '12-Lead ECG Strip', icon: Activity, desc: 'Digital rhythm strips, EDF / PDF' },
  { id: 'LAB_PDF', label: 'Lab Blood Report', icon: FileText, desc: 'Pathology, Biochemistry panels (.pdf)' },
  { id: 'DISCHARGE', label: 'Discharge Summary', icon: ShieldCheck, desc: 'Previous hospital summaries (.pdf, .jpg)' },
];

export default function DiagnosticReportsPage() {
  const { addToast } = useToast();
  const [selectedToken, setSelectedToken] = useState('Q-102');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModality, setSelectedModality] = useState('DICOM');
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadQueue, setUploadQueue] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);

  // Active visit metadata mock
  const activeEncounter = {
    visitId: 102,
    token: 'Q-102',
    uhid: 'UHID-2026-00002',
    patientName: 'Ramesh Patel',
    age: 50,
    gender: 'MALE',
    attendingDoctor: 'Dr. Vikram Kulkarni, MD',
  };

  useEffect(() => {
    loadReports();
  }, [selectedToken]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const data = await api.getReports(activeEncounter.visitId);
      setReports(data?.reports || []);
    } catch {
      // handled by fallback
    } finally {
      setLoading(false);
    }
  };

  const handleFilesChosen = (files) => {
    const fileList = Array.from(files);
    if (!fileList.length) return;

    const newItems = fileList.map((file) => ({
      id: Math.random().toString(36).substring(7),
      file,
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
      modality: selectedModality,
      progress: 0,
      status: 'pending',
    }));

    setUploadQueue((prev) => [...prev, ...newItems]);
    processUploads(newItems);
  };

  const processUploads = async (items) => {
    setUploading(true);
    for (const item of items) {
      setUploadQueue((prev) =>
        prev.map((it) => (it.id === item.id ? { ...it, status: 'uploading', progress: 45 } : it))
      );

      const formData = new FormData();
      formData.append('file', item.file);
      formData.append('report_type', item.modality);

      try {
        await api.uploadExternalReport(activeEncounter.visitId, formData);
        setUploadQueue((prev) =>
          prev.map((it) => (it.id === item.id ? { ...it, status: 'completed', progress: 100 } : it))
        );
        addToast({
          type: 'success',
          title: 'Report Ingested',
          message: `${item.name} archived for ${activeEncounter.patientName}.`,
        });
        loadReports();
      } catch {
        setUploadQueue((prev) =>
          prev.map((it) => (it.id === item.id ? { ...it, status: 'error' } : it))
        );
        addToast({
          type: 'error',
          title: 'Upload Failed',
          message: `Could not process ${item.name}.`,
        });
      }
    }
    setUploading(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files) {
      handleFilesChosen(e.dataTransfer.files);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-navy-100 dark:border-navy-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-ochre-600 dark:text-ochre-400">
              P-REC-04 • Diagnostics Archival
            </span>
            <Badge variant="navy" size="xs">PACS & Document Bridge</Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-navy-900 dark:text-white">
            External Diagnostic Reports Ingestion
          </h1>
          <p className="text-sm text-navy-500 dark:text-navy-400 mt-1">
            Digitize and bind prior patient scans, rhythm strips, and lab panels into the active encounter.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadReports}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Sync Records
          </Button>
        </div>
      </div>

      {/* Active Patient Token Bar */}
      <Card className="p-4 bg-gradient-to-r from-navy-900 to-navy-800 text-white border-0 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-canary-400/20 flex items-center justify-center border border-canary-400/30">
              <span className="font-mono text-canary-400 font-bold text-lg">
                {activeEncounter.token}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  {activeEncounter.patientName}
                </h3>
                <span className="font-mono text-xs text-navy-300">
                  ({activeEncounter.uhid})
                </span>
              </div>
              <p className="text-xs text-navy-300 mt-0.5">
                {activeEncounter.age}Y • {activeEncounter.gender} • Consulting with{' '}
                <span className="text-canary-300 font-medium">{activeEncounter.attendingDoctor}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
              <input
                type="text"
                placeholder="Search other token..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-navy-800/80 border border-navy-700 rounded-lg text-xs font-mono text-white placeholder-navy-400 focus:outline-none focus:ring-1 focus:ring-canary-400"
              />
            </div>
            <Badge variant="canary" size="sm" className="font-mono">
              ACTIVE ENCOUNTER
            </Badge>
          </div>
        </div>
      </Card>

      {/* Ingestion Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Dropzone & Modality Selector (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="p-5 space-y-5">
            <div>
              <h2 className="text-base font-bold text-navy-900 dark:text-white">
                1. Select Diagnostic Modality
              </h2>
              <p className="text-xs text-navy-500 dark:text-navy-400 mt-0.5">
                Classifying the scan configures the physician's interactive canvas viewer.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {MODALITIES.map((mod) => {
                const Icon = mod.icon;
                const isSelected = selectedModality === mod.id;
                return (
                  <button
                    key={mod.id}
                    type="button"
                    onClick={() => setSelectedModality(mod.id)}
                    className={`p-3.5 rounded-xl text-left border transition-all ${
                      isSelected
                        ? 'border-canary-400 bg-canary-400/10 shadow-sm dark:bg-canary-400/5'
                        : 'border-navy-100 dark:border-navy-800 bg-white dark:bg-navy-900 hover:border-navy-300 dark:hover:border-navy-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className={`p-2 rounded-lg ${isSelected ? 'bg-canary-400 text-navy-950 font-bold' : 'bg-navy-50 dark:bg-navy-800 text-navy-600 dark:text-navy-300'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-canary-500 animate-pulse" />
                      )}
                    </div>
                    <div className="font-semibold text-xs text-navy-900 dark:text-white">
                      {mod.label}
                    </div>
                    <div className="text-[11px] text-navy-500 dark:text-navy-400 mt-0.5 line-clamp-1">
                      {mod.desc}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-2">
              <h2 className="text-base font-bold text-navy-900 dark:text-white mb-2">
                2. Ingest Scan Media
              </h2>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
                  isDragOver
                    ? 'border-canary-400 bg-canary-400/10 scale-[0.99]'
                    : 'border-navy-200 dark:border-navy-700 hover:border-canary-400/60 bg-navy-50/50 dark:bg-navy-900/50'
                }`}
                onClick={() => document.getElementById('file-upload-input').click()}
              >
                <input
                  id="file-upload-input"
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFilesChosen(e.target.files)}
                />
                <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-canary-400/20 text-navy-900 dark:text-canary-400 flex items-center justify-center">
                  <UploadCloud className="w-7 h-7 text-ochre-600 dark:text-canary-400" />
                </div>
                <p className="text-sm font-bold text-navy-900 dark:text-white">
                  Drag and drop files here, or <span className="text-ochre-600 dark:text-canary-400 underline">browse storage</span>
                </p>
                <p className="text-xs text-navy-500 dark:text-navy-400 mt-1.5 font-mono">
                  Supported formats: .DCM, .DICOM, .PDF, .PNG, .JPG (Max 50MB per file)
                </p>
              </div>
            </div>

            {/* Ingestion Queue Activity */}
            {uploadQueue.length > 0 && (
              <div className="space-y-2 pt-3 border-t border-navy-100 dark:border-navy-800">
                <span className="text-xs font-bold text-navy-700 dark:text-navy-300">
                  Recent Ingestion Queue
                </span>
                <div className="space-y-2">
                  {uploadQueue.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-navy-50 dark:bg-navy-800/60 border border-navy-100 dark:border-navy-700"
                    >
                      <div className="flex items-center gap-3">
                        <FileUp className="w-4 h-4 text-ochre-500" />
                        <div>
                          <p className="text-xs font-semibold text-navy-900 dark:text-white">
                            {item.name}
                          </p>
                          <p className="text-[10px] font-mono text-navy-500">
                            {item.size} • Modality: {item.modality}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.status === 'completed' ? (
                          <Badge variant="emerald" size="xs" className="flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Ingested
                          </Badge>
                        ) : item.status === 'uploading' ? (
                          <span className="text-xs font-mono text-ochre-600 dark:text-canary-400">
                            {item.progress}%
                          </span>
                        ) : (
                          <Badge variant="red" size="xs">Failed</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Existing Archived Scans for this Patient (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-navy-900 dark:text-white">
                  Archived Reports ({reports.length})
                </h2>
                <p className="text-xs text-navy-500 dark:text-navy-400">
                  Attached to encounter #{activeEncounter.token}
                </p>
              </div>
              <Badge variant="ochre" size="xs">VERIFIED</Badge>
            </div>

            <div className="space-y-3">
              {reports.map((rep) => (
                <div
                  key={rep.id}
                  className="p-4 rounded-xl border border-navy-100 dark:border-navy-800 bg-white dark:bg-navy-900 hover:border-canary-400/40 transition-all shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-navy-100 dark:bg-navy-800 text-navy-700 dark:text-navy-300 mt-0.5">
                        {rep.type === 'DICOM' ? (
                          <HardDrive className="w-4 h-4" />
                        ) : rep.type === 'ECG' ? (
                          <Activity className="w-4 h-4 text-red-500" />
                        ) : (
                          <FileText className="w-4 h-4 text-blue-500" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-navy-900 dark:text-white leading-snug">
                          {rep.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="navy" size="xs" className="font-mono">
                            {rep.type}
                          </Badge>
                          <span className="text-[11px] font-mono text-navy-400">
                            {rep.date}
                          </span>
                        </div>
                        {rep.slices_count && (
                          <p className="text-[10px] text-navy-500 font-mono mt-1">
                            DICOM series: {rep.slices_count} axial slices loaded
                          </p>
                        )}
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() =>
                        addToast({
                          type: 'info',
                          title: 'Launch Viewer',
                          message: `Opening ${rep.title} in physician workspace.`,
                        })
                      }
                      className="text-navy-500 hover:text-navy-900 dark:hover:text-white"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 p-3 rounded-xl bg-canary-400/10 border border-canary-400/20 text-navy-900 dark:text-navy-100">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-ochre-600 dark:text-canary-400 shrink-0" />
                <p className="text-xs font-semibold">
                  Automatic Physician Sync
                </p>
              </div>
              <p className="text-[11px] text-navy-600 dark:text-navy-300 mt-1 leading-relaxed">
                Ingested diagnostic media automatically syncs into Dr. Vikram Kulkarni's <strong>P-DOC-03 Diagnostic Viewer</strong> window.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
