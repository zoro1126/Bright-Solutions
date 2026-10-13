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
  // Active Analytical Stream: 'glycemic' | 'infusion' | 'renal'
  const [activeStream, setActiveStream] = useState('glycemic');
  
  // Scrubber Hover Index (0 to n)
  const [hoverIndex, setHoverIndex] = useState(null);
  
  // AI Forecasting Simulation State
  const [isSimulating, setIsSimulating] = useState(false);
  const [pinnedPoint, setPinnedPoint] = useState(null);

  // Selected Department Segment in Donut Chart
  const [selectedCaseIndex, setSelectedCaseIndex] = useState(0);

  // Data Stream 1: Longitudinal Glycemic & Metabolic Control (HbA1c Kinetics %)
  const glycemicData = useMemo(() => [
    { label: 'Baseline', value: 9.8, target: 6.5, date: 'Oct 14', note: 'Uncontrolled Type 2 Diabetes; HbA1c baseline 9.8%', stage: 'Severe Hyperglycemia', reduction: '0%' },
    { label: 'Month 1',  value: 8.9, target: 6.5, date: 'Nov 14', note: 'Initiated Metformin 1000mg + Dietary counseling', stage: 'Early Glycemic Drop', reduction: '-9.2%' },
    { label: 'Month 2',  value: 8.1, target: 6.5, date: 'Dec 14', note: 'Added Empagliflozin 10mg morning dose', stage: 'Dual Oral Therapy', reduction: '-17.3%' },
    { label: 'Month 3',  value: 7.4, target: 6.5, date: 'Jan 14', note: 'Fasting glucose normalized to 110 mg/dL', stage: 'Significant Progress', reduction: '-24.5%' },
    { label: 'Month 4',  value: 6.9, target: 6.5, date: 'Feb 14', note: 'Excellent glycemic stability; no hypoglycemia', stage: 'Near Target', reduction: '-29.6%' },
    { label: 'Month 5',  value: 6.6, target: 6.5, date: 'Mar 14', note: 'Weight reduction 3.5kg; blood pressure 122/78', stage: 'Target Achieved', reduction: '-32.7%' },
    { label: 'Month 6',  value: 6.4, target: 6.5, date: 'Apr 14', note: 'Optimal glycemic control maintained below ADA threshold', stage: 'Clinical Remission', reduction: '-34.7%' },
    // Forecasted AI Point
    ...(isSimulating ? [
      { label: 'Month 7 (AI)', value: 6.2, target: 6.5, date: 'May 14', note: 'AI Projected: Sustained HbA1c plateau at 6.2%', stage: 'Long-term Stability', reduction: '-36.7%', isForecast: true }
    ] : [])
  ], [isSimulating]);

  // Data Stream 2: Daycare Observation Ward Hourly Volumetric Fluid Flow
  const infusionData = useMemo(() => [
    { label: '08:00', value: 50, target: 75, rate: '75 ml/h', date: 'Session Start', note: 'Pre-hydration Normal Saline 500mL started' },
    { label: '09:00', value: 125, target: 150, rate: '100 ml/h', date: 'Active Phase', note: 'IV Antibiotic Ceftriaxone 1g infusion' },
    { label: '10:00', value: 240, target: 250, rate: '120 ml/h', date: 'Peak Flow', note: 'Maintenance electrolyte Ringers Lactate' },
    { label: '11:00', value: 360, target: 360, rate: '120 ml/h', date: 'Mid Check', note: 'Vitals stable: BP 124/80, SpO2 99%, Pulse 72' },
    { label: '12:00', value: 475, target: 480, rate: '115 ml/h', date: 'Observation', note: 'IV Pantoprazole + Fluid bolus nearing end' },
    { label: '13:00', value: 580, target: 600, rate: '90 ml/h', date: 'Completion', note: 'Line flush complete, vitals clear for discharge' }
  ], []);

  // Data Stream 3: Renal Reserve & eGFR Recovery Index
  const renalData = useMemo(() => [
    { label: 'Day 1', value: 54, target: 60, date: 'Admission', note: 'Mild acute kidney injury secondary to dehydration', status: 'Impaired (Stage 3a)' },
    { label: 'Day 2', value: 58, target: 60, date: 'Post-Fluids', note: 'IV rehydration initiated, serum creatinine 1.4 mg/dL', status: 'Improving' },
    { label: 'Day 3', value: 64, target: 60, date: 'Hydrated', note: 'eGFR normalized above safe boundary > 60 mL/min', status: 'Normal Reserve' },
    { label: 'Day 5', value: 72, target: 60, date: 'Therapy Mid', note: 'Serum potassium 4.2 mEq/L, excellent clearance', status: 'Optimal' },
    { label: 'Day 7', value: 81, target: 60, date: 'Pre-Discharge', note: 'Stable renal hemodynamics, creatinine 0.9 mg/dL', status: 'Fully Recovered' },
    { label: 'Day 14', value: 88, target: 60, date: 'Follow-up', note: 'Renal function completely restored to baseline', status: 'Excellent' }
  ], []);

  // Current Dataset based on Stream
  const currentData = activeStream === 'glycemic' ? glycemicData : activeStream === 'infusion' ? infusionData : renalData;

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

  // Multispeciality Patient Case Distribution (Donut Chart)
  const caseSegments = [
    { label: 'Cardiology & Vascular', pct: 40, count: 16, color: '#1e3a8a', therapy: 'ACEi / ARB + Statin Regimen', response: 'Target BP Achieved' },
    { label: 'Diabetology & Endocrine', pct: 30, count: 12, color: '#2563eb', therapy: 'Metformin + SGLT2i Protocol', response: 'HbA1c Optimized' },
    { label: 'Pulmonology & Respiratory', pct: 18, count: 7, color: '#3b82f6', therapy: 'ICS-LABA Inhaler Therapy', response: 'FEV1 Restored' },
    { label: 'General & Lap Surgery', pct: 12, count: 5, color: '#10b981', therapy: 'Post-Op Observation & Care', response: 'Recovery Track' }
  ];

  return (
    <div className="doc-analytics-card doc-glass-shimmer anim-hover-lift" style={{ padding: '16px 18px', marginBottom: 12, flexShrink: 0, width: '100%', boxSizing: 'border-box' }}>
      
      {/* Top Header & Stream Mode Switchers */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="stat-squircle-badge" style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)', color: '#ffffff', boxShadow: '0 4px 14px rgba(30, 58, 138, 0.35)' }}>
            <TrendingUp size={18} strokeWidth={2.4} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h3 style={{ fontSize: 14, fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                Clinical Intelligence & Patient Recovery Analytics
              </h3>
              <span className="brand-counter-pill" style={{ background: '#CAF0F8', color: '#0077B6', border: '1px solid #90E0EF', fontSize: 9.5, fontWeight: 800 }}>
                Live Telemetry
              </span>
            </div>
            <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0 0' }}>
              Interactive glycemic kinetics, observation fluid throughput, and AI-modeled recovery curves
            </p>
          </div>
        </div>

        {/* Stream Switcher Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <button 
            className={`doc-metric-chip ${activeStream === 'glycemic' ? 'active' : ''}`}
            onClick={() => { setActiveStream('glycemic'); setHoverIndex(null); }}
          >
            <Sparkles size={12} />
            <span>Glycemic Kinetics</span>
          </button>
          <button 
            className={`doc-metric-chip ${activeStream === 'infusion' ? 'active' : ''}`}
            onClick={() => { setActiveStream('infusion'); setHoverIndex(null); }}
          >
            <Activity size={12} />
            <span>Infusion Flow</span>
          </button>
          <button 
            className={`doc-metric-chip ${activeStream === 'renal' ? 'active' : ''}`}
            onClick={() => { setActiveStream('renal'); setHoverIndex(null); }}
          >
            <ShieldCheck size={12} />
            <span>Renal Reserve</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Interactive Curve Chart (Left) + Multispeciality Profile (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.75fr) minmax(0, 1fr)', gap: 16, alignItems: 'stretch' }}>
        
        {/* LEFT STAGE: Interactive Area/Line Graph */}
        <div style={{ display: 'flex', flexDirection: 'column', background: '#f5fbfe', borderRadius: 14, border: '1px solid #bfe7f5', padding: '12px 14px', position: 'relative' }}>
          
          {/* Chart Header Metrics Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div>
                <span style={{ fontSize: 10, color: '#64748b', fontWeight: 600, display: 'block' }}>
                  {activeStream === 'glycemic' ? 'CURRENT HbA1c' : activeStream === 'infusion' ? 'DELIVERED VOLUME' : 'CURRENT eGFR'}
                </span>
                <span style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em' }}>
                  {activePoint?.value} {activeStream === 'glycemic' ? '%' : activeStream === 'infusion' ? 'mL' : 'mL/min'}
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
            {activeStream === 'glycemic' && (
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
                  border: isSimulating ? '1.5px solid #0077B6' : '1px solid #90E0EF',
                  backgroundColor: isSimulating ? '#CAF0F8' : '#ffffff',
                  color: '#0077B6',
                  transition: 'all 0.2s ease'
                }}
                title="Forecast Month 7 glycemic response using predictive metabolic models"
              >
                <Sparkles size={12} color="#0077B6" />
                <span>{isSimulating ? 'Simulation Active' : 'AI Forecast +1 Month'}</span>
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
                {/* Luminous Area Fill matching Admin Palette */}
                <linearGradient id="docSkyAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0077B6" stopOpacity="0.28" />
                  <stop offset="60%" stopColor="#90E0EF" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
                </linearGradient>

                {/* Stroke Gradient Line matching Admin Palette */}
                <linearGradient id="docSkyStrokeGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#0f172a" />
                  <stop offset="50%" stopColor="#0077B6" />
                  <stop offset="100%" stopColor="#00B4D8" />
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
                  stroke="#0077B6" 
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
                        fill="rgba(0, 119, 182, 0.22)" 
                        className="doc-pulse-marker"
                      />
                    )}
                    <circle 
                      cx={cx} 
                      cy={cy} 
                      r={isSelected ? 6 : 4} 
                      fill={pt.isForecast ? '#00B4D8' : '#ffffff'} 
                      stroke={pt.isForecast ? '#0077B6' : '#0077B6'} 
                      strokeWidth={isSelected ? 3 : 2}
                      className="doc-chart-node"
                      onMouseEnter={() => setHoverIndex(i)}
                      onClick={() => setPinnedPoint(pt)}
                    />
                    {/* X-Axis Tick Label */}
                    <text 
                      x={cx} 
                      y={chartHeight - 6} 
                      fill={isSelected ? '#0077B6' : '#64748b'} 
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
                  <span style={{ fontSize: 11, fontWeight: 900, color: '#0f172a' }}>
                    {activePoint.label} • {activePoint.date}
                  </span>
                  <span style={{ fontSize: 10, fontWeight: 800, color: '#0077B6', background: '#CAF0F8', padding: '1px 6px', borderRadius: 4 }}>
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
              <Info size={11} color="#0077B6" /> Hover over any node to scrub trajectory and inspect clinical milestones
            </span>
            <span style={{ fontWeight: 700, color: '#0077B6' }}>
              6-Month Kinetic Trend • R² = 0.984
            </span>
          </div>
        </div>

        {/* RIGHT STAGE: Multispeciality Case Distribution & Live Donut Arc */}
        <div style={{ display: 'flex', flexDirection: 'column', background: '#f5fbfe', borderRadius: 14, border: '1px solid #bfe7f5', padding: '12px 14px', justifyContent: 'space-between' }}>
          
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Activity size={15} color="#0077B6" />
                <span style={{ fontSize: 12, fontWeight: 800, color: '#0f172a' }}>
                  Multispeciality Case Mix
                </span>
              </div>
              <span className="brand-counter-pill" style={{ fontSize: 9.5, background: '#CAF0F8', color: '#0077B6', border: '1px solid #90E0EF' }}>
                4 Streams
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
                    return caseSegments.map((seg, i) => {
                      const strokeDash = (seg.pct / 100) * circumference;
                      const strokeOffset = -((accumulatedPct / 100) * circumference);
                      accumulatedPct += seg.pct;
                      const isSegSelected = selectedCaseIndex === i;

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
                          onMouseEnter={() => setSelectedCaseIndex(i)}
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
                  <span style={{ fontSize: 15, fontWeight: 900, color: caseSegments[selectedCaseIndex].color, lineHeight: 1 }}>
                    {caseSegments[selectedCaseIndex].pct}%
                  </span>
                  <span style={{ fontSize: 8.5, color: '#64748b', fontWeight: 700 }}>
                    SHARE
                  </span>
                </div>
              </div>

              {/* Selected Case Segment Details */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 11.5, fontWeight: 900, color: caseSegments[selectedCaseIndex].color, display: 'block' }}>
                  {caseSegments[selectedCaseIndex].label}
                </span>
                <span style={{ fontSize: 10, color: '#334155', fontWeight: 600, display: 'block', marginTop: 2 }}>
                  {caseSegments[selectedCaseIndex].therapy}
                </span>
                <span style={{ display: 'inline-block', marginTop: 4, background: '#ffffff', border: `1px solid ${caseSegments[selectedCaseIndex].color}55`, padding: '2px 6px', borderRadius: 6, fontSize: 9.5, fontWeight: 800, color: caseSegments[selectedCaseIndex].color }}>
                  {caseSegments[selectedCaseIndex].response}
                </span>
              </div>
            </div>

            {/* Case Streams List Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {caseSegments.map((seg, idx) => (
                <div 
                  key={idx}
                  onMouseEnter={() => setSelectedCaseIndex(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '3px 8px',
                    borderRadius: 6,
                    backgroundColor: selectedCaseIndex === idx ? '#ffffff' : 'transparent',
                    border: `1px solid ${selectedCaseIndex === idx ? seg.color : 'transparent'}`,
                    cursor: 'pointer',
                    transition: 'all 0.18s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: seg.color }} />
                    <span style={{ fontSize: 10.5, fontWeight: selectedCaseIndex === idx ? 800 : 600, color: '#0f172a' }}>
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
            background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', 
            border: '1px solid #bfdbfe',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="live-dot" style={{ backgroundColor: '#2563eb' }} />
              <span style={{ fontSize: 10, fontWeight: 800, color: '#1e3a8a' }}>
                Cardiac Telemetry: 74 BPM
              </span>
            </div>
            
            {/* Animated ECG Pulse Vector */}
            <svg width="70" height="16" viewBox="0 0 70 16">
              <path 
                d="M 0 8 L 15 8 L 20 2 L 25 14 L 30 8 L 35 8 L 40 4 L 45 12 L 50 8 L 70 8" 
                fill="none" 
                stroke="#2563eb" 
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
