import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HardDrive,
  Activity,
  FileText,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Sun,
  Contrast,
  Sliders,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Maximize2,
  Stethoscope,
  Download,
  CheckCircle2
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { api } from '../../services/api';

export default function DiagnosticViewerPage() {
  const { visitId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('DICOM'); // DICOM, ECG, LAB_PDF
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // DICOM canvas controls state
  const [currentSlice, setCurrentSlice] = useState(42);
  const [totalSlices] = useState(148);
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [windowLevel, setWindowLevel] = useState(50);
  const [windowWidth, setWindowWidth] = useState(350);

  // ECG Canvas ref
  const ecgCanvasRef = useRef(null);

  useEffect(() => {
    loadReports();
  }, [visitId]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const data = await api.getReports(visitId || 102);
      setReports(data?.reports || []);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  };

  // Draw 12-lead ECG waveform onto canvas
  useEffect(() => {
    if (activeTab === 'ECG' && ecgCanvasRef.current) {
      const canvas = ecgCanvasRef.current;
      const ctx = canvas.getContext('2d');
      const width = canvas.width;
      const height = canvas.height;

      // Draw medical pink grid
      ctx.fillStyle = '#FFF5F5';
      ctx.fillRect(0, 0, width, height);

      // Minor grid 1mm (approx 5px)
      ctx.strokeStyle = '#FED7D7';
      ctx.lineWidth = 0.5;
      for (let x = 0; x < width; x += 10) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 10) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Major grid 5mm (approx 25px)
      ctx.strokeStyle = '#FEB2B2';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw ECG Lead Waves (Leads I, II, V1, V5)
      const leads = [
        { name: 'Lead II (Rhythm)', yBase: 80, amp: 35 },
        { name: 'Lead V1', yBase: 190, amp: 25 },
        { name: 'Lead V5', yBase: 300, amp: 40 },
      ];

      leads.forEach((lead) => {
        // Label
        ctx.fillStyle = '#9B2C2C';
        ctx.font = 'bold 11px monospace';
        ctx.fillText(lead.name, 15, lead.yBase - 35);

        ctx.strokeStyle = '#1A202C';
        ctx.lineWidth = 1.5;
        ctx.beginPath();

        let prevX = 0;
        let prevY = lead.yBase;
        ctx.moveTo(prevX, prevY);

        for (let x = 0; x < width; x += 2) {
          const t = (x % 140) / 140; // 1 cycle every 140px (~70bpm)
          let dy = 0;

          // P wave
          if (t > 0.1 && t < 0.2) {
            dy = -Math.sin(((t - 0.1) / 0.1) * Math.PI) * (lead.amp * 0.2);
          }
          // Q wave
          else if (t > 0.28 && t < 0.31) {
            dy = (lead.amp * 0.15);
          }
          // R wave spike
          else if (t >= 0.31 && t <= 0.36) {
            dy = -Math.sin(((t - 0.31) / 0.05) * Math.PI) * lead.amp;
          }
          // S wave dip
          else if (t > 0.36 && t < 0.41) {
            dy = (lead.amp * 0.25);
          }
          // T wave
          else if (t > 0.55 && t < 0.75) {
            dy = -Math.sin(((t - 0.55) / 0.2) * Math.PI) * (lead.amp * 0.35);
          }

          const y = lead.yBase + dy;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      });
    }
  }, [activeTab]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-navy-100 dark:border-navy-800 pb-5">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/doctor/dashboard')}
            className="p-2"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-ochre-600 dark:text-ochre-400">
                P-DOC-03 • Diagnostic Workspace
              </span>
              <Badge variant="navy" size="xs">High-Res Imaging & Scans</Badge>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-navy-900 dark:text-white">
              Diagnostic Media & Medical Visualizer
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate(`/doctor/consultation/${visitId || 102}`)}
            className="flex items-center gap-2 font-bold"
          >
            <Stethoscope className="w-4 h-4 text-navy-950" />
            Resume Consultation
          </Button>
        </div>
      </div>

      {/* Patient Banner */}
      <Card className="p-3.5 bg-navy-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-3 font-mono text-xs">
        <div className="flex items-center gap-3">
          <span className="px-2 py-0.5 rounded bg-canary-400 text-navy-950 font-bold">
            Q-102
          </span>
          <span className="font-bold text-white font-sans text-sm">
            Ramesh Patel (UHID-2026-00002)
          </span>
          <span className="text-navy-400">50Y / M</span>
        </div>
        <div className="flex items-center gap-4 text-navy-300">
          <span>Dr. Vikram Kulkarni</span>
          <span>•</span>
          <span className="text-canary-300">Study Date: 2026-10-06</span>
        </div>
      </Card>

      {/* Modality Selector Tabs */}
      <div className="flex items-center gap-2 border-b border-navy-100 dark:border-navy-800 pb-2">
        {[
          { id: 'DICOM', label: 'Brain MRI Axial T2 (DICOM)', icon: HardDrive, tag: '148 Slices' },
          { id: 'ECG', label: '12-Lead Resting ECG Strip', icon: Activity, tag: '500 Hz' },
          { id: 'LAB_PDF', label: 'Comprehensive Blood Panel (Lab PDF)', icon: FileText, tag: 'CBC & Lipid' },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-navy-900 text-white shadow-sm dark:bg-navy-800 dark:border-b-2 dark:border-canary-400'
                  : 'bg-white dark:bg-navy-900 text-navy-600 dark:text-navy-300 hover:bg-navy-50 dark:hover:bg-navy-800'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-canary-400' : 'text-ochre-500'}`} />
              <span>{tab.label}</span>
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-navy-800 text-navy-300">
                {tab.tag}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Visualizer Stage */}
      {activeTab === 'DICOM' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* DICOM Canvas (9 cols) */}
          <div className="lg:col-span-9 space-y-3">
            <Card className="p-0 bg-black text-white overflow-hidden rounded-2xl border border-navy-800 relative shadow-2xl">
              {/* Overlay DICOM Header metadata */}
              <div className="absolute top-3 left-3 z-10 font-mono text-[11px] text-emerald-400 bg-black/60 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                <div>PATIENT: RAMESH PATEL</div>
                <div>SERIES: T2 AXIAL BRAIN</div>
                <div>SLICE: {currentSlice} / {totalSlices}</div>
                <div>FOV: 240mm • THICKNESS: 3.0mm</div>
              </div>

              <div className="absolute top-3 right-3 z-10 font-mono text-[11px] text-canary-300 bg-black/60 px-3 py-1.5 rounded-lg border border-canary-400/20 text-right">
                <div>ZOOM: {(zoomLevel * 100).toFixed(0)}%</div>
                <div>WL: {windowLevel} • WW: {windowWidth}</div>
                <div>OPD PACS ARCHIVE #8821</div>
              </div>

              {/* Simulated High-Res Anatomical Brain MRI Canvas */}
              <div className="w-full h-[520px] flex items-center justify-center relative bg-gradient-to-b from-[#080808] to-[#121212] overflow-hidden select-none">
                <div
                  style={{
                    transform: `scale(${zoomLevel})`,
                    filter: `contrast(${1 + (windowWidth - 350) / 400}) brightness(${1 + (windowLevel - 50) / 100})`,
                    transition: 'filter 0.1s ease',
                  }}
                  className="w-80 h-80 rounded-full relative border border-white/20 bg-gradient-to-br from-[#2a2a2a] via-[#111111] to-[#222222] shadow-[0_0_80px_rgba(255,255,255,0.08)] flex items-center justify-center"
                >
                  {/* Anatomical Brain Ventricles and Sulci simulation */}
                  <div className="w-64 h-72 rounded-[45%] border-2 border-dashed border-white/30 flex items-center justify-center relative">
                    {/* Left/Right Hemispheres */}
                    <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white/25 -translate-x-1/2" />
                    
                    {/* Lateral Ventricles */}
                    <div className="w-20 h-28 rounded-full border border-white/40 flex items-center justify-center">
                      <div className="w-8 h-12 rounded-full bg-white/30" />
                    </div>

                    {/* Slice depth indicators */}
                    <div className="absolute bottom-4 font-mono text-[10px] text-white/50">
                      Axial Slice Z={currentSlice}mm
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Slice Scrub Toolbar */}
              <div className="p-3 bg-navy-950 border-t border-navy-800 flex items-center justify-between gap-4 font-mono text-xs">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => setCurrentSlice((s) => Math.max(1, s - 1))}
                    className="text-white hover:bg-navy-800"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-canary-400 font-bold">
                    {currentSlice} / {totalSlices}
                  </span>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => setCurrentSlice((s) => Math.min(totalSlices, s + 1))}
                    className="text-white hover:bg-navy-800"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>

                <input
                  type="range"
                  min="1"
                  max={totalSlices}
                  value={currentSlice}
                  onChange={(e) => setCurrentSlice(Number(e.target.value))}
                  className="flex-1 accent-canary-400 cursor-pointer"
                />

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => setZoomLevel((z) => Math.min(2.0, z + 0.1))}
                    className="text-white hover:bg-navy-800"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.1))}
                    className="text-white hover:bg-navy-800"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => {
                      setZoomLevel(1.0);
                      setWindowLevel(50);
                      setWindowWidth(350);
                    }}
                    className="text-white hover:bg-navy-800"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Radiologic Controls Panel (3 cols) */}
          <div className="lg:col-span-3 space-y-4">
            <Card className="p-4 space-y-4">
              <h3 className="text-xs font-bold text-navy-900 dark:text-white uppercase tracking-wider">
                Windowing & Level Presets
              </h3>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs font-mono text-navy-500 mb-1">
                    <span>Window Level (Brightness)</span>
                    <span>{windowLevel}</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="90"
                    value={windowLevel}
                    onChange={(e) => setWindowLevel(Number(e.target.value))}
                    className="w-full accent-ochre-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-mono text-navy-500 mb-1">
                    <span>Window Width (Contrast)</span>
                    <span>{windowWidth}</span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="600"
                    value={windowWidth}
                    onChange={(e) => setWindowWidth(Number(e.target.value))}
                    className="w-full accent-ochre-500"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-navy-100 dark:border-navy-800 space-y-2">
                <span className="text-[11px] font-semibold text-navy-400">Radiology Presets</span>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => {
                      setWindowLevel(45);
                      setWindowWidth(320);
                    }}
                    className="text-[11px]"
                  >
                    Brain Soft
                  </Button>
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => {
                      setWindowLevel(70);
                      setWindowWidth(550);
                    }}
                    className="text-[11px]"
                  >
                    Bone Detail
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-navy-50 dark:bg-navy-900/60 border border-navy-100 dark:border-navy-800 text-xs space-y-2">
              <span className="font-bold text-navy-900 dark:text-white">Physician Impression</span>
              <p className="text-navy-600 dark:text-navy-300 text-[11px] leading-relaxed">
                No acute intracranial hemorrhage, midline shift, or mass effect detected in current T2 axial series. Symmetrical ventricular caliber.
              </p>
              <Badge variant="emerald" size="xs">VERIFIED NORMAL</Badge>
            </Card>
          </div>
        </div>
      )}

      {/* 12-Lead ECG Visualizer Stage */}
      {activeTab === 'ECG' && (
        <Card className="p-4 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-navy-100 dark:border-navy-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-navy-900 dark:text-white">
                12-Lead Electrocardiogram Diagnostic Trace
              </h3>
              <p className="text-xs text-navy-500">
                Paper Speed: 25 mm/s • Voltage: 10 mm/mV • Heart Rate: 74 bpm Sinus Rhythm
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="emerald" size="sm">REGULAR SINUS RHYTHM</Badge>
              <Badge variant="navy" size="sm" className="font-mono">PR: 148ms • QRS: 88ms • QTc: 412ms</Badge>
            </div>
          </div>

          <div className="overflow-x-auto border border-red-200 rounded-xl shadow-inner bg-[#FFF5F5]">
            <canvas
              ref={ecgCanvasRef}
              width={960}
              height={380}
              className="w-full min-w-[750px] block"
            />
          </div>

          <div className="p-3 rounded-xl bg-navy-50 dark:bg-navy-900 border border-navy-100 dark:border-navy-800 text-xs flex items-center justify-between">
            <span className="text-navy-600 dark:text-navy-300">
              Automated Analysis: Normal axis (62°). No pathological Q waves or ST-T ischemic changes identified.
            </span>
            <Button variant="outline" size="xs" className="flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5" /> Export PDF
            </Button>
          </div>
        </Card>
      )}

      {/* Lab Blood Report PDF Stage */}
      {activeTab === 'LAB_PDF' && (
        <Card className="p-5 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-navy-100 dark:border-navy-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-navy-900 dark:text-white">
                Comprehensive Metabolic & Lipid Panel
              </h3>
              <p className="text-xs text-navy-500">
                Processed by Metro Diagnostic Pathology Labs • Sample Collected: 2026-10-05 08:30 AM
              </p>
            </div>
            <Badge variant="emerald" size="xs">DIGITALLY CERTIFIED</Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-navy-200 dark:border-navy-700 bg-navy-50 dark:bg-navy-800 text-navy-600 dark:text-navy-300 font-mono">
                  <th className="py-2.5 px-4">Test Parameter</th>
                  <th className="py-2.5 px-4">Observed Value</th>
                  <th className="py-2.5 px-4">Standard Biological Range</th>
                  <th className="py-2.5 px-4">Units</th>
                  <th className="py-2.5 px-4">Status Flag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-100 dark:divide-navy-800 font-mono">
                <tr>
                  <td className="py-2.5 px-4 font-sans font-semibold text-navy-900 dark:text-white">Hemoglobin (Hb)</td>
                  <td className="py-2.5 px-4 font-bold text-navy-900 dark:text-white">14.6</td>
                  <td className="py-2.5 px-4 text-navy-500">13.0 - 17.0</td>
                  <td className="py-2.5 px-4 text-navy-500">g/dL</td>
                  <td className="py-2.5 px-4"><Badge variant="emerald" size="xs">Normal</Badge></td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-sans font-semibold text-navy-900 dark:text-white">Fasting Blood Glucose</td>
                  <td className="py-2.5 px-4 font-bold text-amber-600 dark:text-amber-400">108</td>
                  <td className="py-2.5 px-4 text-navy-500">70 - 99</td>
                  <td className="py-2.5 px-4 text-navy-500">mg/dL</td>
                  <td className="py-2.5 px-4"><Badge variant="amber" size="xs">Impaired Fasting</Badge></td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-sans font-semibold text-navy-900 dark:text-white">Serum Creatinine</td>
                  <td className="py-2.5 px-4 font-bold text-navy-900 dark:text-white">0.92</td>
                  <td className="py-2.5 px-4 text-navy-500">0.70 - 1.20</td>
                  <td className="py-2.5 px-4 text-navy-500">mg/dL</td>
                  <td className="py-2.5 px-4"><Badge variant="emerald" size="xs">Normal</Badge></td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-sans font-semibold text-navy-900 dark:text-white">Total Cholesterol</td>
                  <td className="py-2.5 px-4 font-bold text-ochre-600 dark:text-ochre-400">208</td>
                  <td className="py-2.5 px-4 text-navy-500">&lt; 200</td>
                  <td className="py-2.5 px-4 text-navy-500">mg/dL</td>
                  <td className="py-2.5 px-4"><Badge variant="ochre" size="xs">Borderline High</Badge></td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-sans font-semibold text-navy-900 dark:text-white">Serum Potassium</td>
                  <td className="py-2.5 px-4 font-bold text-navy-900 dark:text-white">4.3</td>
                  <td className="py-2.5 px-4 text-navy-500">3.5 - 5.1</td>
                  <td className="py-2.5 px-4 text-navy-500">mEq/L</td>
                  <td className="py-2.5 px-4"><Badge variant="emerald" size="xs">Normal</Badge></td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
