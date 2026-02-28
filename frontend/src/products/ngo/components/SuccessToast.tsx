import React, { useEffect, useState } from 'react';
import { CheckCircle } from 'lucide-react';

interface SuccessToastProps {
  message: string;
  duration?: number;
}

const SuccessToast: React.FC<SuccessToastProps> = ({ message, duration = 3000 }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), duration);
    return () => clearTimeout(timer);
  }, [duration]);

  if (!visible) return null;

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, background: '#fff', borderLeft: '6px solid #5A8A6A', boxShadow: '0 2px 8px rgba(44,62,80,0.12)', borderRadius: 8, padding: '12px 20px', display: 'flex', alignItems: 'center', minWidth: 220, fontSize: 15, animation: 'slideIn 0.3s' }}>
      <CheckCircle color="#5A8A6A" size={24} style={{ marginRight: 12 }} />
      <span>{message}</span>
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default SuccessToast;
