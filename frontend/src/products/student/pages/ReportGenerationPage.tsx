import React, { useState, useRef } from 'react';
import { Download, Copy, CheckCircle, FileText, RefreshCw } from 'lucide-react';
import { useStudentWizard } from '../context/StudentWizardContext';
import '../student.css';

// ─── Syntax generation ────────────────────────────────────────────────────────

function generateStata(studyType: string, outcome: string, exposure: string): string {
  return `* ResearchFlow — Generated Stata Syntax
* Study type: ${studyType}
* Generated: ${new Date().toLocaleDateString()}

use "data.dta", clear

* Table 1 — Descriptive statistics
tabstat ${outcome} ${exposure}, stats(n mean sd min max) by(${exposure})

* Regression analysis
${studyType === 'cohort' || studyType === 'rct'
  ? `stset time_var, failure(${outcome})
sts graph, by(${exposure})
stcox ${exposure} covariate1 covariate2, vce(robust)`
  : `logit ${outcome} ${exposure} covariate1 covariate2, vce(robust)
margins, dydx(*)`}

* Subgroup analysis
${studyType !== 'systematic-review'
  ? `logit ${outcome} c.${exposure}##i.subgroup covariate1, vce(robust)`
  : `* Run meta-analysis via metan package
metan effect_size std_error, label(namevar=study_name) forest`}`;
}

function generateR(studyType: string, outcome: string, exposure: string): string {
  return `# ResearchFlow — Generated R Syntax
# Study type: ${studyType}
# Generated: ${new Date().toLocaleDateString()}

library(tidyverse); library(gtsummary); library(survival)

data <- read.csv("data.csv")

# Table 1
data |>
  select(${outcome}, ${exposure}, covariate1, covariate2) |>
  tbl_summary(by = ${exposure}, missing = "ifany") |>
  add_p() |> add_overall()

# Regression
${studyType === 'cohort' || studyType === 'rct'
  ? `surv_obj <- Surv(time_var, ${outcome})
fit <- survfit(surv_obj ~ ${exposure}, data = data)
ggsurvplot(fit, pval = TRUE, conf.int = TRUE)
cox_model <- coxph(surv_obj ~ ${exposure} + covariate1, data = data)
tbl_regression(cox_model, exponentiate = TRUE)`
  : `model <- glm(${outcome} ~ ${exposure} + covariate1 + covariate2,
              family = binomial(), data = data)
tbl_regression(model, exponentiate = TRUE)`}`;
}

function generateSPSS(studyType: string, outcome: string, exposure: string): string {
  return `* ResearchFlow — Generated SPSS Syntax.
* Study type: ${studyType}.
* Generated: ${new Date().toLocaleDateString()}.

GET FILE='data.sav'.

* Descriptive statistics.
FREQUENCIES VARIABLES=${outcome} ${exposure}
  /STATISTICS=MEAN STDDEV MIN MAX.

* Cross-tabulation.
CROSSTABS
  /TABLES=${outcome} BY ${exposure}
  /STATISTICS=CHISQ
  /CELLS=COUNT EXPECTED ROW COLUMN.

