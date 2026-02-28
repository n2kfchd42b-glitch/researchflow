import React, { useState } from "react";
import { useProject } from "../../context/ProjectContext";
import { MixedEffectsResult } from "./types";

const MixedEffects: React.FC = () => {
  const { projectId } = useProject();
  const [datasetVersionId, setDatasetVersionId] = useState<number | null>(null);
  const [outcomeColumn, setOutcomeColumn] = useState("");
  const [fixedEffects, setFixedEffects] = useState<string>("");
  const [randomEffectColumn, setRandomEffectColumn] = useState("");
  const [result, setResult] = useState<MixedEffectsResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const handleRun = async () => {
    setError(null);
    setWarning(null);
    setResult(null);
    if (!projectId || !datasetVersionId) return;
    const res = await fetch("/analysis/mixed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_id: projectId,
        dataset_version_id: datasetVersionId,
        outcome_column: outcomeColumn,
        fixed_effects: fixedEffects.split(",").map(s => s.trim()).filter(Boolean),
        random_effect_column: randomEffectColumn,
      }),
    });
    const data = await res.json();
    if (data.error) {
      setError(data.error + (data.details ? ": " + data.details : ""));
    } else {
      setResult(data);
      if (data.warning) setWarning(data.warning);
    }
  };

  if (!projectId) {
    return <div className="card"><b>Please select a project first.</b></div>;
  }

  return (
    <div className="page">
      <div className="card" style={{ width: 350, float: "left", marginRight: 24 }}>
        <h2>Mixed Effects Model</h2>
        <input placeholder="Dataset Version ID" type="number" value={datasetVersionId ?? ""} onChange={e => setDatasetVersionId(Number(e.target.value))} />
        <input placeholder="Outcome Column" value={outcomeColumn} onChange={e => setOutcomeColumn(e.target.value)} />
        <input placeholder="Fixed Effects (comma separated)" value={fixedEffects} onChange={e => setFixedEffects(e.target.value)} />
        <input placeholder="Random Effect Column" value={randomEffectColumn} onChange={e => setRandomEffectColumn(e.target.value)} />
        <button className="btn" onClick={handleRun}>Run</button>
      </div>
      <div className="card" style={{ marginLeft: 400 }}>
        <h3>Results</h3>
        {error && <div className="alert-critical">{error}</div>}
        {warning && <div className="alert">{warning}</div>}
        {result && !error && (
          <>
            <div>
              <b>Fixed Effects:</b> {JSON.stringify(result.fixed_effects)}<br />
              <b>Random Variance:</b> {JSON.stringify(result.random_variance)}
            </div>
            <div>
              <b>P-values:</b> {JSON.stringify(result.p_values)}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MixedEffects;
