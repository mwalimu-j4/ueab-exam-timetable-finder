import { apiClient } from '@/lib/api';

export interface SubmitRatingData {
  stars: number;
  comment?: string;
  clientId: string;
  userAgentType?: string;
}

export interface RatingSummary {
  average: number;
  total: number;
  distribution: Array<{ stars: number; count: number }>;
  dailyCounts: Array<{ date: string; count: number }>;
  recentComments: Array<{
    stars: number;
    comment: string;
    createdAt: string;
    userAgentType: string;
  }>;
}

export async function submitRating(data: SubmitRatingData): Promise<{ ok: boolean }> {
  const response = await apiClient.post('/api/ratings', data);
  return response.data;
}

export async function getRatingSummary(days?: number): Promise<RatingSummary> {
  const params = days ? { days: days.toString() } : {};
  const response = await apiClient.get<RatingSummary>('/api/admin/ratings/summary', { params });
  return response.data;
}
