import React, { useState } from 'react';
import { useProject } from '../context/ProjectContext';

const ProjectSelector: React.FC = () => {
  const { projectId, setProjectId, projects, refreshProjects } = useProject();
  const [newProjectName, setNewProjectName] = useState('');
  const [creating, setCreating] = useState(false);

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setProjectId(e.target.value || null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    setCreating(true);
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newProjectName, description: '', owner_id: projects[0]?.owner_id || '' })
    });
    setCreating(false);
    if (res.ok) {
      setNewProjectName('');
      await refreshProjects();
    }
  };

  return (
    <div className="project-selector card">
      <label htmlFor="project-select">Project:</label>
      <select id="project-select" value={projectId || ''} onChange={handleSelect} className="btn">
        <option value="">Select a project</option>
        {projects.map(p => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>
      <form onSubmit={handleCreate} style={{ display: 'inline-block', marginLeft: 8 }}>
        <input
          type="text"
          placeholder="New project name"
          value={newProjectName}
          onChange={e => setNewProjectName(e.target.value)}
          className="card"
        />
        <button type="submit" className="btn" disabled={creating} style={{ marginLeft: 4 }}>
          {creating ? 'Creating...' : 'Add'}
        </button>
      </form>
    </div>
  );
};

export default ProjectSelector;
