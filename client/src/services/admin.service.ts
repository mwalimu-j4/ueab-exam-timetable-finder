import { apiClient } from '@/lib/api';
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

  const response = await apiClient.post<UploadResponse>('/api/admin/timetables/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total && onProgress) {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(progress);
      }
    },
  });
  return response.data;
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
