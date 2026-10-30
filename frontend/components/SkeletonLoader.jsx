/**
 * SkeletonLoader.jsx — TASK FE-7.3
 * Reusable shimmer skeleton loading states.
 * Uses CSS classes from index.css (.skeleton, .skeleton-text, etc.)
 */
import React from 'react';

export function SkeletonText({ width = '100%', height = 12, style = {} }) {
  return (
    <div className="skeleton" style={{ width, height, borderRadius: 4, marginBottom: 8, ...style }} />
  );
}

export function SkeletonCard({ rows = 3, showAvatar = false, style = {} }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0',
      padding: '16px', marginBottom: 12, ...style
    }}>
      {showAvatar && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div className="skeleton-avatar" />
          <div style={{ flex: 1 }}>
            <SkeletonText width="60%" height={13} />
            <SkeletonText width="40%" height={10} />
          </div>
        </div>
      )}
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonText key={i} width={i === rows - 1 ? '55%' : '100%'} />
      ))}
    </div>
  );
}

export function SkeletonBedCard() {
  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1.5px solid #e2e8f0', padding: '14px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
        <SkeletonText width="40%" height={14} style={{ marginBottom: 0 }} />
        <SkeletonText width="25%" height={14} style={{ marginBottom: 0 }} />
      </div>
      <SkeletonText width="60%" height={10} />
      <SkeletonText width="80%" height={13} />
      <SkeletonText width="50%" height={11} />
      <div style={{ marginTop: 10 }}>
        <div className="skeleton" style={{ height: 30, borderRadius: 8 }} />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 12, padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonText key={i} width="70%" height={10} style={{ marginBottom: 0 }} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, ri) => (
        <div key={ri} style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 12, padding: '10px 16px', borderBottom: '1px solid #f8fafc' }}>
          {Array.from({ length: cols }).map((_, ci) => (
            <SkeletonText key={ci} width={ci === 0 ? '85%' : '60%'} height={11} style={{ marginBottom: 0 }} />
          ))}
        </div>
      ))}
    </div>
  );
}

// Loading page wrapper
export function PageLoadingState({ rows = 4 }) {
  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div className="skeleton" style={{ width: 160, height: 22, borderRadius: 6 }} />
        <div className="skeleton" style={{ width: 80, height: 20, borderRadius: 20 }} />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonCard key={i} showAvatar={i % 2 === 0} rows={2} />
      ))}
    </div>
  );
}

export default SkeletonCard;
