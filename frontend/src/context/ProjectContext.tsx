import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Project {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
}

interface ProjectContextType {
  projectId: string | null;
  setProjectId: (id: string | null) => void;
  projects: Project[];
  refreshProjects: () => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const useProject = () => {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProject must be used within ProjectProvider');
  return ctx;
};

export const ProjectProvider = ({ children }: { children: ReactNode }) => {
  const [projectId, setProjectIdState] = useState<string | null>(
    () => localStorage.getItem('projectId')
  );
  const [projects, setProjects] = useState<Project[]>([]);

  const setProjectId = (id: string | null) => {
    setProjectIdState(id);
    if (id) localStorage.setItem('projectId', id);
    else localStorage.removeItem('projectId');
  };

  const refreshProjects = async () => {
    const res = await fetch('/api/projects');
    if (res.ok) {
      const data = await res.json();
      setProjects(data);
    }
  };

  useEffect(() => {
    refreshProjects();
  }, []);

  return (
    <ProjectContext.Provider value={{ projectId, setProjectId, projects, refreshProjects }}>
      {children}
    </ProjectContext.Provider>
  );
};
