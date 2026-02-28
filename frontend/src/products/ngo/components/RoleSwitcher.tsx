import React from 'react';
import { useNGOPlatform } from '../context/NGOPlatformContext';

const roles = [
  { value: 'program-manager', label: 'Program Manager' },
  { value: 'data-analyst', label: 'Data Analyst' },
  { value: 'field-coordinator', label: 'Field Coordinator' },
];

const RoleSwitcher: React.FC = () => {
  const { state, setUserRole } = useNGOPlatform();
  return (
    <div style={{ padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.1)', background: '#1C2B3A' }}>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>View as</div>
      <select
        value={state.userRole}
        onChange={e => setUserRole(e.target.value as 'program-manager' | 'data-analyst' | 'field-coordinator')}
        style={{ width: '100%', borderRadius: 6, padding: '5px 8px', fontSize: 13, background: '#253545', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
      >
        {roles.map(r => (
          <option key={r.value} value={r.value}>{r.label}</option>
        ))}
      </select>
    </div>
  );
};

export default RoleSwitcher;
