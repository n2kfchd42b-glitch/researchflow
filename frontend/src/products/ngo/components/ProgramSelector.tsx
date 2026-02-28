import React, { useState } from 'react';
import { useNGOPlatform } from '../context/NGOPlatformContext';

const ProgramSelector: React.FC = () => {
  const { state, setActiveProgram, createProgram } = useNGOPlatform();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', country: '', donor: '', totalBudget: 0, startDate: '', endDate: '', description: '', logoUrl: null });

  const handleSelect = (val: string) => {
    if (val === '__new__') {
      setShowForm(true);
    } else {
      setActiveProgram(val || null);
    }
  };

  const handleCreate = () => {
    if (!form.name.trim()) return;
    createProgram(form);
    setShowForm(false);
    setForm({ name: '', country: '', donor: '', totalBudget: 0, startDate: '', endDate: '', description: '', logoUrl: null });
  };

  return (
    <div style={{ padding: '10px 6px', background: '#F8F9F9' }}>
      <select
        value={state.activeProgramId || ''}
        onChange={e => handleSelect(e.target.value)}
        style={{ width: '100%', borderRadius: 8, padding: '7px 8px', fontSize: 13, marginBottom: showForm ? 8 : 0, border: '1px solid #ccc' }}
      >
        <option value="">All Projects</option>
        {state.programs.map((p: any) => (
          <option key={p.id} value={p.id}>
            {p.name}{p.country ? ` (${p.country})` : ''}{p.donor ? ` — ${p.donor}` : ''}
          </option>
        ))}
        <option value="__new__">+ New Program</option>
      </select>
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
