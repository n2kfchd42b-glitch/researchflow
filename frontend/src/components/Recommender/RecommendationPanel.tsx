import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_URL } from '../../config';
import { useStudyStore } from '../../store/studyStore';
import DescriptiveStatsCard from './DescriptiveStatsCard';
import AIRecommendationCard, { AIRecommendation } from './AIRecommendationCard';
import RecommendationSkeleton from './RecommendationSkeleton';

const API_BASE = API_URL ?? '';

interface AIResponse {
  summary: string;
  recommendations: AIRecommendation[];
  missing_data_note: string | null;
  sample_size_note: string | null;
  _fallback?: boolean;
}

interface Props {
  datasetId: string;
  datasetNRows?: number;
  datasetNCols?: number;
  potentialConfounders?: string[];
}

// Simple in-memory cache keyed by dataset_id
const responseCache: Record<string, AIResponse> = {};

export default function RecommendationPanel({
  datasetId,
  datasetNRows = 0,
  datasetNCols = 0,
  potentialConfounders = [],
}: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    researchQuestion,
    exposureVariable,
    outcomeVariable,
    studyDesign,
  } = useStudyStore();

  const context = location.pathname.startsWith('/ngo') ? 'ngo' : 'student';
  const setupPath = context === 'ngo' ? '/ngo' : '/student/setup';

  const [aiResult, setAiResult]   = useState<AIResponse | null>(responseCache[datasetId] ?? null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const fetchedRef                = useRef(false);

  const hasSetup =
    researchQuestion.trim().length > 0 &&
    exposureVariable !== null &&
    outcomeVariable !== null &&
    studyDesign.trim().length > 0;

  useEffect(() => {
    if (!hasSetup || !datasetId) return;
    if (responseCache[datasetId]) {
      setAiResult(responseCache[datasetId]);
      return;
    }
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    setLoading(true);
    setError('');

    const body = {
      dataset_id: datasetId,
      research_question: researchQuestion,
      exposure_variable: { name: exposureVariable!.name, type: exposureVariable!.type },
      outcome_variable: { name: outcomeVariable!.name, type: outcomeVariable!.type },
      study_design: studyDesign,
      dataset_summary: {
        n_rows: datasetNRows,
        n_columns: datasetNCols,
        has_missing_data: false,
        potential_confounders: potentialConfounders,
      },
    };

    fetch(`${API_BASE}/api/analysis-recommender/suggest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then((r) => { if (!r.ok) throw new Error(`Server error ${r.status}`); return r.json(); })
      .then((data: AIResponse) => {
        responseCache[datasetId] = data;
        setAiResult(data);
      })
      .catch((e) => { setError(e.message); })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datasetId, hasSetup]);

  return (
    <div>
      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1C2B3A', marginBottom: '0.75rem' }}>
        Recommended Analyses
      </h3>

      {/* LAYER 1 — Always visible Descriptive Statistics card */}
      <DescriptiveStatsCard />

      {/* LAYER 2 — AI-powered recommendations */}
      {!hasSetup ? (
        <div style={{
          background: '#F8F9FA',
          border: '1px dashed #C5D0DC',
          borderRadius: 12,
          padding: '1.25rem',
          textAlign: 'center',
        }}>
          <p style={{ color: '#555', fontSize: '0.88rem', marginBottom: '0.75rem' }}>
            Complete your study setup to unlock AI-powered analysis recommendations.
          </p>
          <button
            onClick={() => navigate(setupPath)}
            style={{
              background: '#1C2B3A', color: 'white', border: 'none',
              borderRadius: 8, padding: '0.5rem 1.25rem',
              fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
            }}
          >
            Go to Study Setup →
          </button>
        </div>
      ) : loading ? (
        <RecommendationSkeleton />
      ) : error ? (
        <div style={{ background: '#FEF3F3', border: '1px solid #FADBD8', borderRadius: 10, padding: '1rem' }}>
          <p style={{ color: '#922B21', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 600 }}>
            AI recommendations unavailable. Showing standard recommendations based on your variable types.
          </p>
        </div>
      ) : aiResult ? (
        <div>
          {/* Notes banners */}
          {aiResult.sample_size_note && (
            <div style={bannerStyle('info')}>ℹ {aiResult.sample_size_note}</div>
          )}
          {aiResult.missing_data_note && (
            <div style={bannerStyle('warning')}>⚠ {aiResult.missing_data_note}</div>
          )}
          {aiResult._fallback && (
            <div style={bannerStyle('warning')}>
              ⚠ AI recommendations temporarily unavailable. Showing rule-based suggestions.
            </div>
          )}

          {/* Summary */}
          {aiResult.summary && (
            <p style={{ fontSize: '0.88rem', color: '#555', marginBottom: '0.75rem', lineHeight: 1.5, fontStyle: 'italic' }}>
              {aiResult.summary}
            </p>
          )}

          {/* Recommendation cards */}
          {aiResult.recommendations.map((rec, i) => (
            <AIRecommendationCard key={`${rec.feature_key}-${i}`} rec={rec} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function bannerStyle(type: 'info' | 'warning'): React.CSSProperties {
  return {
    background: type === 'warning' ? '#FEF9E7' : '#EBF5FB',
    border: `1px solid ${type === 'warning' ? '#FAD7A0' : '#AED6F1'}`,
    borderRadius: 8,
    padding: '0.5rem 0.85rem',
    fontSize: '0.8rem',
    color: type === 'warning' ? '#9A7D0A' : '#1A5276',
    marginBottom: '0.6rem',
  };
}
