import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  HardDrive,
  Users,
  ChevronRight
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../components/ui/Toast';
import { api } from '../../services/api';
import { ROUTES } from '../../routes';

const MODALITIES = [
  { id: 'DICOM', label: 'DICOM Imaging', icon: HardDrive, desc: 'CT, MRI, X-Ray slice sets (.dcm)' },
  { id: 'ECG', label: '12-Lead ECG Strip', icon: Activity, desc: 'Digital rhythm strips, EDF / PDF' },
  { id: 'LAB_PDF', label: 'Lab Blood Report', icon: FileText, desc: 'Pathology, Biochemistry panels (.pdf)' },
  { id: 'DISCHARGE', label: 'Discharge Summary', icon: ShieldCheck, desc: 'Previous hospital summaries (.pdf, .jpg)' },
];

const INITIAL_PATIENTS = [
  {
    visitId: 101,
    token: 'Q-101',
    uhid: 'UHID-2026-00001',
    patientName: 'Ananya Sharma',
    age: 52,
    gender: 'FEMALE',
    attendingDoctor: 'Dr. Vikram Kulkarni, MD',
    reportsCount: 1,
  },
  {
    visitId: 102,
    token: 'Q-102',
    uhid: 'UHID-2026-00002',
    patientName: 'Ramesh Patel',
    age: 50,
    gender: 'MALE',
    attendingDoctor: 'Dr. Vikram Kulkarni, MD',
    reportsCount: 2,
  },
  {
    visitId: 103,
    token: 'Q-103',
    uhid: 'UHID-2026-00003',
    patientName: 'Sunita Rao',
    age: 62,
    gender: 'FEMALE',
    attendingDoctor: 'Dr. Ananya Roy, MBBS',
    reportsCount: 0,
  },
];

