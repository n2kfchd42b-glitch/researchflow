import React, { useState, useRef } from 'react';

type PRISMAData = {
  db1_name: string; db1_records: number;
  db2_name: string; db2_records: number;
  db3_name: string; db3_records: number;
  db4_name: string; db4_records: number;
  other_sources: number; other_desc: string;
  duplicates: number;
  screened: number; excluded_title: number;
  fulltext: number; excluded_ft: number;
  excluded_reasons: string;
  included: number; quant_synthesis: number;
  review_title: string; review_date: string;
};

function emptyData(): PRISMAData {
  return {
    db1_name: 'PubMed', db1_records: 0,
    db2_name: 'Embase', db2_records: 0,
    db3_name: 'Cochrane', db3_records: 0,
    db4_name: 'Web of Science', db4_records: 0,
    other_sources: 0, other_desc: 'Grey literature, reference lists',
    duplicates: 0, screened: 0, excluded_title: 0,
    fulltext: 0, excluded_ft: 0,
    excluded_reasons: 'Wrong population: n=\nWrong intervention: n=\nWrong outcome: n=\nWrong study design: n=',
    included: 0, quant_synthesis: 0,
    review_title: 'Systematic Review Title',
    review_date: new Date().toLocaleDateString(),
  };
}

export default function PRISMADiagram() {
  const [data, setData]           = useState<PRISMAData>(emptyData());
  const [activeTab, setActiveTab] = useState('form');
  const [copied, setCopied]       = useState(false);
  const svgRef                    = useRef<SVGSVGElement>(null);

  function update(field: keyof PRISMAData, value: string | number) {
    setData(prev => ({ ...prev, [field]: value }));
  }

  const totalRecords = data.db1_records + data.db2_records + data.db3_records + data.db4_records;
  const afterDedupe  = totalRecords - data.duplicates;
  const reasons      = data.excluded_reasons.split('\n').filter(Boolean);

  const methodsText = `A systematic literature search was conducted in ${[data.db1_name, data.db2_name, data.db3_name, data.db4_name].filter(Boolean).join(', ')} on ${data.review_date}. The search identified ${totalRecords.toLocaleString()} records. After removal of ${data.duplicates.toLocaleString()} duplicates, ${afterDedupe.toLocaleString()} records were screened by title and abstract, of which ${data.excluded_title.toLocaleString()} were excluded. ${data.fulltext.toLocaleString()} full-text articles were assessed for eligibility. ${data.excluded_ft.toLocaleString()} articles were excluded${reasons.length > 0 ? ' for the following reasons: ' + reasons.join('; ') : ''}. A total of ${data.included.toLocaleString()} studies were included in the systematic review${data.quant_synthesis > 0 ? `, of which ${data.quant_synthesis.toLocaleString()} were included in the quantitative synthesis (meta-analysis)` : ''}.`;

  function downloadSVG() {
    if (!svgRef.current) return;
    const blob = new Blob([svgRef.current.outerHTML], { type: 'image/svg+xml' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'PRISMA_flow_diagram.svg'; a.click();
  }

  const W = 680; const H = 820;
  const BW = 190; const BH = 50;
  const SW = 175; const SH = 44;
  const cx = W / 2;

  function rect(x: number, y: number, w: number, h: number, fill: string, stroke: string) {
    return <rect x={x} y={y} width={w} height={h} fill={fill} stroke={stroke} strokeWidth={1.5} rx={4} />;
  }

  function txt(x: number, y: number, w: number, h: number, lines: string[], size = 9, bold = false, color = '#1C2B3A') {
    const lh = size + 3;
    const sy = y + h / 2 - ((lines.length - 1) * lh) / 2;
    return lines.map((line, i) => (
      <text key={i} x={x + w / 2} y={sy + i * lh} textAnchor="middle" dominantBaseline="middle"
        fontSize={size} fontWeight={bold ? 700 : 400} fill={color} fontFamily="Arial, sans-serif">
        {line}
      </text>
    ));
  }

  function arrow(x1: number, y1: number, x2: number, y2: number) {
    const dx = x2-x1, dy = y2-y1, len = Math.sqrt(dx*dx+dy*dy);
    const ux = dx/len, uy = dy/len;
    const ax = x2 - ux*8, ay = y2 - uy*8;
    return (
      <g>
        <line x1={x1} y1={y1} x2={ax} y2={ay} stroke="#555" strokeWidth={1.5}/>
        <polygon points={`${x2},${y2} ${ax-uy*4},${ay+ux*4} ${ax+uy*4},${ay-ux*4}`} fill="#555"/>
      </g>
    );
  }

  const Y1=55, Y2=145, Y3=240, Y4=330, Y5=425, Y6=520, Y7=630;
  const mainX = 65;
  const sideX = cx + 15;

  const dbList = [
    { name: data.db1_name, n: data.db1_records },
    { name: data.db2_name, n: data.db2_records },
    { name: data.db3_name, n: data.db3_records },
    { name: data.db4_name, n: data.db4_records },
  ].filter(d => d.n > 0);

  const dbBoxH = Math.max(BH, BH + (dbList.length > 2 ? (dbList.length - 2) * 12 : 0));

  return (
    <div className="page">
      <h1 style={{ color: '#1C2B3A' }}>PRISMA Flow Diagram</h1>
      <p style={{ marginBottom: '1.5rem' }}>
        Generate a PRISMA 2020 compliant flow diagram for your systematic review or meta-analysis.
      </p>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {[
          { id: 'form',    label: '📝 Enter Data'   },
          { id: 'diagram', label: '🖼️ Flow Diagram'  },
          { id: 'methods', label: '📄 Methods Text'  },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className="btn" style={{
            background: activeTab === tab.id ? '#1C2B3A' : '#eee',
            color:      activeTab === tab.id ? 'white'   : '#444',
            padding: '0.5rem 1.25rem',
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'form' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div>
            <div className="card" style={{ marginBottom: '1rem' }}>
              <h2>Review Details</h2>
              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#888', display: 'block', marginBottom: 4 }}>REVIEW TITLE</label>
                <input value={data.review_title} onChange={e => update('review_title', e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.88rem' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#888', display: 'block', marginBottom: 4 }}>SEARCH DATE</label>
                <input value={data.review_date} onChange={e => update('review_date', e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.88rem' }} />
              </div>
            </div>

            <div className="card" style={{ marginBottom: '1rem' }}>
              <h2>📚 Database Records</h2>
              {[
                { nk: 'db1_name', vk: 'db1_records' },
                { nk: 'db2_name', vk: 'db2_records' },
                { nk: 'db3_name', vk: 'db3_records' },
                { nk: 'db4_name', vk: 'db4_records' },
              ].map((db, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input value={(data as any)[db.nk]} onChange={e => update(db.nk as keyof PRISMAData, e.target.value)}
                    placeholder="Database"
                    style={{ flex: 2, padding: '0.5rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.85rem' }} />
                  <input type="number" value={(data as any)[db.vk]} onChange={e => update(db.vk as keyof PRISMAData, parseInt(e.target.value)||0)}
                    placeholder="n"
                    style={{ flex: 1, padding: '0.5rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.85rem' }} />
                </div>
              ))}
              <div style={{ padding: '0.5rem 0.75rem', background: '#dbeafe', borderRadius: 6, fontSize: '0.85rem', fontWeight: 700 }}>
                Total: {totalRecords.toLocaleString()} records
              </div>
            </div>

            <div className="card">
              <h2>📁 Other Sources</h2>
              <input type="number" value={data.other_sources} onChange={e => update('other_sources', parseInt(e.target.value)||0)}
                style={{ width: '100%', padding: '0.6rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.88rem', marginBottom: '0.5rem' }} />
              <input value={data.other_desc} onChange={e => update('other_desc', e.target.value)}
                placeholder="e.g. Grey literature, reference lists"
                style={{ width: '100%', padding: '0.6rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.88rem' }} />
            </div>
          </div>

          <div>
            <div className="card" style={{ marginBottom: '1rem' }}>
              <h2>🔄 Deduplication and Screening</h2>
              {[
                { label: 'Duplicates removed',                key: 'duplicates',     hint: '' },
                { label: 'Records screened (title/abstract)', key: 'screened',       hint: `suggested: ${afterDedupe}` },
                { label: 'Excluded (title/abstract)',         key: 'excluded_title', hint: '' },
              ].map(item => (
                <div key={item.key} style={{ marginBottom: '0.75rem' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#888', display: 'block', marginBottom: 4 }}>
                    {item.label} {item.hint && <span style={{ color: '#aaa', fontWeight: 400 }}>({item.hint})</span>}
                  </label>
                  <input type="number" value={(data as any)[item.key]}
                    onChange={e => update(item.key as keyof PRISMAData, parseInt(e.target.value)||0)}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.88rem' }} />
                </div>
              ))}
            </div>

            <div className="card" style={{ marginBottom: '1rem' }}>
              <h2>📋 Eligibility</h2>
              {[
                { label: 'Full texts retrieved',  key: 'fulltext'    },
                { label: 'Full texts excluded',   key: 'excluded_ft' },
              ].map(item => (
                <div key={item.key} style={{ marginBottom: '0.75rem' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#888', display: 'block', marginBottom: 4 }}>{item.label}</label>
                  <input type="number" value={(data as any)[item.key]}
                    onChange={e => update(item.key as keyof PRISMAData, parseInt(e.target.value)||0)}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.88rem' }} />
                </div>
              ))}
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#888', display: 'block', marginBottom: 4 }}>REASONS FOR EXCLUSION (one per line)</label>
              <textarea value={data.excluded_reasons} onChange={e => update('excluded_reasons', e.target.value)}
                style={{ width: '100%', padding: '0.6rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.82rem', minHeight: 100 }} />
            </div>

            <div className="card">
              <h2>✅ Included</h2>
              {[
                { label: 'Studies included in review',             key: 'included'        },
                { label: 'Studies in meta-analysis (optional)',    key: 'quant_synthesis' },
              ].map(item => (
                <div key={item.key} style={{ marginBottom: '0.75rem' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#888', display: 'block', marginBottom: 4 }}>{item.label}</label>
                  <input type="number" value={(data as any)[item.key]}
                    onChange={e => update(item.key as keyof PRISMAData, parseInt(e.target.value)||0)}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.88rem' }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'diagram' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button className="btn btn-primary" onClick={downloadSVG}>⬇️ Download SVG</button>
          </div>
          <div className="card" style={{ background: 'white', overflowX: 'auto' }}>
            <svg ref={svgRef} width={W} height={H} viewBox={`0 0 ${W} ${H}`}
              style={{ maxWidth: '100%', display: 'block', margin: '0 auto' }}>

              {/* TITLE */}
              <text x={W/2} y={20} textAnchor="middle" fontSize={13} fontWeight={700} fill="#1C2B3A" fontFamily="Arial">
                PRISMA 2020 Flow Diagram
              </text>
              <text x={W/2} y={34} textAnchor="middle" fontSize={8} fill="#888" fontFamily="Arial">
                {data.review_title} · {data.review_date}
              </text>

              {/* SECTION LABELS */}
              {[
                { label: ['IDENTI-','FICATION'], y: Y1 },
                { label: ['SCREEN-','ING'],      y: Y3 },
                { label: ['ELIGI-','BILITY'],    y: Y5 },
                { label: ['INCLUD-','ED'],        y: Y6 },
              ].map((s, i) => (
                <g key={i}>
                  <rect x={4} y={s.y} width={46} height={BH} fill="#1C2B3A" rx={3}/>
                  {s.label.map((l, j) => (
                    <text key={j} x={27} y={s.y + BH/2 - 6 + j*13}
                      textAnchor="middle" dominantBaseline="middle"
                      fontSize={7} fontWeight={700} fill="white" fontFamily="Arial">{l}</text>
                  ))}
                </g>
              ))}

              {/* ROW 1: Databases */}
              {rect(mainX, Y1, BW, dbBoxH, '#dbeafe', '#2196f3')}
              {txt(mainX, Y1, BW, BH, ['Records from databases', `(n = ${totalRecords.toLocaleString()})`])}
              {dbList.map((db, i) => (
                <text key={i} x={mainX + BW/2} y={Y1 + BH + 6 + i*12}
                  textAnchor="middle" fontSize={8} fill="#555" fontFamily="Arial">
                  {db.name}: n = {db.n.toLocaleString()}
                </text>
              ))}

              {rect(sideX, Y1, SW, BH, '#dbeafe', '#2196f3')}
              {txt(sideX, Y1, SW, BH, ['Other sources', `(n = ${data.other_sources.toLocaleString()})`])}

              {/* ARROWS from both boxes to dedup */}
              {arrow(mainX + BW/2, Y1 + dbBoxH, mainX + BW/2, Y2 - 2)}

              {/* ROW 2: After dedup */}
              {rect(mainX, Y2, BW, BH, '#e0f2fe', '#0284c7')}
              {txt(mainX, Y2, BW, BH, ['Records after duplicates removed', `(n = ${afterDedupe.toLocaleString()})`])}
              {rect(sideX, Y2, SW, SH, '#fee2e2', '#f44336')}
              {txt(sideX, Y2, SW, SH, ['Duplicates removed', `(n = ${data.duplicates.toLocaleString()})`], 9, false, '#b91c1c')}
              {arrow(mainX + BW, Y2 + SH/2, sideX, Y2 + SH/2)}

              {/* ROW 3: Screened */}
              {arrow(mainX + BW/2, Y2 + BH, mainX + BW/2, Y3 - 2)}
              {rect(mainX, Y3, BW, BH, '#ecfdf5', '#5A8A6A')}
              {txt(mainX, Y3, BW, BH, ['Records screened', `(n = ${data.screened.toLocaleString()})`])}
              {rect(sideX, Y3, SW, SH, '#fee2e2', '#f44336')}
              {txt(sideX, Y3, SW, SH, ['Excluded (title/abstract)', `(n = ${data.excluded_title.toLocaleString()})`], 9, false, '#b91c1c')}
              {arrow(mainX + BW, Y3 + SH/2, sideX, Y3 + SH/2)}

              {/* ROW 4: Full texts */}
              {arrow(mainX + BW/2, Y3 + BH, mainX + BW/2, Y4 - 2)}
              {rect(mainX, Y4, BW, BH, '#ecfdf5', '#5A8A6A')}
              {txt(mainX, Y4, BW, BH, ['Full texts retrieved', `(n = ${data.fulltext.toLocaleString()})`])}

              {/* ROW 5: Eligibility */}
              {arrow(mainX + BW/2, Y4 + BH, mainX + BW/2, Y5 - 2)}
              {rect(mainX, Y5, BW, BH, '#ecfdf5', '#5A8A6A')}
              {txt(mainX, Y5, BW, BH, ['Full texts assessed for eligibility', `(n = ${data.fulltext.toLocaleString()})`])}
              {(() => {
                const excH = Math.max(SH, 28 + reasons.length * 13);
                return (
                  <g>
                    {rect(sideX, Y5 - 10, SW, excH, '#fee2e2', '#f44336')}
                    <text x={sideX + SW/2} y={Y5 + 4} textAnchor="middle" fontSize={9} fontWeight={700} fill="#b91c1c" fontFamily="Arial">
                      Excluded (n = {data.excluded_ft})
                    </text>
                    {reasons.slice(0, 5).map((r, i) => (
                      <text key={i} x={sideX + 6} y={Y5 + 18 + i*13} fontSize={7.5} fill="#b91c1c" fontFamily="Arial">
                        {r.length > 30 ? r.substring(0, 30) + '…' : r}
                      </text>
                    ))}
                  </g>
                );
              })()}
              {arrow(mainX + BW, Y5 + BH/2, sideX, Y5 + BH/2)}

              {/* ROW 6: Included */}
              {arrow(mainX + BW/2, Y5 + BH, mainX + BW/2, Y6 - 2)}
              {rect(mainX, Y6, BW, BH, '#d1fae5', '#059669')}
              {txt(mainX, Y6, BW, BH, ['Studies included', `in systematic review`, `(n = ${data.included.toLocaleString()})`], 9, true, '#065f46')}

              {/* ROW 7: Meta-analysis (optional) */}
              {data.quant_synthesis > 0 && (
                <g>
                  {arrow(mainX + BW/2, Y6 + BH, mainX + BW/2, Y7 - 2)}
                  {rect(mainX, Y7, BW, BH, '#bbf7d0', '#059669')}
                  {txt(mainX, Y7, BW, BH, ['Quantitative synthesis', `(meta-analysis)`, `(n = ${data.quant_synthesis.toLocaleString()})`], 9, true, '#065f46')}
                </g>
              )}

              {/* Footer */}
              <text x={W/2} y={H - 8} textAnchor="middle" fontSize={7.5} fill="#aaa" fontFamily="Arial">
                Generated by ResearchFlow · PRISMA 2020 · Page et al. BMJ 2021;372:n71
              </text>
            </svg>
          </div>
        </div>
      )}

      {activeTab === 'methods' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2>Methods Text</h2>
            <button className="btn btn-sage" onClick={() => { navigator.clipboard.writeText(methodsText); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
              {copied ? '✓ Copied!' : '📋 Copy'}
            </button>
          </div>
          <div style={{ background: '#f8f7f4', borderRadius: 8, padding: '1.25rem', fontSize: '0.9rem', lineHeight: 1.8, color: '#333' }}>
            {methodsText}
          </div>
          <div className="alert alert-success" style={{ marginTop: '1rem', fontSize: '0.82rem' }}>
            <strong>Cite as:</strong> Page MJ, et al. The PRISMA 2020 statement: an updated guideline for reporting systematic reviews. BMJ. 2021;372:n71. doi:10.1136/bmj.n71
          </div>
        </div>
      )}
    </div>
  );
}
