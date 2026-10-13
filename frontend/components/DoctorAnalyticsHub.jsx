import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  Activity, 
  Sparkles, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  Zap, 
  ChevronRight, 
  Info,
  Maximize2,
  RefreshCw,
  Sliders,
  Dna,
  ArrowDownRight,
  ArrowUpRight,
  Play
} from 'lucide-react';

export default function DoctorAnalyticsHub() {
  // Active Analytical Stream: 'biomarker' | 'infusion' | 'hematology'
  const [activeStream, setActiveStream] = useState('biomarker');
  
  // Scrubber Hover Index (0 to n)
  const [hoverIndex, setHoverIndex] = useState(null);
  
  // AI Forecasting Simulation State
  const [isSimulating, setIsSimulating] = useState(false);
  const [pinnedPoint, setPinnedPoint] = useState(null);

  // Selected Genomic Segment in Donut Chart
  const [selectedGenomicIndex, setSelectedGenomicIndex] = useState(0);

  // Data Stream 1: Longitudinal Tumor Burden / Biomarker Response (CEA / CA 15-3)
  const biomarkerData = useMemo(() => [
    { label: 'Baseline', value: 52.4, target: 3.0, date: 'Oct 14', note: 'Pre-treatment diagnostic baseline', stage: 'Stage IIIA', reduction: '0%' },
    { label: 'Cycle 1',  value: 41.8, target: 3.0, date: 'Nov 04', note: 'AC-T Chemo Cycle 1 administered', stage: 'Early Response', reduction: '-20.2%' },
    { label: 'Cycle 2',  value: 30.5, target: 3.0, date: 'Nov 25', note: 'Dose-dense schedule confirmed', stage: 'Partial Regress', reduction: '-41.8%' },
    { label: 'Cycle 3',  value: 21.0, target: 3.0, date: 'Dec 16', note: 'Mid-treatment restaging PET-CT', stage: 'Significant Response', reduction: '-59.9%' },
    { label: 'Cycle 4',  value: 13.6, target: 3.0, date: 'Jan 06', note: 'Paclitaxel weekly sequence started', stage: 'Tumor Shrinkage', reduction: '-74.0%' },
    { label: 'Cycle 5',  value: 8.2,  target: 3.0, date: 'Jan 27', note: 'Minimal residual biomarker activity', stage: 'Near Complete', reduction: '-84.3%' },
    { label: 'Cycle 6',  value: 4.5,  target: 3.0, date: 'Feb 17', note: 'Final chemotherapy cycle complete', stage: 'Metabolic Remission', reduction: '-91.4%' },
    // Forecasted AI Point
    ...(isSimulating ? [
      { label: 'Cycle 7 (AI)', value: 2.7, target: 3.0, date: 'Mar 10', note: 'AI Projected: Normalization below 3.0', stage: 'Complete Remission', reduction: '-94.8%', isForecast: true }
    ] : [])
  ], [isSimulating]);

  // Data Stream 2: Daycare Infusion Hourly Volumetric Telemetry
  const infusionData = useMemo(() => [
    { label: '08:00', value: 45, target: 60, rate: '80 ml/h', date: 'Session Start', note: 'Pre-med antiemetics IV infusion' },
    { label: '09:00', value: 120, target: 140, rate: '125 ml/h', date: 'Active Phase', note: 'Pemetrexed primary bag loaded' },
    { label: '10:00', value: 235, target: 240, rate: '130 ml/h', date: 'Peak Flow', note: 'Carboplatin AUC 5 infusion steady' },
    { label: '11:00', value: 360, target: 360, rate: '125 ml/h', date: 'Mid Check', note: 'Vitals verified: BP 124/80, SpO2 99%' },
    { label: '12:00', value: 480, target: 480, rate: '120 ml/h', date: 'Post-Hydration', note: 'Normal saline 500ml post-flush' },
    { label: '13:00', value: 575, target: 600, rate: '95 ml/h', date: 'Tapering', note: 'Final line flush & vitals sign-off' }
  ], []);

  // Data Stream 3: Hematology ANC & Toxicity Reserve Index
  const hematologyData = useMemo(() => [
    { label: 'Wk 0', value: 4.8, target: 1.5, date: 'Pre-Chemo', note: 'Normal baseline bone marrow reserve', status: 'Optimal' },
    { label: 'Wk 2', value: 3.6, target: 1.5, date: 'Post-C1', note: 'Mild asymptomatic nadir', status: 'Safe' },
    { label: 'Wk 4', value: 2.2, target: 1.5, date: 'Post-C2', note: 'Acceptable count; proceed without delay', status: 'Monitored' },
    { label: 'Wk 6', value: 1.8, target: 1.5, date: 'Post-C3 Nadir', note: 'Filgrastim G-CSF 300mcg support given', status: 'G-CSF Assisted' },
    { label: 'Wk 8', value: 3.4, target: 1.5, date: 'Post-C4', note: 'Strong bone marrow reconstitution', status: 'Rebound' },
    { label: 'Wk 10', value: 4.1, target: 1.5, date: 'Post-C5', note: 'Robust hematopoiesis maintained', status: 'Optimal' }
  ], []);

  // Current Dataset based on Stream
  const currentData = activeStream === 'biomarker' ? biomarkerData : activeStream === 'infusion' ? infusionData : hematologyData;

  // Chart Coordinate Calculations
  const chartWidth = 560;
  const chartHeight = 175;
  const paddingX = 45;
  const paddingY = 25;

  const minVal = Math.min(...currentData.map(d => d.value), ...currentData.map(d => d.target || d.value)) * 0.85;
  const maxVal = Math.max(...currentData.map(d => d.value)) * 1.12;

  const getX = (index) => paddingX + (index / (currentData.length - 1)) * (chartWidth - paddingX * 2);
  const getY = (val) => chartHeight - paddingY - ((val - minVal) / (maxVal - minVal || 1)) * (chartHeight - paddingY * 2);

  // SVG Smooth Bezier Path Generator
  const pathD = useMemo(() => {
    if (currentData.length < 2) return '';
    return currentData.reduce((acc, point, i, arr) => {
      const x = getX(i);
      const y = getY(point.value);
      if (i === 0) return `M ${x} ${y}`;
      const prevX = getX(i - 1);
      const prevY = getY(arr[i - 1].value);
      const cp1x = prevX + (x - prevX) / 2;
      const cp1y = prevY;
      const cp2x = prevX + (x - prevX) / 2;
      const cp2y = y;
      return `${acc} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x} ${y}`;
    }, '');
  }, [currentData, minVal, maxVal]);

  // Area Fill Path
  const areaD = useMemo(() => {
    if (!pathD) return '';
    const lastX = getX(currentData.length - 1);
    const firstX = getX(0);
    const bottomY = chartHeight - paddingY;
    return `${pathD} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  }, [pathD, currentData]);

  // Target Benchmark Horizontal Dotted Line Y
  const targetY = getY(currentData[0]?.target || minVal);

  // Active Point under cursor (or last point by default)
  const activePoint = hoverIndex !== null ? currentData[hoverIndex] : pinnedPoint || currentData[currentData.length - 1];
  const activePointIndex = hoverIndex !== null ? hoverIndex : currentData.indexOf(activePoint);

  // Precision Genomic Distribution Data (Donut Chart)
  const genomicSegments = [
    { label: 'ER+/PR+ Luminal', pct: 55, count: 11, color: '#0284c7', therapy: 'Letrozole + CDK4/6i (Abemaciclib)', response: 'High Sensitivity' },
    { label: 'HER2 Amplified', pct: 20, count: 4, color: '#38bdf8', therapy: 'Trastuzumab + Pertuzumab IV', response: 'Rapid Regress' },
    { label: 'Triple Negative', pct: 15, count: 3, color: '#f59e0b', therapy: 'Pembrolizumab + Carboplatin', response: 'Immune Monitored' },
    { label: 'BRCA1/2 Mutant', pct: 10, count: 2, color: '#10b981', therapy: 'Olaparib PARP Inhibitor', response: 'Dna Repair Target' }
  ];

  return (
    <div className="doc-analytics-card doc-glass-shimmer anim-hover-lift" style={{ padding: '16px 18px', marginBottom: 12, flexShrink: 0, width: '100%', boxSizing: 'border-box' }}>
      
      {/* Top Header & Stream Mode Switchers */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="stat-squircle-badge" style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)', color: '#ffffff', boxShadow: '0 4px 14px rgba(56, 189, 248, 0.4)' }}>
            <TrendingUp size={18} strokeWidth={2.4} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h3 style={{ fontSize: 14, fontWeight: 900, color: '#0369a1', margin: 0, letterSpacing: '-0.02em' }}>
                Clinical Intelligence & Oncology Response Analytics
              </h3>
              <span className="brand-counter-pill" style={{ background: '#e0f2fe', color: '#0284c7', border: '1px solid #bae6fd', fontSize: 9.5, fontWeight: 800 }}>
                Live 60fps Telemetry
              </span>
            </div>
            <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0 0' }}>
              Interactive biomarker kinetics, daycare infusion throughput, and AI-modeled response curves
            </p>
          </div>
        </div>

        {/* Stream Switcher Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <button 
            className={`doc-metric-chip ${activeStream === 'biomarker' ? 'active' : ''}`}
            onClick={() => { setActiveStream('biomarker'); setHoverIndex(null); }}
          >
            <Sparkles size={12} />
            <span>Tumor Biomarkers</span>
          </button>
          <button 
            className={`doc-metric-chip ${activeStream === 'infusion' ? 'active' : ''}`}
            onClick={() => { setActiveStream('infusion'); setHoverIndex(null); }}
          >
            <Activity size={12} />
            <span>Infusion Flow</span>
          </button>
          <button 
            className={`doc-metric-chip ${activeStream === 'hematology' ? 'active' : ''}`}
            onClick={() => { setActiveStream('hematology'); setHoverIndex(null); }}
          >
            <ShieldCheck size={12} />
            <span>ANC Toxicity</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Interactive Curve Chart (Left) + Precision Genomic Profile (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.75fr) minmax(0, 1fr)', gap: 16, alignItems: 'stretch' }}>
        
        {/* LEFT STAGE: Interactive Area/Line Graph */}
        <div style={{ display: 'flex', flexDirection: 'column', background: '#f8fafc', borderRadius: 14, border: '1px solid #e0f2fe', padding: '12px 14px', position: 'relative' }}>
          
          {/* Chart Header Metrics Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div>
                <span style={{ fontSize: 10, color: '#64748b', fontWeight: 600, display: 'block' }}>
                  {activeStream === 'biomarker' ? 'CURRENT BURDEN (CEA)' : activeStream === 'infusion' ? 'DELIVERED VOLUME' : 'CURRENT ANC'}
                </span>
                <span style={{ fontSize: 18, fontWeight: 900, color: '#0369a1', letterSpacing: '-0.03em' }}>
                  {activePoint?.value} {activeStream === 'biomarker' ? 'ng/mL' : activeStream === 'infusion' ? 'mL' : 'k/µL'}
                </span>
              </div>
              {activePoint?.reduction && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: '#dcfce7', color: '#15803d', padding: '3px 8px', borderRadius: 999, fontSize: 10.5, fontWeight: 800 }}>
                  <ArrowDownRight size={13} />
                  <span>{activePoint.reduction}</span>
                </div>
              )}
            </div>

            {/* AI Simulate Button */}
            {activeStream === 'biomarker' && (
              <button 
                onClick={() => setIsSimulating(!isSimulating)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '4px 10px',
                  borderRadius: 8,
                  fontSize: 10.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: isSimulating ? '1.5px solid #0284c7' : '1px solid #bae6fd',
                  backgroundColor: isSimulating ? '#e0f2fe' : '#ffffff',
                  color: isSimulating ? '#0284c7' : '#0369a1',
                  transition: 'all 0.2s ease'
                }}
                title="Forecast Cycle 7 biomarker response using deep predictive kinetic models"
              >
                <Sparkles size={12} color="#0284c7" />
                <span>{isSimulating ? 'Simulation Active' : 'AI Forecast +1 Cycle'}</span>
              </button>
            )}
          </div>

          {/* SVG Canvas Area */}
          <div style={{ position: 'relative', width: '100%', height: chartHeight }}>
            <svg 
              viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
              style={{ width: '100%', height: '100%', overflow: 'visible' }}
              className="doc-chart-svg"
            >
              <defs>
                {/* Luminous Sky Gradient Area Fill */}
                <linearGradient id="docSkyAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.45" />
                  <stop offset="60%" stopColor="#bae6fd" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
                </linearGradient>

                {/* Stroke Gradient Line */}
                <linearGradient id="docSkyStrokeGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#0284c7" />
                  <stop offset="50%" stopColor="#0ea5e9" />
                  <stop offset="100%" stopColor="#38bdf8" />
                </linearGradient>
              </defs>

              {/* Grid Horizontal Guidelines */}
              {[0.25, 0.5, 0.75].map((pct, idx) => {
                const lineY = paddingY + pct * (chartHeight - paddingY * 2);
                return (
                  <line 
                    key={idx}
                    x1={paddingX} 
                    y1={lineY} 
                    x2={chartWidth - paddingX} 
                    y2={lineY} 
                    stroke="#e2e8f0" 
                    strokeDasharray="4 4" 
                    strokeWidth="1" 
                  />
                );
              })}

              {/* Normal Threshold Benchmark Line */}
              <line 
                x1={paddingX} 
                y1={targetY} 
                x2={chartWidth - paddingX} 
                y2={targetY} 
                stroke="#10b981" 
                strokeWidth="1.5" 
                strokeDasharray="6 3" 
                opacity="0.85"
              />
              <text 
                x={chartWidth - paddingX - 4} 
                y={targetY - 5} 
                fill="#059669" 
                fontSize="9" 
                fontWeight="800" 
                textAnchor="end"
              >
                Safe Threshold: {currentData[0]?.target}
              </text>

              {/* Area Gradient Fill */}
              <path 
                d={areaD} 
                fill="url(#docSkyAreaGradient)" 
                className="doc-chart-area"
              />

              {/* Main Smooth Line Path */}
              <path 
                d={pathD} 
                fill="none" 
                stroke="url(#docSkyStrokeGradient)" 
                strokeWidth="3.2" 
                strokeLinecap="round" 
                className="doc-chart-line"
              />

              {/* Active Scrubber Vertical Guideline */}
              {hoverIndex !== null && (
                <line 
                  x1={getX(hoverIndex)} 
                  y1={paddingY} 
                  x2={getX(hoverIndex)} 
                  y2={chartHeight - paddingY} 
                  stroke="#0284c7" 
                  strokeWidth="1.5" 
                  strokeDasharray="2 3"
                />
              )}

              {/* Coordinate Nodes */}
              {currentData.map((pt, i) => {
                const cx = getX(i);
                const cy = getY(pt.value);
                const isSelected = activePointIndex === i;

                return (
                  <g key={i}>
                    {/* Pulsing ring on active node */}
                    {isSelected && (
                      <circle 
                        cx={cx} 
                        cy={cy} 
                        r="12" 
                        fill="rgba(56, 189, 248, 0.25)" 
                        className="doc-pulse-marker"
                      />
                    )}
                    <circle 
                      cx={cx} 
                      cy={cy} 
                      r={isSelected ? 6 : 4} 
                      fill={pt.isForecast ? '#38bdf8' : '#ffffff'} 
                      stroke={pt.isForecast ? '#0284c7' : '#0284c7'} 
                      strokeWidth={isSelected ? 3 : 2}
                      className="doc-chart-node"
                      onMouseEnter={() => setHoverIndex(i)}
                      onClick={() => setPinnedPoint(pt)}
                    />
                    {/* X-Axis Tick Label */}
                    <text 
                      x={cx} 
                      y={chartHeight - 6} 
                      fill={isSelected ? '#0284c7' : '#64748b'} 
                      fontSize="9.5" 
                      fontWeight={isSelected ? '800' : '600'} 
                      textAnchor="middle"
                    >
                      {pt.label}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Floating Glass Tooltip */}
            {activePoint && (
              <div 
                className="doc-chart-tooltip"
                style={{
                  position: 'absolute',
                  top: 10,
                  right: 12,
                  padding: '8px 12px',
                  maxWidth: 240,
                  pointerEvents: 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 2 }}>
                  <span style={{ fontSize: 11, fontWeight: 900, color: '#0369a1' }}>
                    {activePoint.label} • {activePoint.date}
                  </span>
                  <span style={{ fontSize: 10, fontWeight: 800, color: '#0284c7', background: '#e0f2fe', padding: '1px 6px', borderRadius: 4 }}>
                    {activePoint.stage || activePoint.status || 'Verified'}
                  </span>
                </div>
                <div style={{ fontSize: 10.5, color: '#334155', fontWeight: 500, lineHeight: 1.35 }}>
                  {activePoint.note}
                </div>
              </div>
            )}
          </div>

          {/* Interactive Scrub Guide Footer */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6, fontSize: 10, color: '#64748b' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Info size={11} color="#0284c7" /> Hover over any node to scrub trajectory and inspect clinical milestones
            </span>
            <span style={{ fontWeight: 700, color: '#0284c7' }}>
              6-Cycle Kinetic Trend • R² = 0.984
            </span>
          </div>
        </div>

        {/* RIGHT STAGE: Precision Genomic Architecture & Live Donut Arc */}
        <div style={{ display: 'flex', flexDirection: 'column', background: '#f8fafc', borderRadius: 14, border: '1px solid #e0f2fe', padding: '12px 14px', justifyContent: 'space-between' }}>
          
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Dna size={15} color="#0284c7" />
                <span style={{ fontSize: 12, fontWeight: 800, color: '#0369a1' }}>
                  Genomic Cohort & Biomarkers
                </span>
              </div>
              <span className="brand-counter-pill" style={{ fontSize: 9.5, background: '#e0f2fe', color: '#0284c7', border: '1px solid #bae6fd' }}>
                4 Clusters
              </span>
            </div>

            {/* Radial Donut & Metric Center */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '8px 0 10px 0' }}>
              <div style={{ position: 'relative', width: 92, height: 92, flexShrink: 0 }}>
                <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                  {/* Background Track */}
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#e2e8f0" strokeWidth="12" />
                  
                  {/* Interactive Arcs */}
                  {(() => {
                    const circumference = 2 * Math.PI * 38;
                    let accumulatedPct = 0;
                    return genomicSegments.map((seg, i) => {
                      const strokeDash = (seg.pct / 100) * circumference;
                      const strokeOffset = -((accumulatedPct / 100) * circumference);
                      accumulatedPct += seg.pct;
                      const isSegSelected = selectedGenomicIndex === i;

                      return (
                        <circle
                          key={i}
                          cx="50"
                          cy="50"
                          r="38"
                          fill="none"
                          stroke={seg.color}
                          strokeWidth={isSegSelected ? 14 : 12}
                          strokeDasharray={`${strokeDash} ${circumference}`}
                          strokeDashoffset={strokeOffset}
                          style={{ 
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            opacity: isSegSelected ? 1 : 0.65
                          }}
                          onMouseEnter={() => setSelectedGenomicIndex(i)}
                        />
                      );
                    });
                  })()}
                </svg>

                {/* Center Percent Label */}
                <div style={{ 
                  position: 'absolute', 
                  top: 0, left: 0, right: 0, bottom: 0, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  pointerEvents: 'none'
                }}>
                  <span style={{ fontSize: 15, fontWeight: 900, color: genomicSegments[selectedGenomicIndex].color, lineHeight: 1 }}>
                    {genomicSegments[selectedGenomicIndex].pct}%
                  </span>
                  <span style={{ fontSize: 8.5, color: '#64748b', fontWeight: 700 }}>
                    SHARE
                  </span>
                </div>
              </div>

              {/* Selected Genomic Segment Details */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 11.5, fontWeight: 900, color: genomicSegments[selectedGenomicIndex].color, display: 'block' }}>
                  {genomicSegments[selectedGenomicIndex].label}
                </span>
                <span style={{ fontSize: 10, color: '#334155', fontWeight: 600, display: 'block', marginTop: 2 }}>
                  {genomicSegments[selectedGenomicIndex].therapy}
                </span>
                <span style={{ display: 'inline-block', marginTop: 4, background: '#ffffff', border: `1px solid ${genomicSegments[selectedGenomicIndex].color}55`, padding: '2px 6px', borderRadius: 6, fontSize: 9.5, fontWeight: 800, color: genomicSegments[selectedGenomicIndex].color }}>
                  {genomicSegments[selectedGenomicIndex].response}
                </span>
              </div>
            </div>

            {/* Genomic Clusters List Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {genomicSegments.map((seg, idx) => (
                <div 
                  key={idx}
                  onMouseEnter={() => setSelectedGenomicIndex(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '3px 8px',
                    borderRadius: 6,
                    backgroundColor: selectedGenomicIndex === idx ? '#ffffff' : 'transparent',
                    border: `1px solid ${selectedGenomicIndex === idx ? seg.color : 'transparent'}`,
                    cursor: 'pointer',
                    transition: 'all 0.18s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: seg.color }} />
                    <span style={{ fontSize: 10.5, fontWeight: selectedGenomicIndex === idx ? 800 : 600, color: '#0f172a' }}>
                      {seg.label}
                    </span>
                  </div>
                  <span style={{ fontSize: 10.5, fontWeight: 800, color: seg.color }}>
                    {seg.pct}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Live ECG Rhythm Waveform Widget at bottom */}
          <div style={{ 
            marginTop: 8, 
            padding: '6px 10px', 
            borderRadius: 8, 
            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', 
            border: '1px solid #bae6fd',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="live-dot" style={{ backgroundColor: '#0284c7' }} />
              <span style={{ fontSize: 10, fontWeight: 800, color: '#0369a1' }}>
                Cardiac Telemetry: 74 BPM
              </span>
            </div>
            
            {/* Animated ECG Pulse Vector */}
            <svg width="70" height="16" viewBox="0 0 70 16">
              <path 
                d="M 0 8 L 15 8 L 20 2 L 25 14 L 30 8 L 35 8 L 40 4 L 45 12 L 50 8 L 70 8" 
                fill="none" 
                stroke="#0284c7" 
                strokeWidth="1.8" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="doc-ecg-svg"
              />
            </svg>
          </div>

        </div>

      </div>
    </div>
  );
}
