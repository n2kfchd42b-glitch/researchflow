import React, { useState } from 'react';
import { useNGOPlatform } from '../context/NGOPlatformContext';

const ProgramSelector: React.FC = () => {
  const { state, setActiveProgram, createProgram } = useNGOPlatform();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', country: '', donor: '', totalBudget: 0, startDate: '', endDate: '', description: '', logoUrl: null });

  const handleSelect = (id: string | null) => setActiveProgram(id);

  const handleCreate = () => {
    createProgram(form);
    setShowForm(false);
    setForm({ name: '', country: '', donor: '', totalBudget: 0, startDate: '', endDate: '', description: '', logoUrl: null });
  };

  return (
    <div style={{ padding: '12px 8px', borderBottom: '1px solid #e0e0e0', background: '#F8F9F9' }}>
      <select
        value={state.activeProgramId || ''}
        onChange={e => handleSelect(e.target.value || null)}
        style={{ width: '100%', borderRadius: 8, padding: '8px', fontSize: 14, marginBottom: 8 }}
      >
        <option value="">All Projects</option>
        {state.programs.map((p: any) => (
          <option key={p.id} value={p.id}>
            {p.name} ({p.country}) — {p.donor}
          </option>
        ))}
        <option value="new">+ New Program</option>
      </select>
      {state.activeProgramId === 'new' && !showForm && (
        <button style={{ background: '#5A8A6A', color: '#fff', borderRadius: 8, padding: '6px 12px', fontSize: 14 }} onClick={() => setShowForm(true)}>
          Create New Program
        </button>
      )}
      {showForm && (
        <div style={{ marginTop: 8 }}>
          <input placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={{ width: '100%', marginBottom: 6 }} />
          <input placeholder="Country" value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} style={{ width: '100%', marginBottom: 6 }} />
          <input placeholder="Donor" value={form.donor} onChange={e => setForm({ ...form, donor: e.target.value })} style={{ width: '100%', marginBottom: 6 }} />
          <input type="number" placeholder="Total Budget" value={form.totalBudget} onChange={e => setForm({ ...form, totalBudget: Number(e.target.value) })} style={{ width: '100%', marginBottom: 6 }} />
          <input type="date" placeholder="Start Date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} style={{ width: '100%', marginBottom: 6 }} />
          <input type="date" placeholder="End Date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} style={{ width: '100%', marginBottom: 6 }} />
          <textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ width: '100%', marginBottom: 6 }} />
          <button style={{ background: '#5A8A6A', color: '#fff', borderRadius: 8, padding: '6px 12px', fontSize: 14 }} onClick={handleCreate}>
            Save Program
          </button>
          <button style={{ marginLeft: 8, background: '#e0e0e0', color: '#1C2B3A', borderRadius: 8, padding: '6px 12px', fontSize: 14 }} onClick={() => setShowForm(false)}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

export default ProgramSelector;
