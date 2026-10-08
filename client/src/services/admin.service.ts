import { API_URL, apiClient } from '@/lib/api';
import type { LoginRequest, LoginResponse, TimetableVersion, UploadResponse, Analytics, AnalyticsParams } from '@/types/api.types';

export async function login(email: string, password: string): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>('/api/admin/login', { email, password } as LoginRequest);
  return response.data;
}

export function uploadTimetable(file: File, name: string, onProgress?: (progress: number) => void, kind: 'TENTATIVE' | 'FINAL' = 'FINAL', label?: string): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('name', name);
  formData.append('kind', kind);
  if (label) formData.append('label', label);
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_URL}/api/admin/timetables/upload`);
    const token = localStorage.getItem('ueab_admin_token');
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.upload.onprogress = event => { if (event.lengthComputable && onProgress) onProgress(Math.round(event.loaded * 100 / event.total)); };
    xhr.onload = () => {
      let payload: UploadResponse & { error?: string } | null = null;
      try { payload = xhr.responseText ? JSON.parse(xhr.responseText) : null; } catch { payload = null; }
      if (xhr.status >= 200 && xhr.status < 300 && payload) resolve(payload);
      else reject({ response: { status: xhr.status, data: payload || { error: xhr.statusText || 'Failed to upload timetable' } } });
    };
    xhr.onerror = () => reject({ response: { data: { error: 'Network error while uploading timetable' } } });
    xhr.send(formData);
  });
}
export async function publishTimetable(id: string) { await apiClient.post(`/api/admin/timetables/${id}/publish`); }
export async function getTimetables() { return (await apiClient.get<TimetableVersion[]>('/api/admin/timetables')).data; }
export async function deleteTimetable(id: string) { await apiClient.delete(`/api/admin/timetables/${id}`); }
export async function getAnalytics(params?: AnalyticsParams): Promise<Analytics> {
  const data = (await apiClient.get<Analytics>('/api/admin/analytics', { params })).data;
  return { ...data, dailyVisitors: data.dailyVisitors || [], totalSearches: data.totalSearches || 0, downloadsByType: data.downloadsByType || [], topQueries: data.topQueries || [] };
}
