import React from 'react';
import { UserPlus, RefreshCw, Users, Hash, UserCheck, HeartPulse } from 'lucide-react';

export default function HeroStats({
  patientCount,
  nextToken,
  doctorCount,
  onOpenRegisterModal,
  onRefresh,
  loading
}) {
  return (
    <section className="hero-section">
      <div className="hero-header">
        <div className="hero-titles">
          <h1>
            <span>Bright Solutions • Patient Registration & Triage</span>
          </h1>
          <p className="hero-subtitle">
            Feature 1: Instant demographic intake, real-time BMI & AHA blood pressure stage computation, and sequential queue token allocation.
          </p>
        </div>

        <div className="hero-actions">
          <button 
            className="btn btn-secondary" 
            onClick={onRefresh} 
            disabled={loading}
            title="Refresh patient roster"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button 
            className="btn btn-primary btn-lg" 
            onClick={onOpenRegisterModal}
            id="register-patient-btn"
          >
            <UserPlus size={18} />
            <span>+ Register New Patient</span>
          </button>
        </div>
      </div>

      {/* 4 Stats Cards with Yellow as Primary */}
      <div className="stats-grid">
        {/* Stat 1: Total Registered */}
        <div className="stat-card card-yellow">
          <div className="stat-info">
            <span className="stat-label">Patients Registered</span>
            <span className="stat-value">{patientCount}</span>
            <span className="stat-hint">
              <span>Today's OPD Session</span>
            </span>
          </div>
          <div className="stat-icon">
            <Users size={22} />
          </div>
        </div>

        {/* Stat 2: Next Queue Token Preview */}
        <div className="stat-card card-yellow">
          <div className="stat-info">
            <span className="stat-label">Next Queue Token</span>
            <span className="stat-value" style={{ color: '#0A2540' }}>{nextToken || 'Q-101'}</span>
            <span className="stat-hint">
              <span>Auto-allocated on registration</span>
            </span>
          </div>
          <div className="stat-icon">
            <Hash size={22} />
          </div>
        </div>

        {/* Stat 3: Doctors on Duty */}
        <div className="stat-card card-gold">
          <div className="stat-info">
            <span className="stat-label">Attending Doctors</span>
            <span className="stat-value">{doctorCount}</span>
            <span className="stat-hint">
              <span>Active in Internal Med & OPD</span>
            </span>
          </div>
          <div className="stat-icon">
            <UserCheck size={22} />
          </div>
        </div>

        {/* Stat 4: Clinical Triage Status */}
        <div className="stat-card card-navy">
          <div className="stat-info">
            <span className="stat-label">Triage Protocols</span>
            <span className="stat-value">AHA 2017</span>
            <span className="stat-hint">
              <span>Real-time BP & BMI Scoring</span>
            </span>
          </div>
          <div className="stat-icon">
            <HeartPulse size={22} />
          </div>
        </div>
      </div>
    </section>
  );
}
