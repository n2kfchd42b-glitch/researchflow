import React from 'react';
import { BookOpen } from 'lucide-react';
import { useStudentWizard } from '../context/StudentWizardContext';

export default function LearningToggle() {
  const { state, toggleLearningMode } = useStudentWizard();

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <BookOpen size={15} color={state.learningMode ? '#E67E22' : '#aaa'} />
      <span style={{ fontSize: '0.8rem', color: state.learningMode ? '#7D4E1A' : '#888', fontWeight: 600, whiteSpace: 'nowrap' }}>
        Learning Mode
      </span>
      <button
        onClick={toggleLearningMode}
        role="switch"
        aria-checked={state.learningMode}
        style={{
          position: 'relative',
          width: 36,
          height: 20,
          borderRadius: 10,
          background: state.learningMode ? '#E67E22' : '#D5D8DC',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          transition: 'background 0.2s',
          flexShrink: 0,
        }}
      >
        <span style={{
          position: 'absolute',
          top: 2,
          left: state.learningMode ? 18 : 2,
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: 'white',
          transition: 'left 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }} />
      </button>
    </div>
  );
}
