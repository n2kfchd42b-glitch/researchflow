import React, { useState } from 'react';
import { MessageCircle, BarChart3, GraduationCap, AlertTriangle, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import { AnalysisInterpretation } from '../context/StudentWizardContext';

interface InterpretationCardProps {
  interpretation: AnalysisInterpretation;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
      }}
      style={{
        padding: '0.3rem 0.75rem',
        background: 'white',
        color: '#7D3C98',
        border: '1px solid #C39BD3',
        borderRadius: 6,
        fontSize: '0.75rem',
        cursor: 'pointer',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: '0.3rem',
        marginTop: '0.5rem',
      }}
    >
      {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy to clipboard</>}
    </button>
  );
}

function EffectArrow({ direction }: { direction: AnalysisInterpretation['effectDirection'] }) {
  if (direction === 'positive') return <span style={{ color: '#27AE60', fontWeight: 700, fontSize: '1.1rem' }}>↑</span>;
  if (direction === 'negative') return <span style={{ color: '#E74C3C', fontWeight: 700, fontSize: '1.1rem' }}>↓</span>;
  if (direction === 'null') return <span style={{ color: '#888', fontWeight: 700, fontSize: '1.1rem' }}>↔</span>;
  return <span style={{ color: '#888', fontWeight: 700, fontSize: '1.1rem' }}>?</span>;
}

export default function InterpretationCard({ interpretation }: InterpretationCardProps) {
  const [showStats, setShowStats] = useState(false);
  const [showAcademic, setShowAcademic] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem' }}>
      {/* Layer 1: Plain Language */}
      <div style={{ background: '#E9F7EF', borderRadius: 8, padding: '0.875rem 1rem', border: '1px solid #A9DFBF' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
          <MessageCircle size={15} color="#1E8449" />
          <span style={{ fontWeight: 700, color: '#1E8449', fontSize: '0.82rem' }}>What does this mean?</span>
          <EffectArrow direction={interpretation.effectDirection} />
        </div>
        <p style={{ margin: 0, fontSize: '0.85rem', color: '#1E5631', lineHeight: 1.6 }}>
          {interpretation.plainLanguage}
        </p>
      </div>

      {/* Layer 2: Statistical Summary */}
      <div style={{ background: '#EBF5FB', borderRadius: 8, border: '1px solid #AED6F1', overflow: 'hidden' }}>
        <button
          onClick={() => setShowStats(s => !s)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.7rem 1rem',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <BarChart3 size={15} color="#1A6EA6" />
          <span style={{ fontWeight: 700, color: '#1A6EA6', fontSize: '0.82rem', flex: 1 }}>Statistical Details</span>
          {showStats ? <ChevronUp size={14} color="#1A6EA6" /> : <ChevronDown size={14} color="#1A6EA6" />}
        </button>
        {showStats && (
          <div style={{ padding: '0 1rem 0.875rem' }}>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#1A5276', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
              {interpretation.statisticalSummary}
            </p>
          </div>
        )}
      </div>

      {/* Layer 3: Academic Reporting Sentence */}
      <div style={{ background: '#F5EEF8', borderRadius: 8, border: '1px solid #C39BD3', overflow: 'hidden' }}>
        <button
          onClick={() => setShowAcademic(s => !s)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.7rem 1rem',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <GraduationCap size={15} color="#7D3C98" />
          <span style={{ fontWeight: 700, color: '#7D3C98', fontSize: '0.82rem', flex: 1 }}>Use this in your paper</span>
          {showAcademic ? <ChevronUp size={14} color="#7D3C98" /> : <ChevronDown size={14} color="#7D3C98" />}
        </button>
        {showAcademic && (
          <div style={{ padding: '0 1rem 0.875rem' }}>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#6C3483', lineHeight: 1.7, fontStyle: 'italic' }}>
              {interpretation.academicSentence}
            </p>
            <CopyButton text={interpretation.academicSentence} />
          </div>
        )}
      </div>

      {/* Warnings */}
      {interpretation.warnings.length > 0 && (
        <div style={{ background: '#FEF9E7', borderRadius: 8, padding: '0.75rem 1rem', border: '1px solid #F9E79F' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
            <AlertTriangle size={14} color="#B7950B" />
            <span style={{ fontWeight: 700, color: '#B7950B', fontSize: '0.8rem' }}>Points to consider</span>
          </div>
          <ul style={{ margin: 0, padding: '0 0 0 1rem', fontSize: '0.82rem', color: '#7D6608', lineHeight: 1.6 }}>
            {interpretation.warnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
