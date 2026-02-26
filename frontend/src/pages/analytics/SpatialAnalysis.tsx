import React, { useState, useContext } from "react";
import { useProject } from "../../context/ProjectContext";
import { SpatialResult } from "./types";

const SpatialAnalysis: React.FC = () => {
  const { projectId } = useProject();
  const [datasetVersionId, setDatasetVersionId] = useState<number | null>(null);
  const [result, setResult] = useState<SpatialResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const handleRun = async () => {
    setError(null);
    setWarning(null);
    setResult(null);
    if (!projectId || !datasetVersionId) return;
    const res = await fetch("/analysis/spatial", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_id: projectId,
        dataset_version_id: datasetVersionId,
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
        <h2>Spatial Analysis</h2>
        <input placeholder="Dataset Version ID" type="number" value={datasetVersionId ?? ""} onChange={e => setDatasetVersionId(Number(e.target.value))} />
        <button className="btn" onClick={handleRun}>Run</button>
      </div>
      <div className="card" style={{ marginLeft: 400 }}>
        <h3>Results</h3>
        {error && <div className="alert-critical">{error}</div>}
        {warning && <div className="alert">{warning}</div>}
        {result && !error && (
          <>
            <div>
              <b>Summary Stats:</b> {JSON.stringify(result.summary_stats)}
            </div>
            {result.region_means && (
              <div>
                <b>Region Means:</b> {JSON.stringify(result.region_means)}
              </div>
            )}
            <div>
              <b>Points:</b>
              <ul>
                {result.points.map((pt, i) => (
                  <li key={i}>Lat: {pt.latitude}, Lng: {pt.longitude}, Value: {pt.outcome}</li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SpatialAnalysis;
