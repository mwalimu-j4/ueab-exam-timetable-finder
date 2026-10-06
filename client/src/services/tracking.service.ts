import { apiClient } from '@/lib/api';
import type { RecordEventRequest, RecordVisitRequest } from '@/types/api.types';

export async function recordVisit(visitorId: string): Promise<void> {
  await apiClient.post<void>('/api/visit', { visitorId } as RecordVisitRequest);
}

export async function recordEvent(request: RecordEventRequest): Promise<void> {
  await apiClient.post<void>('/api/events', request);
}
