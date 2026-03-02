import React, { useEffect, useState } from "react";
import { useProject } from "../../context/ProjectContext";
import { useWorkflow } from "../../context/WorkflowContext";
import { DiDResult } from "./types";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";

const DifferenceInDifferences: React.FC = () => {
  const { projectId } = useProject();
  const { activeDataset, setActiveDatasetVersion } = useWorkflow();
  const [datasetVersionId, setDatasetVersionId] = useState<number | null>(() => {
    if (!activeDataset?.datasetVersionId) return null;
    const parsed = Number(activeDataset.datasetVersionId);
    return Number.isFinite(parsed) ? parsed : null;
  });
  const [outcomeColumn, setOutcomeColumn] = useState("");
  const [groupColumn, setGroupColumn] = useState("");
  const [periodColumn, setPeriodColumn] = useState("");
  const [result, setResult] = useState<DiDResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
    if (!activeDataset?.datasetVersionId) return;
    const parsed = Number(activeDataset.datasetVersionId);
    if (Number.isFinite(parsed)) setDatasetVersionId(parsed);
  }, [activeDataset?.datasetVersionId]);

  const onDatasetVersionChange = (value: string) => {
    const parsed = Number(value);
    if (!value || !Number.isFinite(parsed)) {
      setDatasetVersionId(null);
      setActiveDatasetVersion(null);
      return;
    }
    setDatasetVersionId(parsed);
    setActiveDatasetVersion(String(parsed));
  };

  const handleRun = async () => {
    setError(null);
    setWarning(null);
    setResult(null);
    if (!projectId || !datasetVersionId) return;
    const res = await fetch("/analysis/did", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_id: projectId,
        dataset_version_id: datasetVersionId,
        outcome_column: outcomeColumn,
        group_column: groupColumn,
        period_column: periodColumn,
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

  // Prepare chart data if group_means available
  let chartData: any[] = [];
  if (result && result.group_means) {
    const periods = Object.keys(result.group_means[Object.keys(result.group_means)[0]] || {});
    chartData = periods.map(period => {
      const entry: any = { period };
      for (const group in result.group_means) {
        entry[`group_${group}`] = result.group_means[group][period];
      }
      return entry;
    });
  }

  return (
    <div className="page">
      <div className="card" style={{ width: 350, float: "left", marginRight: 24 }}>
        <h2>Difference-in-Differences</h2>
        <input placeholder="Dataset Version ID" type="number" value={datasetVersionId ?? ""} onChange={e => onDatasetVersionChange(e.target.value)} />
        {activeDataset?.datasetName && (
          <p style={{ fontSize: '0.75rem', color: '#666', marginTop: 6 }}>
            Active dataset: {activeDataset.datasetName}
          </p>
        )}
        <input placeholder="Outcome Column" value={outcomeColumn} onChange={e => setOutcomeColumn(e.target.value)} />
        <input placeholder="Group Column" value={groupColumn} onChange={e => setGroupColumn(e.target.value)} />
        <input placeholder="Period Column" value={periodColumn} onChange={e => setPeriodColumn(e.target.value)} />
        <button className="btn" onClick={handleRun}>Run</button>
      </div>
      <div className="card" style={{ marginLeft: 400 }}>
        <h3>Results</h3>
        {error && <div className="alert-critical">{error}</div>}
        {warning && <div className="alert">{warning}</div>}
        {result && !error && (
          <>
            <div>
              <b>DiD Effect:</b> {result.did_effect}<br />
              <b>Coefficients:</b> {JSON.stringify(result.coefficients)}
            </div>
            {chartData.length > 0 && (
              <LineChart width={500} height={300} data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Legend />
                {Object.keys(result.group_means).map(group => (
                  <Line key={group} type="monotone" dataKey={`group_${group}`} name={`Group ${group}`} stroke={group === "1" ? "#8884d8" : "#82ca9d"} />
                ))}
              </LineChart>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DifferenceInDifferences;
