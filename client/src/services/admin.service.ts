import { API_URL, apiClient } from '@/lib/api';
import type {
  LoginRequest,
  LoginResponse,
  TimetableVersion,
  UploadResponse,
  Analytics,
  AnalyticsParams,
} from '@/types/api.types';

export async function login(email: string, password: string): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>('/api/admin/login', {
    email,
    password,
  } as LoginRequest);
  return response.data;
}

export async function uploadTimetable(
  file: File,
  name: string,
  onProgress?: (progress: number) => void
): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('name', name);

  return new Promise<UploadResponse>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_URL}/api/admin/timetables/upload`);

    const token = localStorage.getItem('ueab_admin_token');
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = Math.round((event.loaded * 100) / event.total);
        onProgress(progress);
      }
    };

    xhr.onload = () => {
      let payload: any = null;
      try {
        payload = xhr.responseText ? JSON.parse(xhr.responseText) : null;
      } catch {
        payload = null;
      }

      if (xhr.status >= 200 && xhr.status < 300 && payload) {
        resolve(payload as UploadResponse);
        return;
      }

      reject({
        response: {
          status: xhr.status,
          data: payload || { error: xhr.statusText || 'Failed to upload timetable' },
        },
      });
    };

    xhr.onerror = () => {
      reject({ response: { data: { error: 'Network error while uploading timetable' } } });
    };

    xhr.send(formData);
  });
}

export async function publishTimetable(id: string): Promise<void> {
  await apiClient.post(`/api/admin/timetables/${id}/publish`);
}

export async function getTimetables(): Promise<TimetableVersion[]> {
  const response = await apiClient.get<TimetableVersion[]>('/api/admin/timetables');
  return response.data;
}

export async function deleteTimetable(id: string): Promise<void> {
  await apiClient.delete(`/api/admin/timetables/${id}`);
}

export async function getAnalytics(params?: AnalyticsParams): Promise<Analytics> {
  const response = await apiClient.get<Analytics>('/api/admin/analytics', { params });
  return response.data;
}
