import React from 'react';
import { usePatients } from '../context/PatientContext';
import { Users, FileQuestion, Sparkles, Stethoscope, ArrowUpRight } from 'lucide-react';

export default function StatsRow() {
  const { stats } = usePatients();

  return (
    <div className="stats-grid">
      {/* Card 1: Total Checked In */}
      <div className="stat-card">
        <div className="stat-card-accent-blob blob-blue" />
        <div className="stat-squircle-badge badge-bg-blue">
          <Users size={16} strokeWidth={2.4} />
        </div>
        <div className="stat-card-value">{stats.total}</div>
        <div className="stat-card-label">Total Patients</div>
      </div>

      {/* Card 2: AI Insights Ready */}
      <div className="stat-card">
        <div className="stat-card-accent-blob blob-green" />
        <div className="stat-squircle-badge badge-bg-green">
          <Sparkles size={16} strokeWidth={2.4} />
        </div>
        <div className="stat-card-value">{stats.insightsReady}</div>
        <div className="stat-card-label">AI Insights Ready</div>
      </div>

      {/* Card 3: Pending Intake (Bright subtle yellow / amber) */}
      <div className="stat-card">
        <div className="stat-card-accent-blob blob-yellow" />
        <div className="stat-squircle-badge badge-bg-yellow">
          <FileQuestion size={16} strokeWidth={2.4} />
        </div>
        <div className="stat-card-value">{stats.pendingQuestionnaire}</div>
        <div className="stat-card-label">Pending Intake</div>
      </div>

      {/* Card 4: In Consultation */}
      <div className="stat-card">
        <div className="stat-card-accent-blob blob-rose" />
        <div className="stat-squircle-badge badge-bg-rose">
          <Stethoscope size={16} strokeWidth={2.4} />
        </div>
        <div className="stat-card-value">{stats.inConsultation}</div>
        <div className="stat-card-label">In Consultation</div>
      </div>
    </div>
  );
}
