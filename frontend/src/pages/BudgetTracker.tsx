import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

const STORAGE_KEY = 'researchflow_budget';

const CATEGORIES = ['Personnel','Consumables','Travel','Training','Equipment','Overhead','Subcontracts','Other'];
const CURRENCIES  = ['USD','GBP','EUR','KES','UGX','TZS','GHS','NGN','ZAR','ETB'];

const CAT_COLORS: Record<string,string> = {
  Personnel:     '#1C2B3A',
  Consumables:   '#C0533A',
  Travel:        '#5A8A6A',
  Training:      '#2196f3',
  Equipment:     '#9c27b0',
  Overhead:      '#ff9800',
  Subcontracts:  '#00897b',
  Other:         '#607d8b',
};

type LineItem = {
  id:          string;
  category:    string;
  description: string;
  allocated:   number;
  spent:       number;
  notes:       string;
};

type Budget = {
  id:          string;
  name:        string;
  funder:      string;
  currency:    string;
  start_date:  string;
  end_date:    string;
  total:       number;
  items:       LineItem[];
  created_at:  string;
};

function emptyBudget(): Budget {
  return {
    id:         Date.now().toString(),
    name:       '',
    funder:     '',
    currency:   'USD',
    start_date: new Date().toISOString().split('T')[0],
    end_date:   '',
    total:      0,
    items:      [],
    created_at: new Date().toISOString(),
  };
}

function emptyItem(category = 'Personnel'): LineItem {
  return { id: Date.now().toString(), category, description: '', allocated: 0, spent: 0, notes: '' };
}

