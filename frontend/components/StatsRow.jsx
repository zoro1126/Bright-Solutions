import React from 'react';
import { usePatients } from '../context/PatientContext';
import { Users, FileQuestion, Sparkles, Stethoscope, ArrowUpRight, Clock, Activity } from 'lucide-react';

export default function StatsRow() {
  const { stats } = usePatients();

  return (
    <div className="stats-grid">
      {/* Card 1: Today's Intake Count (Blue) */}
      <div className="stat-card">
        <div className="stat-card-accent-blob blob-blue" />
        <div className="stat-squircle-badge badge-bg-blue">
          <Users size={17} strokeWidth={2.4} />
        </div>
        <div className="stat-card-value">{stats.total}</div>
        <div className="stat-card-label">Today's Intake Count</div>
      </div>

      {/* Card 2: Next Token Number (Orange / Amber) */}
      <div className="stat-card">
        <div className="stat-card-accent-blob blob-yellow" />
        <div className="stat-squircle-badge badge-bg-yellow">
          <Clock size={17} strokeWidth={2.4} />
        </div>
        <div className="stat-card-value">#{140 + stats.total + 1}</div>
        <div className="stat-card-label">Next Token Number</div>
      </div>

      {/* Card 3: Avg Triage Speed (Green / Pulse) */}
      <div className="stat-card">
        <div className="stat-card-accent-blob blob-green" />
        <div className="stat-squircle-badge badge-bg-green">
          <Activity size={17} strokeWidth={2.4} />
        </div>
        <div className="stat-card-value">5.2 min</div>
        <div className="stat-card-label">Avg Triage Speed</div>
      </div>

      {/* Card 4: AI Insights Ready (Magenta / Rose) */}
      <div className="stat-card">
        <div className="stat-card-accent-blob blob-rose" />
        <div className="stat-squircle-badge badge-bg-rose">
          <Sparkles size={17} strokeWidth={2.4} />
        </div>
        <div className="stat-card-value">{stats.insightsReady}</div>
        <div className="stat-card-label">AI Insights Ready</div>
      </div>
    </div>
  );
}
