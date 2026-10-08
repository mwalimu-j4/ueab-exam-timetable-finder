import { Request, Response } from 'express';
import { searchExams } from '../services/exam.service';

export async function searchExamsController(req: Request, res: Response) {
  try {
    const { q, date, building, session } = req.query as {
      q?: string;
      date?: string;
      building?: string;
      session?: string;
    };

    const exams = await searchExams({
      query: q,
      date,
      building,
      session,
    });

    // Prevent browser caching of search results
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    res.json(exams);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
}