function fmt(n: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

export default function BudgetTracker() {
  const [budgets, setBudgets]         = useState<Budget[]>([]);
  const [active, setActive]           = useState<Budget | null>(null);
  const [showCreate, setShowCreate]   = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [newForm, setNewForm]         = useState<Budget>(emptyBudget());
  const [newItem, setNewItem]         = useState<LineItem>(emptyItem());
  const [editItem, setEditItem]       = useState<LineItem | null>(null);
  const [activeTab, setActiveTab]     = useState('overview');
  const [saved, setSaved]             = useState(false);
  const [copied, setCopied]           = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setBudgets(parsed);
        if (parsed.length > 0) setActive(parsed[0]);
      }
    } catch {}
  }, []);

  function save(updated: Budget[]) {
    setBudgets(updated);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch {}
    setSaved(true); setTimeout(() => setSaved(false), 1500);
  }

  function createBudget() {
    if (!newForm.name) return;
    const b = { ...newForm, id: Date.now().toString(), created_at: new Date().toISOString() };
    const updated = [...budgets, b];
    save(updated); setActive(b); setShowCreate(false); setNewForm(emptyBudget());
  }

  function deleteBudget(id: string) {
    if (!window.confirm('Delete this budget?')) return;
    const updated = budgets.filter(b => b.id !== id);
    save(updated); setActive(updated[0] || null);
  }

  function addItem() {
    if (!active || !newItem.description) return;
    const updated = budgets.map(b => b.id === active.id ? { ...b, items: [...b.items, { ...newItem, id: Date.now().toString() }] } : b);
    const updatedActive = updated.find(b => b.id === active.id)!;
    save(updated); setActive(updatedActive); setShowAddItem(false); setNewItem(emptyItem());
  }

  function saveEditItem() {
    if (!active || !editItem) return;
    const updated = budgets.map(b => b.id === active.id ? { ...b, items: b.items.map(i => i.id === editItem.id ? editItem : i) } : b);
    const updatedActive = updated.find(b => b.id === active.id)!;
    save(updated); setActive(updatedActive); setEditItem(null);
  }

  function deleteItem(itemId: string) {
    if (!active) return;
    const updated = budgets.map(b => b.id === active.id ? { ...b, items: b.items.filter(i => i.id !== itemId) } : b);
    const updatedActive = updated.find(b => b.id === active.id)!;
    save(updated); setActive(updatedActive);
  }

  function updateSpent(itemId: string, spent: number) {
    if (!active) return;
    const updated = budgets.map(b => b.id === active.id ? { ...b, items: b.items.map(i => i.id === itemId ? { ...i, spent } : i) } : b);
    const updatedActive = updated.find(b => b.id === active.id)!;
    save(updated); setActive(updatedActive);
  }

  function exportCSV() {
    if (!active) return;
    const headers = ['Category','Description','Allocated','Spent','Remaining','% Used','Status','Notes'];
    const rows = active.items.map(i => [
      i.category, i.description,
      i.allocated, i.spent,
      i.allocated - i.spent,
      i.allocated > 0 ? Math.round(i.spent/i.allocated*100) + '%' : '0%',
      i.spent > i.allocated ? 'OVER BUDGET' : 'On Track',
      i.notes
    ]);
    const totRow = ['TOTAL', '', totalAllocated, totalSpent, totalAllocated - totalSpent, Math.round(burnRate) + '%', '', ''];
    const csv = [headers, ...rows, totRow].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a'); a.href = url;
    a.download = `budget_${active.name.replace(/\s+/g,'_')}.csv`; a.click();
  }

  function copyReport() {
    if (!active) return;
    const lines = [
      `BUDGET REPORT — ${active.name}`,
      `Funder: ${active.funder} | Currency: ${active.currency}`,
      `Period: ${active.start_date} to ${active.end_date || 'ongoing'}`,
      `Generated: ${new Date().toLocaleDateString()}`,
      '',
      `Total Allocated: ${fmt(totalAllocated, active.currency)}`,
      `Total Spent:     ${fmt(totalSpent, active.currency)}`,
      `Remaining:       ${fmt(totalAllocated - totalSpent, active.currency)}`,
      `Burn Rate:       ${Math.round(burnRate)}%`,
      '',
      'BREAKDOWN BY CATEGORY:',
      ...catData.map(c => `  ${c.category}: Allocated ${fmt(c.allocated, active.currency)} | Spent ${fmt(c.spent, active.currency)} | ${Math.round(c.allocated > 0 ? c.spent/c.allocated*100 : 0)}% used`),
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  const totalAllocated = active?.items.reduce((s,i) => s + i.allocated, 0) || 0;
  const totalSpent     = active?.items.reduce((s,i) => s + i.spent,     0) || 0;
  const totalRemaining = totalAllocated - totalSpent;
  const burnRate       = totalAllocated > 0 ? totalSpent / totalAllocated * 100 : 0;
  const overBudgetItems = active?.items.filter(i => i.spent > i.allocated) || [];

  const catData = CATEGORIES.map(cat => ({
    category:  cat,
    allocated: active?.items.filter(i => i.category === cat).reduce((s,i) => s + i.allocated, 0) || 0,
    spent:     active?.items.filter(i => i.category === cat).reduce((s,i) => s + i.spent,     0) || 0,
  })).filter(c => c.allocated > 0 || c.spent > 0);

  const daysTotal     = active?.end_date ? Math.ceil((new Date(active.end_date).getTime() - new Date(active.start_date).getTime()) / 86400000) : 0;
  const daysElapsed   = active ? Math.ceil((Date.now() - new Date(active.start_date).getTime()) / 86400000) : 0;
  const timePct       = daysTotal > 0 ? Math.min(100, Math.round(daysElapsed / daysTotal * 100)) : 0;
  const daysRemaining = active?.end_date ? Math.ceil((new Date(active.end_date).getTime() - Date.now()) / 86400000) : null;

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ color: '#1C2B3A', marginBottom: 0 }}>Budget Tracker</h1>
          <p style={{ marginBottom: 0, fontSize: '0.88rem', color: '#888' }}>Track grant allocations and actual spend across research projects</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {saved && <span style={{ color: '#5A8A6A', fontSize: '0.82rem' }}>✓ Saved</span>}
          <button className="btn btn-primary" onClick={() => { setNewForm(emptyBudget()); setShowCreate(true); }}>
            + New Budget
          </button>
        </div>
      </div>

      {/* CREATE MODAL */}
      {showCreate && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ width: 520, maxWidth: '95vw' }}>
            <h2>Create New Budget</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#888', display: 'block', marginBottom: 4 }}>BUDGET / PROJECT NAME *</label>
                <input value={newForm.name} onChange={e => setNewForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. DFID Malaria Study 2024-2026"
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.88rem' }} />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#888', display: 'block', marginBottom: 4 }}>FUNDER</label>
                <input value={newForm.funder} onChange={e => setNewForm(p => ({ ...p, funder: e.target.value }))}
                  placeholder="e.g. Wellcome Trust, NIH, USAID"
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.88rem' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#888', display: 'block', marginBottom: 4 }}>CURRENCY</label>
                <select value={newForm.currency} onChange={e => setNewForm(p => ({ ...p, currency: e.target.value }))}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.88rem' }}>
                  {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#888', display: 'block', marginBottom: 4 }}>TOTAL GRANT AMOUNT</label>
                <input type="number" value={newForm.total || ''} onChange={e => setNewForm(p => ({ ...p, total: parseFloat(e.target.value)||0 }))}
                  placeholder="0"
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.88rem' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#888', display: 'block', marginBottom: 4 }}>START DATE</label>
                <input type="date" value={newForm.start_date} onChange={e => setNewForm(p => ({ ...p, start_date: e.target.value }))}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.88rem' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#888', display: 'block', marginBottom: 4 }}>END DATE</label>
                <input type="date" value={newForm.end_date} onChange={e => setNewForm(p => ({ ...p, end_date: e.target.value }))}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.88rem' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button className="btn btn-primary" onClick={createBudget} disabled={!newForm.name}>Create Budget</button>
              <button className="btn" style={{ background: '#eee', color: '#444' }} onClick={() => setShowCreate(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ADD ITEM MODAL */}
      {showAddItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ width: 500, maxWidth: '95vw' }}>
            <h2>Add Budget Line Item</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#888', display: 'block', marginBottom: 4 }}>CATEGORY</label>
                <select value={newItem.category} onChange={e => setNewItem(p => ({ ...p, category: e.target.value }))}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.88rem' }}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#888', display: 'block', marginBottom: 4 }}>DESCRIPTION *</label>
                <input value={newItem.description} onChange={e => setNewItem(p => ({ ...p, description: e.target.value }))}
                  placeholder="e.g. Research Nurse salary (12 months)"
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.88rem' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#888', display: 'block', marginBottom: 4 }}>ALLOCATED ({active?.currency})</label>
                <input type="number" value={newItem.allocated || ''} onChange={e => setNewItem(p => ({ ...p, allocated: parseFloat(e.target.value)||0 }))}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.88rem' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#888', display: 'block', marginBottom: 4 }}>SPENT TO DATE ({active?.currency})</label>
                <input type="number" value={newItem.spent || ''} onChange={e => setNewItem(p => ({ ...p, spent: parseFloat(e.target.value)||0 }))}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.88rem' }} />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#888', display: 'block', marginBottom: 4 }}>NOTES</label>
                <input value={newItem.notes} onChange={e => setNewItem(p => ({ ...p, notes: e.target.value }))}
                  placeholder="Optional notes"
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.88rem' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button className="btn btn-primary" onClick={addItem} disabled={!newItem.description}>Add Item</button>
              <button className="btn" style={{ background: '#eee', color: '#444' }} onClick={() => setShowAddItem(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT ITEM MODAL */}
      {editItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ width: 500, maxWidth: '95vw' }}>
            <h2>Edit Line Item</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#888', display: 'block', marginBottom: 4 }}>CATEGORY</label>
                <select value={editItem.category} onChange={e => setEditItem(p => p ? ({ ...p, category: e.target.value }) : p)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.88rem' }}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#888', display: 'block', marginBottom: 4 }}>DESCRIPTION</label>
                <input value={editItem.description} onChange={e => setEditItem(p => p ? ({ ...p, description: e.target.value }) : p)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.88rem' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#888', display: 'block', marginBottom: 4 }}>ALLOCATED</label>
                <input type="number" value={editItem.allocated} onChange={e => setEditItem(p => p ? ({ ...p, allocated: parseFloat(e.target.value)||0 }) : p)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.88rem' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#888', display: 'block', marginBottom: 4 }}>SPENT</label>
                <input type="number" value={editItem.spent} onChange={e => setEditItem(p => p ? ({ ...p, spent: parseFloat(e.target.value)||0 }) : p)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.88rem' }} />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#888', display: 'block', marginBottom: 4 }}>NOTES</label>
                <input value={editItem.notes} onChange={e => setEditItem(p => p ? ({ ...p, notes: e.target.value }) : p)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.88rem' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button className="btn btn-primary" onClick={saveEditItem}>Save Changes</button>
              <button className="btn" style={{ background: '#eee', color: '#444' }} onClick={() => setEditItem(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {budgets.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem', maxWidth: 600, margin: '0 auto' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>💰</div>
          <h2>No Budgets Yet</h2>
          <p style={{ color: '#888', marginBottom: '1.5rem' }}>Create your first research budget to track grant allocations and spending.</p>
          <button className="btn btn-primary" onClick={() => { setNewForm(emptyBudget()); setShowCreate(true); }}>
            + Create First Budget
          </button>
        </div>
      )}

      {budgets.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '1.5rem' }}>

          {/* BUDGET LIST */}
          <div className="card" style={{ padding: '1rem', alignSelf: 'start' }}>
            <h3 style={{ fontSize: '0.82rem', color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: '0.75rem' }}>
              Budgets ({budgets.length})
            </h3>
            {budgets.map(b => {
              const alloc = b.items.reduce((s,i) => s+i.allocated, 0);
              const spent = b.items.reduce((s,i) => s+i.spent, 0);
              const pct   = alloc > 0 ? Math.round(spent/alloc*100) : 0;
              return (
                <div key={b.id} onClick={() => { setActive(b); setActiveTab('overview'); }}
                  style={{ padding: '0.75rem', borderRadius: 8, cursor: 'pointer', marginBottom: '0.5rem',
                    background: active?.id === b.id ? '#fff5f3' : 'transparent',
                    border: '1px solid ' + (active?.id === b.id ? '#C0533A' : '#eee') }}>
                  <p style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 2, color: active?.id === b.id ? '#C0533A' : '#1C2B3A' }}>
                    {b.name}
                  </p>
                  <p style={{ fontSize: '0.72rem', color: '#888', marginBottom: 4 }}>{b.funder || 'No funder'} · {b.currency}</p>
                  <div style={{ background: '#eee', borderRadius: 4, height: 5 }}>
                    <div style={{ background: pct > 90 ? '#f44336' : pct > 70 ? '#ff9800' : '#5A8A6A', borderRadius: 4, height: 5, width: `${Math.min(100,pct)}%` }} />
                  </div>
                  <p style={{ fontSize: '0.68rem', color: '#aaa', marginBottom: 0, marginTop: 2 }}>{pct}% spent</p>
                </div>
              );
            })}
          </div>

          {/* BUDGET DETAIL */}
          {active && (
            <div>
              {/* HEADER */}
              <div className="card" style={{ marginBottom: '1rem', borderTop: `4px solid ${burnRate > 90 ? '#f44336' : burnRate > 70 ? '#ff9800' : '#5A8A6A'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h2 style={{ marginBottom: 4 }}>{active.name}</h2>
                    <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: 0 }}>
                      {active.funder && <span>{active.funder} · </span>}
                      {active.currency} · {active.start_date}{active.end_date ? ` → ${active.end_date}` : ''}
                      {daysRemaining !== null && (
                        <span style={{ marginLeft: 8, color: daysRemaining < 60 ? '#f44336' : '#888' }}>
                          ({daysRemaining < 0 ? 'Ended' : `${daysRemaining} days left`})
                        </span>
                      )}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-sage" style={{ fontSize: '0.82rem' }} onClick={copyReport}>
                      {copied ? '✓ Copied!' : '📋 Report'}
                    </button>
                    <button className="btn" style={{ background: '#eee', color: '#444', fontSize: '0.82rem' }} onClick={exportCSV}>
                      ⬇️ CSV
                    </button>
                    <button className="btn" style={{ background: '#fff5f5', color: '#f44336', fontSize: '0.82rem' }} onClick={() => deleteBudget(active.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>

              {/* STAT CARDS */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
                {[
                  { label: 'Total Allocated', value: fmt(totalAllocated, active.currency), color: '#1C2B3A', sub: `${active.items.length} line items` },
                  { label: 'Total Spent',     value: fmt(totalSpent,     active.currency), color: burnRate > 90 ? '#f44336' : '#C0533A', sub: `${Math.round(burnRate)}% of budget` },
                  { label: 'Remaining',       value: fmt(totalRemaining, active.currency), color: totalRemaining < 0 ? '#f44336' : '#5A8A6A', sub: totalRemaining < 0 ? '⚠️ Over budget' : 'Available' },
                  { label: 'Time Elapsed',    value: `${timePct}%`,                        color: timePct > burnRate + 20 ? '#5A8A6A' : timePct < burnRate - 20 ? '#f44336' : '#2196f3', sub: daysRemaining !== null ? `${daysRemaining} days left` : 'No end date' },
                ].map(item => (
                  <div key={item.label} className="card" style={{ textAlign: 'center', padding: '0.875rem' }}>
                    <p style={{ fontSize: '1.3rem', fontWeight: 700, color: item.color, marginBottom: 2 }}>{item.value}</p>
                    <p style={{ fontSize: '0.72rem', color: '#888', marginBottom: 2 }}>{item.label}</p>
                    <p style={{ fontSize: '0.68rem', color: '#aaa', marginBottom: 0 }}>{item.sub}</p>
                  </div>
                ))}
              </div>

              {/* BURN RATE BAR */}
              <div className="card" style={{ marginBottom: '1rem', padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>Budget Burn Rate</span>
                  <span style={{ fontSize: '0.82rem', color: '#888' }}>
                    {fmt(totalSpent, active.currency)} of {fmt(totalAllocated, active.currency)} ({Math.round(burnRate)}%)
                  </span>
                </div>
                <div style={{ background: '#eee', borderRadius: 8, height: 14, overflow: 'hidden', position: 'relative' }}>
                  <div style={{ background: burnRate > 100 ? '#f44336' : burnRate > 90 ? '#ff5722' : burnRate > 70 ? '#ff9800' : '#5A8A6A', height: '100%', width: `${Math.min(100,burnRate)}%`, borderRadius: 8, transition: 'width 0.5s' }} />
                  {timePct > 0 && timePct <= 100 && (
                    <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${timePct}%`, width: 2, background: '#1C2B3A', opacity: 0.5 }} title={`Time elapsed: ${timePct}%`} />
                  )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                  <span style={{ fontSize: '0.7rem', color: '#aaa' }}>0%</span>
                  {timePct > 0 && <span style={{ fontSize: '0.7rem', color: '#1C2B3A', fontWeight: 600 }}>▲ {timePct}% time elapsed</span>}
                  <span style={{ fontSize: '0.7rem', color: '#aaa' }}>100%</span>
                </div>
              </div>

              {/* ALERTS */}
              {overBudgetItems.length > 0 && (
                <div className="alert alert-critical" style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
                  ⚠️ {overBudgetItems.length} line item{overBudgetItems.length > 1 ? 's are' : ' is'} over budget: {overBudgetItems.map(i => i.description).join(', ')}
                </div>
              )}

              {/* TABS */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                {[
                  { id: 'overview', label: '📊 Overview'    },
                  { id: 'items',    label: '📋 Line Items'   },
                  { id: 'chart',    label: '📈 Chart'        },
                ].map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} className="btn" style={{
                    background: activeTab === tab.id ? '#1C2B3A' : '#eee',
                    color:      activeTab === tab.id ? 'white'   : '#444',
                    padding: '0.5rem 1rem', fontSize: '0.85rem',
                  }}>
                    {tab.label}
                  </button>
                ))}
                <button className="btn btn-primary" style={{ marginLeft: 'auto', fontSize: '0.85rem' }}
                  onClick={() => { setNewItem(emptyItem()); setShowAddItem(true); }}>
                  + Add Line Item
                </button>
              </div>

              {/* OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="card">
                  <h2>Spend by Category</h2>
                  {catData.length === 0 ? (
                    <p style={{ color: '#888' }}>No line items yet. Add items to see category breakdown.</p>
                  ) : catData.map(cat => {
                    const pct = cat.allocated > 0 ? Math.round(cat.spent / cat.allocated * 100) : 0;
                    const over = cat.spent > cat.allocated;
                    return (
                      <div key={cat.category} style={{ marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: CAT_COLORS[cat.category] || '#888' }} />
                            <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{cat.category}</span>
                            {over && <span style={{ fontSize: '0.72rem', color: '#f44336', fontWeight: 700 }}>OVER</span>}
                          </div>
                          <span style={{ fontSize: '0.82rem', color: '#888' }}>
                            {fmt(cat.spent, active.currency)} / {fmt(cat.allocated, active.currency)} ({pct}%)
                          </span>
                        </div>
                        <div style={{ background: '#eee', borderRadius: 6, height: 8 }}>
                          <div style={{ background: over ? '#f44336' : CAT_COLORS[cat.category] || '#888', borderRadius: 6, height: 8, width: `${Math.min(100,pct)}%`, transition: 'width 0.3s' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* LINE ITEMS */}
              {activeTab === 'items' && (
                <div className="card">
                  <h2>Line Items</h2>
                  {active.items.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>
                      <p>No line items yet.</p>
                      <button className="btn btn-primary" onClick={() => { setNewItem(emptyItem()); setShowAddItem(true); }}>
                        + Add First Line Item
                      </button>
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
                        <thead>
                          <tr style={{ background: '#1C2B3A', color: 'white' }}>
                            {['Category','Description','Allocated','Spent','Remaining','%','Status',''].map(h => (
                              <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {active.items.map((item, i) => {
                            const rem  = item.allocated - item.spent;
                            const pct  = item.allocated > 0 ? Math.round(item.spent/item.allocated*100) : 0;
                            const over = item.spent > item.allocated;
                            return (
                              <tr key={item.id} style={{ background: over ? '#fff5f5' : i%2===0 ? '#f8f7f4' : 'white', borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '8px 10px' }}>
                                  <span style={{ padding: '0.15rem 0.45rem', borderRadius: 6, fontSize: '0.72rem', fontWeight: 700, background: (CAT_COLORS[item.category]||'#888') + '22', color: CAT_COLORS[item.category]||'#888' }}>
                                    {item.category}
                                  </span>
                                </td>
                                <td style={{ padding: '8px 10px', maxWidth: 200 }}>
                                  <div style={{ fontWeight: 600 }}>{item.description}</div>
                                  {item.notes && <div style={{ fontSize: '0.72rem', color: '#aaa' }}>{item.notes}</div>}
                                </td>
                                <td style={{ padding: '8px 10px' }}>{fmt(item.allocated, active.currency)}</td>
                                <td style={{ padding: '8px 10px' }}>
                                  <input type="number" value={item.spent} onChange={e => updateSpent(item.id, parseFloat(e.target.value)||0)}
                                    style={{ width: 90, padding: '0.3rem', borderRadius: 4, border: '1px solid #ddd', fontSize: '0.82rem' }} />
                                </td>
                                <td style={{ padding: '8px 10px', color: rem < 0 ? '#f44336' : '#5A8A6A', fontWeight: 600 }}>
                                  {fmt(rem, active.currency)}
                                </td>
                                <td style={{ padding: '8px 10px' }}>
                                  <span style={{ color: pct > 100 ? '#f44336' : pct > 80 ? '#ff9800' : '#5A8A6A', fontWeight: 700 }}>{pct}%</span>
                                </td>
                                <td style={{ padding: '8px 10px' }}>
                                  {over
                                    ? <span style={{ color: '#f44336', fontWeight: 700, fontSize: '0.75rem' }}>⚠️ Over</span>
                                    : <span style={{ color: '#5A8A6A', fontSize: '0.75rem' }}>✅ OK</span>}
                                </td>
                                <td style={{ padding: '8px 10px' }}>
                                  <div style={{ display: 'flex', gap: '0.3rem' }}>
                                    <button onClick={() => setEditItem({ ...item })} className="btn" style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem', background: '#eee', color: '#555' }}>Edit</button>
                                    <button onClick={() => deleteItem(item.id)} className="btn" style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem', background: '#fff5f5', color: '#f44336' }}>×</button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr style={{ background: '#1C2B3A', color: 'white', fontWeight: 700 }}>
                            <td colSpan={2} style={{ padding: '8px 10px' }}>TOTAL</td>
                            <td style={{ padding: '8px 10px' }}>{fmt(totalAllocated, active.currency)}</td>
                            <td style={{ padding: '8px 10px' }}>{fmt(totalSpent, active.currency)}</td>
                            <td style={{ padding: '8px 10px', color: totalRemaining < 0 ? '#ff8a80' : '#a5d6a7' }}>{fmt(totalRemaining, active.currency)}</td>
                            <td style={{ padding: '8px 10px' }}>{Math.round(burnRate)}%</td>
                            <td colSpan={2} />
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* CHART */}
              {activeTab === 'chart' && (
                <div className="card">
                  <h2>Budget vs Actual by Category</h2>
                  {catData.length === 0 ? (
                    <p style={{ color: '#888' }}>Add line items to see chart.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart data={catData} margin={{ top: 10, right: 20, bottom: 20, left: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                        <YAxis tickFormatter={v => fmt(v, active.currency)} tick={{ fontSize: 10 }} />
                        <Tooltip formatter={(v: any) => fmt(v, active.currency)} />
                        <Legend />
                        <Bar dataKey="allocated" name="Allocated" fill="#1C2B3A" radius={[4,4,0,0]} barSize={28} />
                        <Bar dataKey="spent" name="Spent" radius={[4,4,0,0]} barSize={28}>
                          {catData.map((entry, index) => (
                            <Cell key={index} fill={entry.spent > entry.allocated ? '#f44336' : '#5A8A6A'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
