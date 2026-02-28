import React, { useState } from "react";
import { useProject } from "../../context/ProjectContext";
import { ITSResult } from "./types";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";

const InterruptedTimeSeries: React.FC = () => {
  const { projectId } = useProject();
  const [datasetVersionId, setDatasetVersionId] = useState<number | null>(null);
  const [timeColumn, setTimeColumn] = useState("");
  const [outcomeColumn, setOutcomeColumn] = useState("");
  const [interventionPoint, setInterventionPoint] = useState<number>(0);
  const [result, setResult] = useState<ITSResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const handleRun = async () => {
    setError(null);
    setWarning(null);
    setResult(null);
    if (!projectId || !datasetVersionId) return;
    const res = await fetch("/analysis/its", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_id: projectId,
        dataset_version_id: datasetVersionId,
        time_column: timeColumn,
        outcome_column: outcomeColumn,
        intervention_point: interventionPoint,
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
        <h2>Interrupted Time Series</h2>
        <input placeholder="Dataset Version ID" type="number" value={datasetVersionId ?? ""} onChange={e => setDatasetVersionId(Number(e.target.value))} />
        <input placeholder="Time Column" value={timeColumn} onChange={e => setTimeColumn(e.target.value)} />
        <input placeholder="Outcome Column" value={outcomeColumn} onChange={e => setOutcomeColumn(e.target.value)} />
        <input placeholder="Intervention Point" type="number" value={interventionPoint} onChange={e => setInterventionPoint(Number(e.target.value))} />
        <button className="btn" onClick={handleRun}>Run</button>
      </div>
      <div className="card" style={{ marginLeft: 400 }}>
        <h3>Results</h3>
        {error && <div className="alert-critical">{error}</div>}
        {warning && <div className="alert">{warning}</div>}
        {result && !error && (
          <>
            <div>
              <b>Slope (pre):</b> {result.slope_pre}<br />
              <b>Level Change:</b> {result.level_change}<br />
              <b>Slope Change:</b> {result.slope_change}
            </div>
            <LineChart width={500} height={300} data={result.predictions.map((y, i) => ({ time: i, predicted: y }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="predicted" stroke="#8884d8" />
            </LineChart>
          </>
        )}
      </div>
    </div>
  );
};

export default InterruptedTimeSeries;