* Logistic regression.
LOGISTIC REGRESSION ${outcome}
  WITH ${exposure} covariate1 covariate2
  /METHOD=ENTER
  /PRINT=CI(95).`;
}

// ─── Section editor ───────────────────────────────────────────────────────────

function ReportSection({ title, content, onChange }: { title: string; content: string; onChange: (v: string) => void }) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div className="report-section-title">{title}</div>
      <textarea
        className="report-editable report-preview"
        value={content}
        onChange={e => onChange(e.target.value)}
        rows={6}
      />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ReportGenerationPage() {
  const { state, completeStep, resetWizard } = useStudentWizard();
  const cfg = state.studyConfig;
  const [activeTab, setActiveTab] = useState<'stata' | 'r' | 'spss'>('stata');
  const [citation, setCitation] = useState<'apa' | 'vancouver' | 'harvard'>('vancouver');
  const [downloaded, setDownloaded] = useState(false);
  const [copied, setCopied] = useState(false);

  // Editable report sections
  const [methods, setMethods] = useState(
    `${cfg.studyTitle ? cfg.studyTitle + '. ' : ''}We conducted a ${cfg.studyType.replace('-', ' ')} study. The primary outcome was ${cfg.primaryOutcome || '[primary outcome]'} and the exposure of interest was ${cfg.exposureVariable || '[exposure variable]'}. ${cfg.sampleSizeTarget ? `The target sample size was ${cfg.sampleSizeTarget} participants.` : ''} ${state.dataset ? `Data were analysed using ${state.dataset.rowCount} participants across ${state.dataset.columnCount} variables.` : ''} ${cfg.researchQuestion ? `Research question: ${cfg.researchQuestion}` : ''}`
  );

  const [results, setResults] = useState(
    state.analyses.length > 0
      ? state.analyses.map(a => `${a.title}: ${a.summary}`).join('\n\n')
      : 'No analyses completed yet. Return to Step 3 to run analyses.'
  );

  const [tables, setTables] = useState(
    state.analyses.map((a, i) => `Table ${i + 1}. ${a.title}`).join('\n') || 'No tables generated yet.'
  );

  const syntaxCode = {
    stata: generateStata(cfg.studyType, cfg.primaryOutcome || 'outcome', cfg.exposureVariable || 'exposure'),
    r:     generateR(cfg.studyType, cfg.primaryOutcome || 'outcome', cfg.exposureVariable || 'exposure'),
    spss:  generateSPSS(cfg.studyType, cfg.primaryOutcome || 'outcome', cfg.exposureVariable || 'exposure'),
  };

  const handleDownloadPDF = () => {
    // In a real app: POST to /study/{id}/report
    const studyId = 'demo';
    window.open(`/study/${studyId}/report`, '_blank');
    setDownloaded(true);
    completeStep(5);
  };

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(syntaxCode[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSyntax = () => {
    const ext = activeTab === 'r' ? 'R' : activeTab === 'stata' ? 'do' : 'sps';
    const blob = new Blob([syntaxCode[activeTab]], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `researchflow_syntax.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const TAB_STYLE = (active: boolean, color: string) => ({
    padding: '0.4rem 0.85rem',
    background: active ? color : 'transparent',
    color: active ? 'white' : '#666',
    border: `1px solid ${active ? color : '#ddd'}`,
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: '0.82rem',
    fontWeight: 600 as const,
  });

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1C2B3A', marginBottom: '0.25rem' }}>
        Step 5: Report Generation
      </h2>
      <p style={{ color: '#666', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
        Your auto-generated report is ready. Edit any section, then export.
      </p>

      {downloaded && (
        <div style={{
          background: '#E9F7EF',
          border: '1px solid #A9DFBF',
          borderRadius: 10,
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}>
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
            <CheckCircle size={20} color="#1E8449" />
            <div>
              <div style={{ fontWeight: 700, color: '#1E8449' }}>Report generated successfully!</div>
              <div style={{ fontSize: '0.85rem', color: '#27AE60' }}>Your research analysis is complete.</div>
            </div>
          </div>
          <button
            onClick={resetWizard}
            style={{
              padding: '0.5rem 1rem',
              background: '#27AE60',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <RefreshCw size={14} /> Start New Study
          </button>
        </div>
      )}

      <div className="two-col-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1.5rem', alignItems: 'start' }}>
        {/* Left — Report Preview */}
        <div style={{ background: 'white', borderRadius: 10, border: '1px solid #E5E9EF', padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1.5rem', fontSize: '1rem', fontWeight: 700, color: '#1C2B3A', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={18} /> Report Preview
            <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#888', marginLeft: 4 }}>(click any section to edit)</span>
          </h3>

          <ReportSection title="1. Methods" content={methods} onChange={setMethods} />
          <ReportSection title="2. Results" content={results} onChange={setResults} />
          <ReportSection title="3. Tables & Figures" content={tables} onChange={setTables} />
        </div>

        {/* Right — Export panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'sticky', top: 80 }}>
          {/* PDF Download */}
          <div style={{ background: 'white', borderRadius: 10, border: '1px solid #E5E9EF', padding: '1.25rem' }}>
            <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', fontWeight: 700, color: '#1C2B3A' }}>Export Report</h4>
            <button
              onClick={handleDownloadPDF}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: '#C0533A',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                fontSize: '0.9rem',
              }}
            >
              <Download size={16} /> Download PDF Report
            </button>
          </div>

          {/* Syntax Export */}
          <div style={{ background: 'white', borderRadius: 10, border: '1px solid #E5E9EF', padding: '1.25rem' }}>
            <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', fontWeight: 700, color: '#1C2B3A' }}>Export Syntax</h4>
            <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '0.75rem' }}>
              <button style={TAB_STYLE(activeTab === 'stata', '#2E86C1')} onClick={() => setActiveTab('stata')}>Stata</button>
              <button style={TAB_STYLE(activeTab === 'spss',  '#7D3C98')} onClick={() => setActiveTab('spss')}>SPSS</button>
              <button style={TAB_STYLE(activeTab === 'r',     '#5A8A6A')} onClick={() => setActiveTab('r')}>R</button>
            </div>
            <div style={{
              background: '#1C2B3A',
              borderRadius: 8,
              padding: '0.75rem',
              fontSize: '0.72rem',
              fontFamily: 'monospace',
              color: '#A8C7E8',
              maxHeight: 160,
              overflow: 'auto',
              lineHeight: 1.5,
              marginBottom: '0.5rem',
              whiteSpace: 'pre',
            }}>
              {syntaxCode[activeTab].slice(0, 400)}…
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={handleCopyCode}
                style={{ flex: 1, padding: '0.45rem', background: '#EBF5FB', color: '#1A6EA6', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
              >
                {copied ? <><CheckCircle size={13} /> Copied!</> : <><Copy size={13} /> Copy</>}
              </button>
              <button
                onClick={handleDownloadSyntax}
                style={{ flex: 1, padding: '0.45rem', background: '#F4F7FA', color: '#444', border: '1px solid #ddd', borderRadius: 6, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
              >
                <Download size={13} /> Download
              </button>
            </div>
          </div>

          {/* Citation format */}
          <div style={{ background: 'white', borderRadius: 10, border: '1px solid #E5E9EF', padding: '1.25rem' }}>
            <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', fontWeight: 700, color: '#1C2B3A' }}>Citation Format</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {(['vancouver', 'apa', 'harvard'] as const).map(fmt => (
                <label key={fmt} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                  <input type="radio" name="citation" value={fmt} checked={citation === fmt} onChange={() => setCitation(fmt)} />
                  {fmt.charAt(0).toUpperCase() + fmt.slice(1)}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="action-bar">
        <button className="btn-secondary" onClick={() => window.history.back()}>
          ← Back to Results
        </button>
        <button className="btn-primary" onClick={handleDownloadPDF}>
          <Download size={15} style={{ marginRight: 6 }} />
          Download Final Report
        </button>
      </div>
    </div>
  );
}
