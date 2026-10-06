import { Request, Response } from 'express';
import { recordVisit, recordEvent } from '../services/analytics.service';
import { EventType } from '@prisma/client';

export async function recordVisitController(req: Request, res: Response) {
  try {
    const { visitorId } = req.body;
    await recordVisit(visitorId);
    res.json({ message: 'Visit recorded' });
  } catch (error) {
    console.error('Visit recording error:', error);
    res.status(500).json({ error: 'Failed to record visit' });
  }
}

export async function recordEventController(req: Request, res: Response) {
  try {
    const { type, query } = req.body;
    await recordEvent(type as EventType, query);
    res.json({ message: 'Event recorded' });
  } catch (error) {
    console.error('Event recording error:', error);
    res.status(500).json({ error: 'Failed to record event' });
  }
}
