import { apiClient } from '@/lib/api';
import type { Exam, SearchParams } from '@/types/api.types';

export async function searchExams(params: SearchParams): Promise<Exam[]> {
  const response = await apiClient.get<Exam[]>('/api/exams', { params });
  return response.data;
}
