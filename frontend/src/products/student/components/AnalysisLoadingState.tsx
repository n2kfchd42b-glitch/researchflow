import React, { useEffect, useState } from 'react';

interface AnalysisLoadingStateProps {
  analysisName: string;
}

const MESSAGES = [
  'Crunching the numbers…',
  'Checking your data…',
  'Almost there…',
  'Building your results…',
];

export default function AnalysisLoadingState({ analysisName }: AnalysisLoadingStateProps) {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex(prev => (prev + 1) % MESSAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      background: 'rgba(255,255,255,0.88)',
      borderRadius: 10,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.75rem',
      zIndex: 10,
    }}>
      <div className="rf-spinner" />
      <div style={{ fontWeight: 600, color: '#1C2B3A', fontSize: '0.9rem' }}>
        Running {analysisName}…
      </div>
      <div style={{ fontSize: '0.8rem', color: '#888', transition: 'opacity 0.3s' }}>
        {MESSAGES[msgIndex]}
      </div>
    </div>
  );
}
