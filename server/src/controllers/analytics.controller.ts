import { Request, Response } from 'express';
import { getAnalytics } from '../services/analytics.service';

export async function getAnalyticsController(req: Request, res: Response) {
  try {
    const { from, to } = req.query as { from?: string; to?: string };
    const analytics = await getAnalytics(from, to);
    res.json(analytics);
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
}
