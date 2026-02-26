import React, { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';

const SUGGESTED_QUESTIONS = [
  "What statistical test should I use for my binary outcome?",
  "How do I interpret a p-value of 0.03?",
  "What is propensity score matching and when should I use it?",
  "How do I report odds ratios in my paper?",
  "What does I² mean in a meta-analysis?",
  "How do I check if my data is normally distributed?",
  "What sample size do I need for a cohort study?",
  "How do I write a methods section for a retrospective cohort study?",
  "What is the difference between fixed and random effects models?",
  "How do I handle missing data in my analysis?",
];

const SYSTEM_PROMPT = `You are a friendly and expert research statistics assistant specialising in global health research in low and middle income countries (LMICs), particularly sub-Saharan Africa. 

You help researchers with:
- Statistical analysis (logistic regression, survival analysis, propensity score matching, meta-analysis)
- Study design (cohort studies, RCTs, case-control, cross-sectional)
- Data interpretation (p-values, confidence intervals, effect sizes)
- Writing methods and results sections
- Reporting guidelines (CONSORT, STROBE)
- Global health surveys (DHS, MICS, WHO STEPS)
- Software guidance (STATA, R, SPSS, ResearchFlow)

Keep responses concise, practical and jargon-free. When relevant, give examples from global health contexts. Always encourage good scientific practice. If asked about a specific dataset or analysis, be specific and actionable.`;

type Message = {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
};

export default function AIAssistant() {
  const [messages, setMessages]     = useState<Message[]>([]);
  const [input, setInput]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [datasetContext, setDatasetContext] = useState('');
  const bottomRef                    = useRef<HTMLDivElement>(null);
  const inputRef                     = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    setMessages([{
      role: 'assistant',
      content: `Hello! I'm your AI Research Assistant, specialising in global health statistics. 

I can help you with:
- **Choosing the right statistical test** for your study
- **Interpreting results** (p-values, confidence intervals, effect sizes)
- **Writing methods and results** sections
- **Study design** and sample size questions
- **Reporting guidelines** (CONSORT, STROBE, PRISMA)

You can upload your dataset for context-specific advice, or just ask me any research question. What would you like help with today?`,
      timestamp: new Date().toISOString(),
    }]);
  }, []);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await api.upload(file);
      setUploadResult(data);
      const cols = Object.entries(data.column_types || {})
        .map(([col, type]) => `${col} (${type})`)
        .join(', ');
      const ctx = `The researcher has uploaded a dataset called "${data.filename}" with ${data.rows} rows and ${data.columns} columns. Variables include: ${cols}. Missing data: ${data.missing_percentage}%.`;
      setDatasetContext(ctx);
      addMessage('assistant', `I've loaded your dataset **${data.filename}** (${data.rows} rows, ${data.columns} columns). I can now give you specific advice about your data. What would you like to know?`);
    } catch (err) {
      addMessage('assistant', 'I had trouble loading that file. Please try again or ask your question without uploading.');
    }
  }

  function addMessage(role: 'user' | 'assistant', content: string) {
    setMessages((prev: Message[]) => [...prev, { role, content, timestamp: new Date().toISOString() }]);
  }

  async function sendMessage(text?: string) {
    const userMessage = text || input.trim();
    if (!userMessage || loading) return;
    setInput('');
    addMessage('user', userMessage);
    setLoading(true);

    try {
      const systemWithContext = datasetContext
        ? `${SYSTEM_PROMPT}\n\nContext about the researcher's dataset: ${datasetContext}`
        : SYSTEM_PROMPT;

      const apiMessages = messages
        .filter((m: Message) => m.role !== 'assistant' || messages.indexOf(m) > 0)
        .concat([{ role: 'user' as const, content: userMessage, timestamp: '' }])
        .map((m: Message) => ({ role: m.role, content: m.content }));

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model:      'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system:     systemWithContext,
          messages:   apiMessages,
        }),
      });

      const data = await response.json();
      const reply = data.content?.[0]?.text || 'Sorry, I could not generate a response. Please try again.';
      addMessage('assistant', reply);
    } catch (err) {
      addMessage('assistant', 'I encountered an error. Please check your connection and try again.');
    }
    setLoading(false);
    inputRef.current?.focus();
  }

  function formatMessage(content: string) {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>');
  }

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h1 style={{ color: '#1C2B3A', marginBottom: 0 }}>AI Research Assistant</h1>
          <p style={{ marginBottom: 0, fontSize: '0.88rem', color: '#888' }}>
            Powered by Claude — ask anything about statistics, study design or writing your paper
          </p>
        </div>
        <label className="btn btn-sage" style={{ cursor: 'pointer', fontSize: '0.85rem' }}>
          {uploadResult ? `✅ ${uploadResult.filename}` : '📂 Upload Dataset'}
          <input type="file" accept=".csv,.xlsx,.sav,.dta" onChange={handleUpload} style={{ display: 'none' }} />
        </label>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: '1rem', flex: 1, minHeight: 0 }}>

        {/* CHAT */}
        <div style={{ display: 'flex', flexDirection: 'column', background: 'white', borderRadius: 12, border: '1px solid #eee', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {messages.map((msg: Message, i: number) => (
              <div key={i} style={{ display: 'flex', gap: '0.75rem', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                {msg.role === 'assistant' && (
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#1C2B3A', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0, alignSelf: 'flex-start' }}>
                    🔬
                  </div>
                )}
                <div style={{
                  maxWidth: '75%',
                  padding: '0.875rem 1.1rem',
                  borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: msg.role === 'user' ? '#C0533A' : '#f8f7f4',
                  color: msg.role === 'user' ? 'white' : '#333',
                  fontSize: '0.9rem',
                  lineHeight: 1.6,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                }}>
                  <div dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }} />
                  <div style={{ fontSize: '0.68rem', opacity: 0.6, marginTop: '0.4rem', textAlign: msg.role === 'user' ? 'right' : 'left' }}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                {msg.role === 'user' && (
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#5A8A6A', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0, alignSelf: 'flex-start' }}>
                    👤
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#1C2B3A', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  🔬
                </div>
                <div style={{ background: '#f8f7f4', borderRadius: '18px 18px 18px 4px', padding: '0.875rem 1.1rem' }}>
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    {[0,1,2].map(i => (
                      <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#C0533A', animation: `bounce 1s ease-in-out ${i * 0.2}s infinite` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '1rem', borderTop: '1px solid #eee', background: 'white' }}>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && sendMessage()}
                placeholder="Ask anything about your research..."
                style={{ flex: 1, padding: '0.75rem 1rem', borderRadius: 24, border: '1.5px solid #eee', fontSize: '0.9rem', outline: 'none', background: '#f8f7f4' }}
              />
              <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
                style={{ width: 44, height: 44, borderRadius: '50%', background: '#C0533A', color: 'white', border: 'none', cursor: 'pointer', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: !input.trim() || loading ? 0.5 : 1 }}>
                ↑
              </button>
            </div>
          </div>
        </div>

        {/* SUGGESTED QUESTIONS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto' }}>
          <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: '0.25rem' }}>
            Suggested Questions
          </p>
          {SUGGESTED_QUESTIONS.map((q, i) => (
            <button key={i} onClick={() => sendMessage(q)}
              style={{ textAlign: 'left', padding: '0.6rem 0.8rem', borderRadius: 8, border: '1px solid #eee', background: 'white', cursor: 'pointer', fontSize: '0.78rem', color: '#444', lineHeight: 1.4, transition: 'all 0.15s' }}
              onMouseOver={(e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.borderColor = '#C0533A'; e.currentTarget.style.color = '#C0533A'; }}
              onMouseOut={(e: React.MouseEvent<HTMLButtonElement>)  => { e.currentTarget.style.borderColor = '#eee';    e.currentTarget.style.color = '#444'; }}
            >
              {q}
            </button>
          ))}
          <div className="card" style={{ marginTop: '0.5rem', padding: '0.75rem', background: '#fff5f3' }}>
            <p style={{ fontSize: '0.75rem', color: '#C0533A', fontWeight: 700, marginBottom: 4 }}>💡 Pro Tip</p>
            <p style={{ fontSize: '0.72rem', color: '#888', marginBottom: 0, lineHeight: 1.5 }}>
              Upload your dataset first for context-specific statistical advice tailored to your variables.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}
