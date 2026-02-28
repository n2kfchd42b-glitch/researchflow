import React, { useState } from 'react';
import { DollarSign, Plus, Trash2, Edit2, Check, X, Download, AlertTriangle, TrendingUp } from 'lucide-react';
import { useNGO, BudgetItem } from '../context/NGOPlatformContext';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, LineChart, Line, CartesianGrid
} from 'recharts';

const CATEGORY_COLORS: Record<string, string> = {
  personnel: '#2E86C1',
  travel:    '#E67E22',
  equipment: '#8E44AD',
  supplies:  '#27AE60',
  services:  '#C0533A',
  overhead:  '#95A5A6',
  other:     '#34495E',
};

const CATEGORY_LABELS: Record<string, string> = {
  personnel: 'Personnel',
  travel:    'Travel',
  equipment: 'Equipment',
  supplies:  'Supplies',
  services:  'Services',
  overhead:  'Overhead',
  other:     'Other',
};

const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS);

const labelStyle: React.CSSProperties = { display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '0.3rem' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #E0E4E8', borderRadius: 8, fontSize: '0.875rem', color: '#1C2B3A', background: 'white', boxSizing: 'border-box' };

function getMonthKey(dateStr: string): string {
  if (!dateStr) return 'Unknown';
  const d = new Date(dateStr);
  return `${d.toLocaleString('default', { month: 'short' })} ${d.getFullYear()}`;
}

export default function BudgetTrackerPage() {
  const { state, activeProject, addBudgetItem, updateBudgetItem, deleteBudgetItem } = useNGO();

  const project = activeProject;
  const items = state.budgetItems.filter(b => b.projectId === (project?.id || ''));

  const totalBudget = project?.budgetTotal || 0;
  const totalSpent = items.reduce((s, b) => s + b.spent, 0);
  const remaining = totalBudget - totalSpent;
  const utilization = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
  const barColor = utilization >= 90 ? '#C0533A' : utilization >= 70 ? '#E67E22' : '#27AE60';

  // Spending by category
  const byCategory: Record<string, number> = {};
  items.forEach(item => {
    byCategory[item.category] = (byCategory[item.category] || 0) + item.spent;
  });
  const pieData = Object.entries(byCategory).map(([k, v]) => ({ name: CATEGORY_LABELS[k] || k, value: v, key: k }));

  // Monthly trend
  const byMonth: Record<string, Record<string, number>> = {};
  items.forEach(item => {
    const month = getMonthKey(item.date);
    if (!byMonth[month]) byMonth[month] = {};
    byMonth[month][item.category] = (byMonth[month][item.category] || 0) + item.spent;
  });
  const monthlyData: Record<string, any>[] = Object.entries(byMonth).map(([month, cats]) => ({
    month,
    ...cats,
    total: Object.values(cats).reduce((s, v) => s + v, 0),
  }));

  // Burn rate (per month)
  const start = project?.startDate ? new Date(project.startDate) : new Date();
  const end = project?.endDate ? new Date(project.endDate) : new Date();
  const elapsed = Math.max(1, (Date.now() - start.getTime()) / (1000 * 60 * 60 * 24 * 30));
  const burnRatePerMonth = Math.round(totalSpent / elapsed);
  const remaining_months = Math.max(0, (end.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30));
  const projected = totalSpent + burnRatePerMonth * remaining_months;
  const isOverpace = projected > totalBudget;

  // Filters
  const [filterCategory, setFilterCategory] = useState('');
  const [filterSite, setFilterSite] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'category'>('date');

  // Add expense form
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ category: 'personnel', description: '', spent: '', date: new Date().toISOString().split('T')[0], site: '', receipt: false, notes: '' });

  const sites = project?.sites.map(s => s.name) || [];

  function resetForm() {
    setForm({ category: 'personnel', description: '', spent: '', date: new Date().toISOString().split('T')[0], site: '', receipt: false, notes: '' });
    setEditId(null);
    setShowAdd(false);
  }

  function handleAdd() {
    if (!form.description.trim() || !form.spent) return;
    if (editId) {
      updateBudgetItem(editId, { category: form.category as any, description: form.description, spent: parseFloat(form.spent), date: form.date, site: form.site, receipt: form.receipt, notes: form.notes });
    } else {
      addBudgetItem({
        id: `bi-${Date.now()}`,
        projectId: project?.id || '',
        category: form.category as any,
        description: form.description,
        budgeted: parseFloat(form.spent),
        spent: parseFloat(form.spent),
        date: form.date,
        site: form.site,
        receipt: form.receipt,
        notes: form.notes,
      });
    }
    resetForm();
  }

  function startEdit(item: BudgetItem) {
    setForm({ category: item.category, description: item.description, spent: item.spent.toString(), date: item.date, site: item.site, receipt: item.receipt, notes: item.notes });
    setEditId(item.id);
    setShowAdd(true);
  }

  // Filter + sort
  const filtered = items
    .filter(i => !filterCategory || i.category === filterCategory)
    .filter(i => !filterSite || i.site === filterSite)
    .sort((a, b) => {
      if (sortBy === 'date') return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortBy === 'amount') return b.spent - a.spent;
      return a.category.localeCompare(b.category);
    });

  function exportCSV() {
    const headers = 'Date,Category,Description,Amount,Site,Receipt,Notes\n';
    const rows = items.map(i => `${i.date},${i.category},"${i.description}",${i.spent},${i.site || 'All'},${i.receipt ? 'Yes' : 'No'},"${i.notes}"`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'budget.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1C2B3A', margin: 0 }}>Budget Tracker</h1>
          <p style={{ color: '#6B7280', fontSize: '0.875rem', marginTop: '0.25rem' }}>{project?.name || 'No active project'}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={exportCSV} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'white', border: '1px solid #E0E4E8', borderRadius: 8, padding: '0.45rem 0.875rem', cursor: 'pointer', fontSize: '0.82rem', color: '#6B7280' }}>
            <Download size={14} /> Export CSV
          </button>
          <button style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: '#5A8A6A', color: 'white', border: 'none', borderRadius: 8, padding: '0.45rem 0.875rem', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>
            <Download size={14} /> Budget Report
          </button>
        </div>
      </div>

      {/* Overview bar */}
      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E0E4E8', padding: '1.25rem', marginBottom: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
          {[
            { label: 'Total Budget', value: `$${totalBudget.toLocaleString()}`, color: '#1C2B3A' },
            { label: 'Total Spent', value: `$${totalSpent.toLocaleString()}`, color: barColor },
            { label: 'Remaining', value: `$${remaining.toLocaleString()}`, color: remaining >= 0 ? '#27AE60' : '#C0533A' },
            { label: 'Burn Rate', value: `$${burnRatePerMonth.toLocaleString()}/mo`, color: '#6B7280' },
            { label: 'Utilization', value: `${utilization}%`, color: barColor },
          ].map(m => (
            <div key={m.label} style={{ background: '#F9FAFB', borderRadius: 10, padding: '0.875rem', border: '1px solid #E0E4E8' }}>
              <div style={{ fontSize: '0.72rem', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{m.label}</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: m.color, marginTop: '0.2rem' }}>{m.value}</div>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
          <span style={{ color: '#6B7280' }}>Budget utilization</span>
          <span style={{ fontWeight: 700, color: barColor }}>{utilization}%</span>
        </div>
        <div style={{ height: 12, borderRadius: 6, background: '#E0E4E8', overflow: 'hidden', marginBottom: '0.5rem' }}>
          <div style={{ height: '100%', width: `${Math.min(utilization, 100)}%`, background: barColor, borderRadius: 6, transition: 'width 0.5s' }} />
        </div>

        {isOverpace && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#FEF3C7', borderRadius: 8, padding: '0.6rem 0.875rem', border: '1px solid #FDE68A', fontSize: '0.82rem', color: '#92400E' }}>
            <AlertTriangle size={15} />
            <span>At current burn rate, projected spend is <strong>${Math.round(projected).toLocaleString()}</strong> — ${Math.round(projected - totalBudget).toLocaleString()} over budget</span>
          </div>
        )}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }} className="budget-chart-grid">
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E0E4E8', padding: '1.25rem' }}>
          <h3 style={{ margin: '0 0 0.75rem 0', fontWeight: 700, color: '#1C2B3A', fontSize: '0.9rem' }}>Spending by Category</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2} dataKey="value">
                  {pieData.map((entry, i) => <Cell key={i} fill={CATEGORY_COLORS[entry.key] || '#95A5A6'} />)}
                </Pie>
                <Tooltip formatter={(v: any) => `$${Number(v).toLocaleString()}`} />
                <Legend formatter={(v) => <span style={{ fontSize: '0.75rem' }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '3rem', fontSize: '0.85rem' }}>No expenses yet</div>
          )}
        </div>

        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E0E4E8', padding: '1.25rem' }}>
          <h3 style={{ margin: '0 0 0.75rem 0', fontWeight: 700, color: '#1C2B3A', fontSize: '0.9rem' }}>Monthly Spending Trend</h3>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v >= 1000 ? `${Math.round(v/1000)}k` : v}`} />
                <Tooltip formatter={(v: any) => `$${Number(v).toLocaleString()}`} />
                {ALL_CATEGORIES.filter(c => monthlyData.some(m => m[c])).map(cat => (
                  <Bar key={cat} dataKey={cat} name={CATEGORY_LABELS[cat]} stackId="a" fill={CATEGORY_COLORS[cat]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '3rem', fontSize: '0.85rem' }}>No data yet</div>
          )}
        </div>
      </div>

      {/* Expense Log */}
      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E0E4E8', padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h3 style={{ margin: 0, fontWeight: 700, color: '#1C2B3A', fontSize: '0.95rem' }}>Expense Log ({items.length})</h3>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <select style={{ ...inputStyle, width: 'auto', fontSize: '0.8rem', padding: '0.35rem 0.6rem' }} value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
              <option value="">All Categories</option>
              {ALL_CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
            </select>
            {sites.length > 0 && (
              <select style={{ ...inputStyle, width: 'auto', fontSize: '0.8rem', padding: '0.35rem 0.6rem' }} value={filterSite} onChange={e => setFilterSite(e.target.value)}>
                <option value="">All Sites</option>
                {sites.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            )}
            <select style={{ ...inputStyle, width: 'auto', fontSize: '0.8rem', padding: '0.35rem 0.6rem' }} value={sortBy} onChange={e => setSortBy(e.target.value as any)}>
              <option value="date">Sort: Date</option>
              <option value="amount">Sort: Amount</option>
              <option value="category">Sort: Category</option>
            </select>
            <button onClick={() => { setShowAdd(true); setEditId(null); setForm({ category: 'personnel', description: '', spent: '', date: new Date().toISOString().split('T')[0], site: '', receipt: false, notes: '' }); }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: '#5A8A6A', color: 'white', border: 'none', borderRadius: 8, padding: '0.4rem 0.875rem', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>
              <Plus size={13} /> Add Expense
            </button>
          </div>
        </div>

        {showAdd && (
          <div style={{ background: '#F9FAFB', border: '1px solid #E0E4E8', borderRadius: 10, padding: '1rem', marginBottom: '0.75rem' }}>
            <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#1C2B3A', marginBottom: '0.75rem' }}>{editId ? 'Edit Expense' : 'New Expense'}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.6rem', marginBottom: '0.6rem' }}>
              <div>
                <label style={labelStyle}>Category</label>
                <select style={inputStyle} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {ALL_CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={labelStyle}>Description</label>
                <input style={inputStyle} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description" />
              </div>
              <div>
                <label style={labelStyle}>Amount ($)</label>
                <input type="number" style={inputStyle} value={form.spent} onChange={e => setForm(f => ({ ...f, spent: e.target.value }))} placeholder="0.00" min="0" step="0.01" />
              </div>
              <div>
                <label style={labelStyle}>Date</label>
                <input type="date" style={inputStyle} value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Site</label>
                <select style={inputStyle} value={form.site} onChange={e => setForm(f => ({ ...f, site: e.target.value }))}>
                  <option value="">All Sites</option>
                  {sites.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Notes</label>
                <input style={inputStyle} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes" />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.receipt} onChange={e => setForm(f => ({ ...f, receipt: e.target.checked }))} /> Receipt attached
              </label>
              <button onClick={handleAdd} disabled={!form.description.trim() || !form.spent} style={{ background: '#5A8A6A', color: 'white', border: 'none', borderRadius: 8, padding: '0.45rem 1rem', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>
                {editId ? 'Update' : 'Add'}
              </button>
              <button onClick={resetForm} style={{ background: 'none', border: '1px solid #E0E4E8', borderRadius: 8, padding: '0.45rem 0.75rem', cursor: 'pointer', fontSize: '0.82rem', color: '#6B7280' }}>Cancel</button>
            </div>
          </div>
        )}

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '2.5rem', border: '1px dashed #E0E4E8', borderRadius: 10 }}>
            {items.length === 0 ? 'No expenses recorded yet. Click "Add Expense" to get started.' : 'No expenses match the selected filters.'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
              <thead>
                <tr style={{ background: '#F9FAFB' }}>
                  {['Date', 'Category', 'Description', 'Amount', 'Site', 'Receipt', 'Notes', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '0.6rem 0.75rem', textAlign: 'left', fontWeight: 600, color: '#6B7280', fontSize: '0.75rem', borderBottom: '1px solid #E0E4E8', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, idx) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #F3F4F6', background: idx % 2 === 0 ? 'white' : '#FAFAFA' }}>
                    <td style={{ padding: '0.6rem 0.75rem', color: '#6B7280', whiteSpace: 'nowrap' }}>{item.date}</td>
                    <td style={{ padding: '0.6rem 0.75rem' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', fontWeight: 600 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: CATEGORY_COLORS[item.category] || '#95A5A6', display: 'inline-block' }} />
                        {CATEGORY_LABELS[item.category] || item.category}
                      </span>
                    </td>
                    <td style={{ padding: '0.6rem 0.75rem', color: '#1C2B3A', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.description}</td>
                    <td style={{ padding: '0.6rem 0.75rem', fontWeight: 700, color: '#1C2B3A', whiteSpace: 'nowrap' }}>${item.spent.toLocaleString()}</td>
                    <td style={{ padding: '0.6rem 0.75rem', color: '#6B7280' }}>{item.site || 'All'}</td>
                    <td style={{ padding: '0.6rem 0.75rem' }}>
                      {item.receipt ? <Check size={14} color="#27AE60" /> : <X size={14} color="#D1D5DB" />}
                    </td>
                    <td style={{ padding: '0.6rem 0.75rem', color: '#9CA3AF', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.75rem' }}>{item.notes || '—'}</td>
                    <td style={{ padding: '0.6rem 0.75rem' }}>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button onClick={() => startEdit(item)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: '0.15rem' }}><Edit2 size={13} /></button>
                        <button onClick={() => deleteBudgetItem(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C0533A', padding: '0.15rem' }}><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                <tr style={{ background: '#F9FAFB', fontWeight: 700 }}>
                  <td colSpan={3} style={{ padding: '0.6rem 0.75rem', color: '#1C2B3A' }}>Total ({filtered.length} items)</td>
                  <td style={{ padding: '0.6rem 0.75rem', color: barColor }}>${filtered.reduce((s, i) => s + i.spent, 0).toLocaleString()}</td>
                  <td colSpan={4} />
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Budget Alerts */}
      {items.length > 0 && (
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E0E4E8', padding: '1.25rem', marginTop: '1rem' }}>
          <h3 style={{ margin: '0 0 0.75rem 0', fontWeight: 700, color: '#1C2B3A', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <AlertTriangle size={16} color="#E67E22" /> Budget Alerts
          </h3>
          {utilization >= 90 && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', padding: '0.6rem 0.875rem', background: '#FEE2E2', borderRadius: 8, borderLeft: '4px solid #C0533A', marginBottom: '0.5rem', fontSize: '0.82rem', color: '#991B1B' }}>
              <AlertTriangle size={14} /> <span><b>Critical:</b> Budget utilization is at {utilization}% — review spending immediately.</span>
            </div>
          )}
          {utilization >= 70 && utilization < 90 && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', padding: '0.6rem 0.875rem', background: '#FEF3C7', borderRadius: 8, borderLeft: '4px solid #E67E22', marginBottom: '0.5rem', fontSize: '0.82rem', color: '#92400E' }}>
              <AlertTriangle size={14} /> <span><b>Warning:</b> Budget utilization is at {utilization}% — monitor closely.</span>
            </div>
          )}
          {isOverpace && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', padding: '0.6rem 0.875rem', background: '#FEF3C7', borderRadius: 8, borderLeft: '4px solid #E67E22', marginBottom: '0.5rem', fontSize: '0.82rem', color: '#92400E' }}>
              <TrendingUp size={14} /> <span><b>Burn Rate:</b> At ${ burnRatePerMonth.toLocaleString()}/month, projected total spend exceeds budget by ${Math.round(projected - totalBudget).toLocaleString()}.</span>
            </div>
          )}
          {utilization < 70 && !isOverpace && (
            <div style={{ fontSize: '0.82rem', color: '#6B7280' }}>No budget alerts at this time. All spending within expected range.</div>
          )}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) { .budget-chart-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}
