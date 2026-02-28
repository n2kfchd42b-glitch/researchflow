import React, { useState } from 'react';
import { Download, Copy, CheckCircle, FileText, RefreshCw } from 'lucide-react';
import { useStudentWizard } from '../context/StudentWizardContext';
import LearningTip from '../components/LearningTip';
import StepSuccessMessage from '../components/StepSuccessMessage';
import { ReportExporter } from '../../../packages/ui';
import '../student.css';

// ─── Citation style helpers ───────────────────────────────────────────────────

type CitationStyle = 'apa' | 'vancouver' | 'harvard';

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

// ─── Auto-generated methods text ─────────────────────────────────────────────

function generateMethods(state: any, citation: CitationStyle): string {
  const cfg = state.studyConfig;
  const designDescriptions: Record<string, string> = {
    'cross-sectional': 'We conducted a cross-sectional study in which variables were measured at a single point in time.',
    cohort: 'We conducted a prospective cohort study in which participants were followed over time to compare outcomes between exposed and unexposed groups.',
    rct: 'We conducted a randomized controlled trial in which participants were randomly assigned to intervention or control conditions.',
    'case-control': 'We conducted a case-control study in which individuals with the outcome of interest (cases) were compared to those without (controls).',
    'systematic-review': 'We conducted a systematic review and meta-analysis following a pre-specified protocol.',
  };

  const guidelineMap: Record<string, string> = {
    'cross-sectional': 'STROBE',
    cohort: 'STROBE',
    rct: 'CONSORT',
    'case-control': 'STROBE',
    'systematic-review': 'PRISMA 2020',
  };

  const analysisDescriptions: Record<string, string> = {
    'cross-sectional': 'Chi-square tests and independent samples t-tests were used for bivariate analyses. Multivariable logistic regression was performed to estimate odds ratios (OR) with 95% confidence intervals (95% CI).',
    cohort: 'Kaplan-Meier survival curves were constructed and compared using the log-rank test. Cox proportional hazards regression was used to estimate hazard ratios (HR) with 95% CI.',
    rct: 'The primary analysis was conducted on an intention-to-treat (ITT) basis. Binary outcomes were analysed using logistic regression; continuous outcomes using ANCOVA with baseline adjustment.',
    'case-control': 'Crude and adjusted odds ratios with 95% CI were estimated using conditional logistic regression.',
    'systematic-review': 'A random-effects meta-analysis was performed using the DerSimonian-Laird method. Heterogeneity was assessed using the I² statistic and Cochran Q test.',
  };

  const st = cfg.studyType || 'cross-sectional';
  const guideline = guidelineMap[st] ?? 'relevant reporting guidelines';
  const analysisDesc = analysisDescriptions[st] ?? 'Appropriate statistical analyses were performed.';
  const designDesc = designDescriptions[st] ?? `We conducted a ${st.replace('-', ' ')} study.`;

  const covariates = state.dataset?.columns.filter((c: any) => c.role === 'covariate').map((c: any) => c.name).join(', ') || '';
  const pThreshold = citation === 'apa' ? '*p* < .05' : 'p < 0.05';

  return `Study Design: ${designDesc}

Setting and Participants: ${state.researchStructure?.population || 'Participants were recruited from the study setting'}. ${state.dataset ? `A total of ${state.dataset.rowCount} participants were included in the analysis.` : ''}

Exposure/Intervention: The primary exposure of interest was ${cfg.exposureVariable || '[exposure variable]'}.

Outcome Measures: The primary outcome was ${cfg.primaryOutcome || '[primary outcome]'}. ${cfg.secondaryOutcomes?.length > 0 ? `Secondary outcomes included ${cfg.secondaryOutcomes.join(', ')}.` : ''}

Statistical Analysis: Descriptive statistics were presented as mean (standard deviation) for continuous variables and as frequencies (percentages) for categorical variables. ${analysisDesc}${covariates ? ` All multivariable analyses were adjusted for ${covariates}.` : ''} Statistical significance was set at ${pThreshold}. Analyses were performed using ResearchFlow.

Reporting: This study follows the ${guideline} reporting guideline.${cfg.studyTitle ? `\n\nStudy title: ${cfg.studyTitle}` : ''}${cfg.researchQuestion ? `\n\nResearch question: ${cfg.researchQuestion}` : ''}`;
}

