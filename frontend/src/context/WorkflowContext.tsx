import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type ProductContext = 'student' | 'ngo' | 'journal' | 'shared';

export interface ActiveDatasetRef {
  datasetId: string;
  datasetVersionId?: string | null;
  datasetName?: string;
  columnTypes?: Record<string, string>;
  source?: ProductContext;
  selectedAt: string;
}

interface WorkflowContextValue {
  activeDataset: ActiveDatasetRef | null;
  setActiveDataset: (dataset: Omit<ActiveDatasetRef, 'selectedAt'>) => void;
  clearActiveDataset: () => void;
  setActiveDatasetVersion: (datasetVersionId: string | null) => void;
}

const STORAGE_KEY = 'rf_workflow_context_v1';

const WorkflowContext = createContext<WorkflowContextValue | undefined>(undefined);

function parseStoredValue(value: string | null): ActiveDatasetRef | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as ActiveDatasetRef;
    if (!parsed?.datasetId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function WorkflowProvider({ children }: { children: React.ReactNode }) {
  const [activeDataset, setActiveDatasetState] = useState<ActiveDatasetRef | null>(() =>
    parseStoredValue(localStorage.getItem(STORAGE_KEY))
  );

  useEffect(() => {
    if (!activeDataset) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(activeDataset));
  }, [activeDataset]);

  const setActiveDataset = (dataset: Omit<ActiveDatasetRef, 'selectedAt'>) => {
    setActiveDatasetState({ ...dataset, selectedAt: new Date().toISOString() });
  };

  const setActiveDatasetVersion = (datasetVersionId: string | null) => {
    setActiveDatasetState(prev => {
      if (!prev) return prev;
      return { ...prev, datasetVersionId, selectedAt: new Date().toISOString() };
    });
  };

  const clearActiveDataset = () => setActiveDatasetState(null);

  const value = useMemo(
    () => ({ activeDataset, setActiveDataset, clearActiveDataset, setActiveDatasetVersion }),
    [activeDataset]
  );

  return <WorkflowContext.Provider value={value}>{children}</WorkflowContext.Provider>;
}

export function useWorkflow() {
  const ctx = useContext(WorkflowContext);
  if (!ctx) throw new Error('useWorkflow must be used within WorkflowProvider');
  return ctx;
}
