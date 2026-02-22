const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

console.log('ResearchFlow API URL:', API_URL);

export const api = {
  upload: async (file: File) => {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      body: form,
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text);
    }
    return res.json();
  },

  createStudy: async (payload: object) => {
    const res = await fetch(`${API_URL}/study`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text);
    }
    return res.json();
  },

  analyseStudy: async (studyId: string, payload: object) => {
    const res = await fetch(`${API_URL}/study/${studyId}/analyse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text);
    }
    return res.json();
  },

  downloadReport: async (studyId: string, template: string) => {
    const res = await fetch(
      `${API_URL}/study/${studyId}/report?template=${template}`,
      { method: 'POST' }
    );
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text);
    }
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

export default api;
