const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8001';

console.log('ResearchFlow API URL:', API_URL);

export const api = {
  upload: async (file: File) => {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      body: form,
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  createStudy: async (payload: object) => {
    const res = await fetch(`${API_URL}/study`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  analyseStudy: async (studyId: string, payload: object) => {
    const res = await fetch(`${API_URL}/study/${studyId}/analyse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  downloadReport: async (studyId: string, template: string) => {
    const res = await fetch(
      `${API_URL}/study/${studyId}/report?template=${template}`,
      { method: 'POST' }
    );
    if (!res.ok) throw new Error(await res.text());
    const blob = await res.blob();
    const url  = window.URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `researchflow_${template}_report.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },
};

export const methodologyApi = {
  saveTemplate: async (payload: object) => {
    const res = await fetch(`${API_URL}/templates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  getTemplates: async (userEmail: string) => {
    const res = await fetch(`${API_URL}/templates?user_email=${userEmail}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  getCommunityTemplates: async () => {
    const res = await fetch(`${API_URL}/templates/community`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  loadTemplate: async (templateId: string) => {
    const res = await fetch(`${API_URL}/templates/${templateId}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  deleteTemplate: async (templateId: string, userEmail: string) => {
    const res = await fetch(
      `${API_URL}/templates/${templateId}?user_email=${userEmail}`,
      { method: 'DELETE' }
    );
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
};

export default api;

export const cohortApi = {
  buildCohort: async (datasetId: string, inclusionCriteria: any[], exclusionCriteria: any[]) => {
    const res = await fetch(`${API_URL}/cohort/build`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dataset_id:          datasetId,
        inclusion_criteria:  inclusionCriteria,
        exclusion_criteria:  exclusionCriteria,
      })
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  getColumnSummary: async (datasetId: string, column: string) => {
    const res = await fetch(`${API_URL}/cohort/column-summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataset_id: datasetId, column })
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
};