function generateResults(state: any, citation: CitationStyle): string {
  if (state.analyses.length === 0) return 'No analyses completed yet. Return to Step 3 to run analyses.';

  const N = state.dataset?.rowCount ?? 0;
  const lines: string[] = [];

  if (N > 0) {
    lines.push(`Sample Characteristics: A total of ${N} participants were included in the analysis.${state.dataset?.columns.some((c: any) => c.role === 'covariate') ? ' Baseline characteristics are presented in Table 1.' : ''}`);
    lines.push('');
  }

  const exposure = state.studyConfig.exposureVariable || 'the exposure';
  const outcome = state.studyConfig.primaryOutcome || 'the outcome';
  const covariates = state.dataset?.columns.filter((c: any) => c.role === 'covariate').map((c: any) => c.name).join(', ') || 'relevant covariates';
  const pFmt = citation === 'vancouver' ? 'p = 0.xxx' : '*p* = .xxx';

  state.analyses.forEach((a: any, i: number) => {
    let sentence = '';
    if (a.type === 'table1') {
      sentence = `Baseline characteristics of study participants are presented in Table ${i + 1}.`;
    } else if (a.type === 'km' || a.type === 'cox') {
      sentence = `Survival analysis was performed to examine the association between ${exposure} and ${outcome}. Adjusted hazard ratio estimates with 95% CI are presented after adjustment for ${covariates}.`;
    } else if (['regression', 'logistic', 'or', 'itt', 'pp'].includes(a.type)) {
      sentence = `${a.type === 'pp' ? 'Per-protocol' : 'Primary'} analysis revealed an association between ${exposure} and ${outcome} (OR [95% CI], ${pFmt}) after adjusting for ${covariates} among ${N} participants.`;
    } else if (a.type === 'forest' || a.type === 'prisma') {
      sentence = `The pooled meta-analysis of included studies examined the association between ${exposure} and ${outcome}. The pooled effect estimate with 95% CI is presented in the forest plot.`;
    } else {
      sentence = `${a.title}: ${a.summary}`;
    }
    lines.push(sentence);
  });

  return lines.join('\n\n');
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
        rows={7}
      />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ReportGenerationPage() {
  const { state, completeStep, resetWizard } = useStudentWizard();
  const cfg = state.studyConfig;
  const [activeTab, setActiveTab] = useState<'stata' | 'r' | 'spss'>('stata');
  const [citation, setCitation] = useState<CitationStyle>('apa');
  const [downloaded, setDownloaded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showSuccess, setShowSuccess] = useState(state.maxCompletedStep === 4);

  const [methods, setMethods] = useState(() => generateMethods(state, 'apa'));
  const [results, setResults] = useState(() => generateResults(state, 'apa'));
  const [tables, setTables] = useState(
    state.analyses.map((a, i) => `Table ${i + 1}. ${a.title}`).join('\n') || 'No tables generated yet.'
  );

  const handleCitationChange = (style: CitationStyle) => {
    setCitation(style);
    setMethods(generateMethods(state, style));
    setResults(generateResults(state, style));
  };

  const syntaxCode = {
    stata: generateStata(cfg.studyType, cfg.primaryOutcome || 'outcome', cfg.exposureVariable || 'exposure'),
    r:     generateR(cfg.studyType, cfg.primaryOutcome || 'outcome', cfg.exposureVariable || 'exposure'),
    spss:  generateSPSS(cfg.studyType, cfg.primaryOutcome || 'outcome', cfg.exposureVariable || 'exposure'),
  };

  const handleDownloadPDF = () => {
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

  const handleExportReportText = () => {
    const fullText = `METHODS\n\n${methods}\n\nRESULTS\n\n${results}\n\nTABLES & FIGURES\n\n${tables}`;
    const blob = new Blob([fullText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'researchflow_report.txt';
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

  const CITE_STYLE = (active: boolean) => ({
    padding: '0.35rem 0.75rem',
    background: active ? '#1C2B3A' : 'white',
    color: active ? 'white' : '#555',
    border: '1px solid #ddd',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: '0.82rem',
    fontWeight: 600 as const,
    transition: 'all 0.15s',
  });

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {showSuccess && <StepSuccessMessage step={4} onDismiss={() => setShowSuccess(false)} />}

      <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1C2B3A', marginBottom: '0.25rem' }}>
        Step 5: Report Generation
      </h2>
      <p style={{ color: '#666', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
        Your auto-generated report is ready. Edit any section, then export.
      </p>

      <LearningTip
        visible={state.learningMode}
        title="Structure of an academic report"
        explanation="Academic research reports follow a standard structure: Methods (what you did and why), Results (what you found), and Discussion (what it means). Always write for a reader who is knowledgeable but unfamiliar with your specific study."
        relatedConcepts={['Academic writing', 'Scientific reporting', 'Methods section']}
      />

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

      {/* Citation style toggle */}
      <div style={{
        background: 'white', borderRadius: 10, border: '1px solid #E5E9EF',
        padding: '0.875rem 1.25rem', marginBottom: '1rem',
        display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1C2B3A' }}>Citation Style:</span>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {(['apa', 'vancouver', 'harvard'] as const).map(s => (
            <button key={s} style={CITE_STYLE(citation === s)} onClick={() => handleCitationChange(s)}>
              {s.toUpperCase()}
            </button>
          ))}
        </div>
        <span style={{ fontSize: '0.75rem', color: '#888' }}>
          {citation === 'apa' && '*p* = .003, 95% CI [1.2, 2.4]'}
          {citation === 'vancouver' && 'p = 0.003, 95% CI 1.2–2.4'}
          {citation === 'harvard' && 'p = .003, 95% CI 1.2–2.4'}
        </span>
      </div>

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

          <div style={{ marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid #E5E9EF' }}>
            <button
              onClick={handleExportReportText}
              style={{
                padding: '0.5rem 1rem',
                background: '#5A8A6A',
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
              <Download size={14} /> Export Report as Text
            </button>
          </div>
        </div>

        {/* Right — Export panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'sticky', top: 80 }}>
          {/* PDF Download */}
          {/* Shared ReportExporter — formats[] drives available options (APA default) */}
          <div style={{ background: 'white', borderRadius: 10, border: '1px solid #E5E9EF', padding: '1.25rem' }}>
            <ReportExporter
              context="student"
              formats={['pdf', 'docx', 'csv']}
              payload={{
                context: 'student',
                studyType: cfg.studyType,
                primaryOutcome: cfg.primaryOutcome,
                exposureVariable: cfg.exposureVariable,
                citationStyle: citation,
                methods,
                results,
              }}
              templateId="apa-report"
              label="Export Report"
            />
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
              {(['apa', 'vancouver', 'harvard'] as const).map(fmt => (
                <label key={fmt} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                  <input type="radio" name="citation" value={fmt} checked={citation === fmt} onChange={() => handleCitationChange(fmt)} />
                  {fmt.charAt(0).toUpperCase() + fmt.slice(1)}
                  {fmt === 'apa' && <span style={{ fontSize: '0.72rem', color: '#888' }}>(recommended)</span>}
                </label>
              ))}
            </div>
          </div>

          {/* Study summary */}
          <div style={{ background: '#F4F7FA', borderRadius: 10, padding: '1rem', fontSize: '0.8rem', color: '#555', lineHeight: 1.6 }}>
            <div style={{ fontWeight: 700, color: '#1C2B3A', marginBottom: '0.5rem' }}>Study Summary</div>
            <div><strong>Design:</strong> {cfg.studyType.replace('-', ' ') || '—'}</div>
            <div><strong>Outcome:</strong> {cfg.primaryOutcome || '—'}</div>
            <div><strong>Exposure:</strong> {cfg.exposureVariable || '—'}</div>
            <div><strong>Analyses:</strong> {state.analyses.length} completed</div>
            {state.dataset && <div><strong>N:</strong> {state.dataset.rowCount} participants</div>}
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
