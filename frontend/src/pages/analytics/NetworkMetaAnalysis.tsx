import React, { useState, useContext } from "react";
import { ProjectContext } from "../../context/ProjectContext";
import { NetworkMetaResult } from "./types";

const NetworkMetaAnalysis: React.FC = () => {
  const { projectId } = useContext(ProjectContext);
  const [datasetVersionId, setDatasetVersionId] = useState<number | null>(null);
  const [result, setResult] = useState<NetworkMetaResult | null>(null);

  const handleRun = async () => {
    if (!projectId || !datasetVersionId) return;
    const res = await fetch("/analysis/network-meta", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_id: projectId,
        dataset_version_id: datasetVersionId,
      }),
    });
    setResult(await res.json());
  };

  if (!projectId) {
    return <div className="card"><b>Please select a project first.</b></div>;
  }

  return (
    <div className="page">
      <div className="card" style={{ width: 350, float: "left", marginRight: 24 }}>
        <h2>Network Meta-Analysis</h2>
        <input placeholder="Dataset Version ID" type="number" value={datasetVersionId ?? ""} onChange={e => setDatasetVersionId(Number(e.target.value))} />
        <button className="btn" onClick={handleRun}>Run</button>
      </div>
      <div className="card" style={{ marginLeft: 400 }}>
        <h3>Results</h3>
        {result && (
          <>
            <div>
              <b>Pooled Effects:</b>
              <table>
                <thead>
                  <tr>
                    <th>Treatment</th>
                    <th>Comparator</th>
                    <th>Pooled Effect</th>
                    <th>Pooled SE</th>
                  </tr>
                </thead>
                <tbody>
                  {result.pooled_effects.map((row, i) => (
                    <tr key={i}>
                      <td>{row.treatment}</td>
                      <td>{row.comparator}</td>
                      <td>{row.pooled_effect}</td>
                      <td>{row.pooled_se}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default NetworkMetaAnalysis;
