import React from 'react';

function SkeletonBlock({ width, height, style }: { width?: string; height?: number; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: 'linear-gradient(90deg, #f0f4f8 25%, #e8ecf0 50%, #f0f4f8 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.4s infinite',
      borderRadius: 6,
      width: width ?? '100%',
      height: height ?? 14,
      ...style,
    }} />
  );
}

function SkeletonCard() {
  return (
    <div style={{
      background: 'white',
      border: '1px solid #e8ecf0',
      borderRadius: 12,
      padding: '1rem 1.25rem',
      marginBottom: '0.75rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
        <SkeletonBlock width="55%" height={16} />
        <SkeletonBlock width="90px" height={22} style={{ borderRadius: 20 }} />
      </div>
      <SkeletonBlock height={12} style={{ marginBottom: 6 }} />
      <SkeletonBlock width="80%" height={12} style={{ marginBottom: 10 }} />
      <SkeletonBlock width="120px" height={30} style={{ borderRadius: 8 }} />
    </div>
  );
}

export default function RecommendationSkeleton() {
  return (
    <div>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
      `}</style>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1rem', color: '#888', fontSize: '0.85rem' }}>
        <span style={{ animation: 'spin 1.2s linear infinite', display: 'inline-block' }}>⟳</span>
        Analysing your study design…
      </div>
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