export default function DiagnosticReportsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addToast } = useToast();

  const [patients, setPatients] = useState(INITIAL_PATIENTS);
  const [selectedToken, setSelectedToken] = useState('Q-102');
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedModality, setSelectedModality] = useState('DICOM');
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadQueue, setUploadQueue] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);

  // Sync with URL param
  useEffect(() => {
    const paramToken = searchParams.get('token');
    if (paramToken) {
      setSelectedToken(paramToken);
      setPatients((prev) => {
        if (!prev.find((p) => p.token === paramToken)) {
          return [
            {
              visitId: Date.now(),
              token: paramToken,
              uhid: `UHID-2026-0000${Math.floor(Math.random() * 80) + 20}`,
              patientName: 'Registered Walk-in Patient',
              age: 45,
              gender: 'MALE',
              attendingDoctor: 'Dr. Vikram Kulkarni, MD',
              reportsCount: 0,
            },
            ...prev,
          ];
        }
        return prev;
      });
    }
  }, [searchParams]);

  const activeEncounter = patients.find((p) => p.token === selectedToken) || patients[0];

  useEffect(() => {
    if (activeEncounter) {
      loadReports();
    }
  }, [selectedToken]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const data = await api.getReports(activeEncounter.visitId);
      setReports(data?.reports || []);
    } catch {
      // fallback handled
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
          prev.map((it) => (it.id === item.id ? { ...it, status: 'complete', progress: 100 } : it))
        );
        addToast({
          title: 'Report Ingested',
          message: `${item.name} uploaded for #${activeEncounter.token}.`,
          type: 'success',
        });
        loadReports();
      } catch (err) {
        setUploadQueue((prev) =>
          prev.map((it) => (it.id === item.id ? { ...it, status: 'error' } : it))
        );
        addToast({
          title: 'Upload Failed',
          message: err.message || 'File ingestion error.',
          type: 'error',
        });
      }
    }
    setUploading(false);
  };

  const filteredPatients = patients.filter(
    (p) =>
      p.patientName.toLowerCase().includes(patientSearch.toLowerCase()) ||
      p.token.toLowerCase().includes(patientSearch.toLowerCase()) ||
      p.uhid.toLowerCase().includes(patientSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EAE4D3] dark:border-[#1B456E] pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase font-mono tracking-wider text-[#8A740C] dark:text-[#FFC21A]">
              P-REC-04 • Patient-List Based Diagnostic Ingestion
            </span>
            <Badge variant="brand" size="xs">Digital Records</Badge>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0A2540] dark:text-white">
            Diagnostic Reports & External Ingestion
          </h1>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
            Attach multi-slice DICOM series, 12-lead ECG rhythm strips, and lab pathology panels to patient encounters.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadReports}
          icon={RefreshCw}
          className="self-start sm:self-auto"
        >
          Sync Records
        </Button>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Patient Queue Roster (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <Card variant="surface" className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#0A2540] dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-[#8A740C] dark:text-[#FFC21A]" />
                Registered Patients ({patients.length})
              </h2>
              <span className="text-[10px] font-mono text-[#64748B] dark:text-[#94A3B8]">
                Diagnostic Intake
              </span>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
              <input
                type="text"
                placeholder="Search patient, token, UHID..."
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-[#FAF6EC] dark:bg-[#071D33] border border-[#EAE4D3] dark:border-[#1B456E] rounded-xl text-xs text-[#0A2540] dark:text-white placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#FFC21A]"
              />
            </div>

            {/* Patient Cards */}
            <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
              {filteredPatients.map((p) => {
                const isSelected = p.token === activeEncounter?.token;

                return (
                  <button
                    key={p.token}
                    type="button"
                    onClick={() => setSelectedToken(p.token)}
                    className={`w-full text-left p-3.5 rounded-2xl transition-all border flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'bg-[#FAF6EC] dark:bg-[#0F355A] border-[#FFC21A] ring-1 ring-[#FFC21A] shadow-sm'
                        : 'bg-white dark:bg-[#0A2540] border-[#EAE4D3] dark:border-[#1B456E] hover:border-[#FFC21A]/60'
                    }`}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center font-mono text-xs font-bold px-2 py-0.5 rounded-lg bg-[#0A2540] text-[#FFC21A] dark:bg-[#071D33] dark:text-[#FFC21A] border border-[#1B456E]">
                          #{p.token}
                        </span>
                        <span className="text-xs font-bold text-[#0A2540] dark:text-white truncate">
                          {p.patientName}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8] font-mono">
                        {p.age}y / {p.gender?.[0]} • {p.uhid}
                      </div>
                      <div className="text-[10px] text-[#8A740C] dark:text-[#FFE08A] font-medium truncate">
                        {p.attendingDoctor}
                      </div>
                    </div>

                    <div className="shrink-0 flex flex-col items-end gap-1.5">
                      <Badge variant={p.reportsCount > 0 ? 'completed' : 'neutral'} size="xs">
                        {p.reportsCount > 0 ? `${p.reportsCount} Files` : 'No Scans'}
                      </Badge>
                      <ChevronRight className={`w-3.5 h-3.5 ${isSelected ? 'text-[#0A2540] dark:text-white' : 'text-[#94A3B8]'}`} />
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN: Active Patient Diagnostic Ingestion Studio (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          {/* Active Patient Hero Context */}
          <Card variant="dark" className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center justify-center font-mono font-bold text-base px-3 py-1.5 rounded-xl bg-[#0F355A] text-[#FFC21A] border border-[#1B456E]">
                #{activeEncounter.token}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base text-white">
                    {activeEncounter.patientName}
                  </span>
                  <span className="text-xs text-[#94A3B8] font-mono">
                    ({activeEncounter.age}y / {activeEncounter.gender})
                  </span>
                </div>
                <div className="text-xs text-[#CBD5E1] font-mono mt-0.5">
                  {activeEncounter.uhid} • Attending: {activeEncounter.attendingDoctor}
                </div>
              </div>
            </div>

            <Badge variant="brand" size="sm" className="font-mono">
              ACTIVE ENCOUNTER
            </Badge>
          </Card>

          {/* Diagnostic Modality Selector */}
          <Card variant="surface" className="p-5 space-y-4">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#0A2540] dark:text-white">
                1. Select Diagnostic Modality
              </h2>
              <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-0.5 font-mono">
                Classifying the scan configures the physician's interactive canvas viewer.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {MODALITIES.map((mod) => {
                const Icon = mod.icon;
                const isSelected = selectedModality === mod.id;
                return (
                  <button
                    key={mod.id}
                    type="button"
                    onClick={() => setSelectedModality(mod.id)}
                    className={`p-3.5 rounded-2xl text-left border transition-all ${
                      isSelected
                        ? 'border-[#FFC21A] bg-[#FAF6EC] dark:bg-[#0F355A] shadow-xs ring-1 ring-[#FFC21A]'
                        : 'border-[#EAE4D3] dark:border-[#1B456E] bg-white dark:bg-[#0A2540] hover:border-[#FFC21A]/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className={`p-2 rounded-xl ${isSelected ? 'bg-[#FFC21A] text-[#0A2540] font-bold' : 'bg-[#FAF6EC] dark:bg-[#071D33] text-[#64748B] dark:text-[#CBD5E1]'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-[#FFC21A] animate-pulse" />
                      )}
                    </div>
                    <div className="font-bold text-xs text-[#0A2540] dark:text-white">
                      {mod.label}
                    </div>
                    <div className="text-[10px] text-[#64748B] dark:text-[#94A3B8] mt-0.5 line-clamp-1">
                      {mod.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Upload Dropzone */}
          <Card variant="surface" className="p-5 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#0A2540] dark:text-white">
              2. Upload Media for #{activeEncounter.token}
            </h2>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                handleFilesChosen(e.dataTransfer.files);
              }}
              className={`p-8 rounded-3xl border-2 border-dashed text-center transition-all ${
                isDragOver
                  ? 'border-[#FFC21A] bg-[#FAF6EC] dark:bg-[#0F355A]'
                  : 'border-[#CBD5E1] dark:border-[#1B456E] bg-[#FAF6EC]/60 dark:bg-[#071D33]/60 hover:border-[#FFC21A]'
              }`}
            >
              <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-[#0A2540] text-[#FFC21A] flex items-center justify-center">
                <UploadCloud className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div className="text-xs font-bold text-[#0A2540] dark:text-white">
                Drag and drop DICOM / PDF files here, or{' '}
                <label className="text-[#8A740C] dark:text-[#FFC21A] underline cursor-pointer hover:opacity-80">
                  browse local disk
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFilesChosen(e.target.files)}
                  />
                </label>
              </div>
              <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8] font-mono mt-1">
                Supports .dcm, .pdf, .jpg, .png up to 100MB per study set
              </div>
            </div>

            {/* Upload Queue Stream */}
            {uploadQueue.length > 0 && (
              <div className="space-y-2 pt-2">
                <div className="text-xs font-bold text-[#0A2540] dark:text-white">
                  Ingestion Progress
                </div>
                {uploadQueue.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-[#FAF6EC] dark:bg-[#071D33] border border-[#EAE4D3] dark:border-[#1B456E] flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <FileUp className="w-4 h-4 text-[#8A740C] dark:text-[#FFC21A]" />
                      <div>
                        <div className="font-bold text-[#0A2540] dark:text-white">{item.name}</div>
                        <div className="text-[10px] text-[#64748B] font-mono">{item.size} • {item.modality}</div>
                      </div>
                    </div>
                    <div>
                      {item.status === 'complete' ? (
                        <Badge variant="completed" size="xs">Ingested</Badge>
                      ) : (
                        <Badge variant="brand" size="xs">Uploading...</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Existing Reports List */}
          <Card variant="surface" className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#0A2540] dark:text-white">
                Uploaded Records for #{activeEncounter.token} ({reports.length})
              </h2>
              <span className="text-[10px] font-mono text-[#64748B] dark:text-[#94A3B8]">
                Ready for Physician Review
              </span>
            </div>

            {reports.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#64748B] dark:text-[#94A3B8] border border-dashed border-[#CBD5E1] dark:border-[#1B456E] rounded-2xl">
                No diagnostic files currently linked to this visit. Upload files above.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {reports.map((rep) => (
                  <div
                    key={rep.report_id || rep.id}
                    className="p-3.5 rounded-2xl border border-[#EAE4D3] dark:border-[#1B456E] bg-white dark:bg-[#0A2540] flex items-center justify-between shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#0A2540] text-[#FFC21A] flex items-center justify-center font-bold">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#0A2540] dark:text-white">
                          {rep.file_name || rep.title || 'Diagnostic Report'}
                        </div>
                        <div className="text-[10px] text-[#64748B] dark:text-[#94A3B8] font-mono">
                          {rep.report_type || 'DICOM'} • {rep.upload_date || 'Today'}
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => navigate(`/doctor/viewer/${activeEncounter.visitId}`)}
                      icon={ExternalLink}
                    >
                      View
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
