import React from 'react';

interface LoadingOverlayProps {
  message?: string;
  visible: boolean;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message = 'Processing...', visible }) => {
  if (!visible) return null;
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(90,138,106,0.12)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div className="spinner" style={{ width: 48, height: 48, border: '6px solid #e0e0e0', borderTop: '6px solid #5A8A6A', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <div style={{ marginTop: 16, color: '#5A8A6A', fontSize: 16, fontWeight: 500, animation: 'pulse 1.2s infinite' }}>{message}</div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.6; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default LoadingOverlay;
