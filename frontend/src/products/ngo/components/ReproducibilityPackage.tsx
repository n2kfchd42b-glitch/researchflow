import React, { useState } from 'react';
import { useNGOPlatform } from '../context/NGOPlatformContext';

const ReproducibilityPackage: React.FC<{ projectId: string }> = ({ projectId }) => {
  const { state } = useNGOPlatform();
  const [show, setShow] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleGenerate = () => {
    // Compile all data from context (mock)
    const pkg = {
      metadata: { projectId, projectInfo: {}, studyDesign: '' },
      data: { datasetInfo: {}, variableDictionary: {}, cleaningLog: {} },
      analysis: { analysisSteps: [], resultsSummary: {} },
      indicators: { indicatorDefinitions: [] },
      reports: { generatedReports: [] },
    };
    const blob = new Blob([JSON.stringify(pkg, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reproducibility_package_${projectId}_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    setSuccess(true);
  };

  return (
    <div>
      <button style={{ background: '#2E86C1', color: '#fff', borderRadius: 8, padding: '8px 20px', fontSize: 15 }} onClick={() => setShow(true)}>
        Generate Reproducibility Package
      </button>
      {show && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(44,62,80,0.18)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 32, minWidth: 400, maxWidth: 600 }}>
            <div style={{ fontWeight: 700, fontSize: 18, color: '#1C2B3A', marginBottom: 16 }}>Reproducibility Package</div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 600, fontSize: 15, color: '#1C2B3A', marginBottom: 8 }}>Package Contents</div>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                <li>☑ Dataset snapshot (current version metadata)</li>
                <li>☑ Cleaning steps log</li>
                <li>☑ Analysis steps</li>
                <li>☑ Analysis outputs</li>
                <li>☑ Indicator definitions & calculations</li>
                <li>☑ Variable dictionary</li>
                <li>☑ Project metadata</li>
              </ul>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 600, fontSize: 15, color: '#1C2B3A', marginBottom: 8 }}>Package Preview</div>
              <pre style={{ background: '#F8F9F9', borderRadius: 8, padding: 12, fontSize: 13, maxHeight: 120, overflow: 'auto' }}>{`
reproducibility_package/
├── README.txt
├── metadata/
│   ├── project_info.json
│   └── study_design.txt
├── data/
│   ├── dataset_info.json
│   ├── variable_dictionary.json
│   └── cleaning_log.json
├── analysis/
│   ├── analysis_steps.json
│   └── results_summary.json
├── indicators/
│   └── indicator_definitions.json
└── reports/
    └── generated_reports.json
`}</pre>
            </div>
            <button style={{ background: '#5A8A6A', color: '#fff', borderRadius: 8, padding: '8px 20px', fontSize: 15, marginRight: 8 }} onClick={handleGenerate}>
              Generate Package
            </button>
            <button style={{ background: '#e0e0e0', color: '#1C2B3A', borderRadius: 8, padding: '8px 20px', fontSize: 15 }} onClick={() => setShow(false)}>
              Cancel
            </button>
            {success && <div style={{ color: '#5A8A6A', marginTop: 12 }}>Package downloaded!</div>}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReproducibilityPackage;
