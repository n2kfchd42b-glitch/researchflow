import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface VariableRef {
  name: string;
  type: 'categorical' | 'continuous';
}

interface StudyState {
  researchQuestion: string;
  exposureVariable: VariableRef | null;
  outcomeVariable: VariableRef | null;
  studyDesign: string;

  setResearchQuestion: (q: string) => void;
  setExposureVariable: (v: VariableRef | null) => void;
  setOutcomeVariable: (v: VariableRef | null) => void;
  setStudyDesign: (d: string) => void;
  resetStudy: () => void;
}

const INITIAL_STATE = {
  researchQuestion: '',
  exposureVariable: null as VariableRef | null,
  outcomeVariable: null as VariableRef | null,
  studyDesign: '',
};

export const useStudyStore = create<StudyState>()(
  persist(
    (set) => ({
      ...INITIAL_STATE,
      setResearchQuestion: (researchQuestion) => set({ researchQuestion }),
      setExposureVariable: (exposureVariable) => set({ exposureVariable }),
      setOutcomeVariable: (outcomeVariable) => set({ outcomeVariable }),
      setStudyDesign: (studyDesign) => set({ studyDesign }),
      resetStudy: () => set(INITIAL_STATE),
    }),
    { name: 'rf-study-store-v1' },
  ),
);
