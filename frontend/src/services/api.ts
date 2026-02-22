const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

console.log('ResearchFlow API URL:', API_URL);

export const api = {
  upload: async (file: File) => {
    const form = new FormData();
    form.append('file', file);
    console.log('Uploading to:', `${API_URL}/upload`);
    const res = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      body: form,
    });
    if (!res.ok) {
      const text = await res.text();
      console.error('Upload failed:', text);
      throw new Error(text);
    }
    return res.json();
  },

  createStudy: async (payload: object) => {
    console.log('Creating study at:', `${API_URL}/study`);
    const res = await fetch(`${API_URL}/study`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error('Create study failed:', text);
      throw new Error(text);
    }
    return res.json();
  },

  analyseStudy: async (studyId: string, payload: object) => {
    console.log('Analysing study:', studyId);
    console.log('Payload:', JSON.stringify(payload));
    const res = await fetch(`${API_URL}/study/${studyId}/analyse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error('Analysis failed:', res.status, text);
      throw new Error(text);
    }
    return res.json();
  },

  generateReport: async (studyId: string, template: string) => {
    const res = await fetch(
      `${API_URL}/study/${studyId}/report?template=${template}`,
      { method: 'POST' }
    );
    if (!res.ok) throw new Error(await res.text());
    return res.blob();
  },
};

export default api;
