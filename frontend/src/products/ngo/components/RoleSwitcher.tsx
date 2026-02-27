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
    <div style={{ padding: 12, borderTop: '1px solid #e0e0e0', background: '#F8F9F9' }}>
      <div style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>View as:</div>
      <select
        value={state.userRole}
        onChange={e => setUserRole(e.target.value)}
        style={{ width: '100%', borderRadius: 8, padding: '6px', fontSize: 14 }}
      >
        {roles.map(r => (
          <option key={r.value} value={r.value}>{r.label}</option>
        ))}
      </select>
    </div>
  );
};

export default RoleSwitcher;
