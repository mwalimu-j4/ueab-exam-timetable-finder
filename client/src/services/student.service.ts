import { apiClient } from '@/lib/api';
import type { StudentTimetable } from '@/types/api.types';
const TOKEN_KEY = 'ueab_student_token';
export const getStudentToken = () => localStorage.getItem(TOKEN_KEY);
export const clearStudentToken = () => localStorage.removeItem(TOKEN_KEY);
export async function studentSession(payload: { studentId: string; pin: string; mode: 'register' | 'login'; merge?: Array<{ code: string; option: string }> }) {
  const result = await apiClient.post<{ token: string; studentId: string; timetable: StudentTimetable }>('/api/student/session', payload);
  localStorage.setItem(TOKEN_KEY, result.data.token);
  return result.data;
}
export async function getStudentTimetable() { return (await apiClient.get<StudentTimetable>('/api/student/timetable')).data; }
export async function toggleStudentExam(code: string, option: string, isDone: boolean) {
  return (await apiClient.patch<StudentTimetable>(`/api/student/timetable/items/${encodeURIComponent(code)}/${encodeURIComponent(option)}`, { isDone })).data;
}
export async function logoutStudent() { await apiClient.post('/api/student/logout'); clearStudentToken(); }
