import React from 'react';
import { usePatients } from '../context/PatientContext';
import { Users, Clock, Stethoscope, CheckCircle2 } from 'lucide-react';

export default function StatsRow() {
  const { stats } = usePatients();

  return (
    <div className="stats-grid">
      {/* Card 1: Today's Registrations (Blue) */}
      <div className="stat-card">
        <div className="stat-card-accent-blob blob-blue" />
        <div className="stat-squircle-badge badge-bg-blue">
          <Users size={17} strokeWidth={2.4} />
        </div>
        <div className="stat-card-value">{stats.total}</div>
        <div className="stat-card-label">Today's Registrations</div>
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

      {/* Card 3: Waiting in Lounge (Amber) */}
      <div className="stat-card">
        <div className="stat-card-accent-blob blob-yellow" />
        <div className="stat-squircle-badge badge-bg-yellow" style={{ background: '#fef3c7', color: '#b45309' }}>
          <Clock size={17} strokeWidth={2.4} />
        </div>
        <div className="stat-card-value" style={{ color: '#b45309' }}>{stats.waiting}</div>
        <div className="stat-card-label">Waiting in Lounge</div>
      </div>

      {/* Card 4: In Consultation (Cobalt Blue) */}
      <div className="stat-card">
        <div className="stat-card-accent-blob blob-blue" />
        <div className="stat-squircle-badge badge-bg-blue" style={{ background: '#e0f2fe', color: '#0284c7' }}>
          <Stethoscope size={17} strokeWidth={2.4} />
        </div>
        <div className="stat-card-value" style={{ color: '#0284c7' }}>{stats.inConsultation}</div>
        <div className="stat-card-label">In Consultation</div>
      </div>
    </div>
  );
}
