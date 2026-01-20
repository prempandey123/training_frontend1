import api from './api';

export async function uploadAnnualTrainingCalendar(file, academicYear = '2025-26') {
  const formData = new FormData();
  formData.append('file', file);

  const res = await api.post(`/annual-training-calendar/import?academicYear=${encodeURIComponent(academicYear)}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export async function getAnnualTrainingCalendar() {
  const res = await api.get('/annual-training-calendar');
  return res.data;
}
