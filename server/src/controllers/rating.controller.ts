import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { subDays, startOfDay } from 'date-fns';

const prisma = new PrismaClient();

export async function createRating(req: Request, res: Response) {
  try {
    const { stars, comment, clientId, userAgentType } = req.body;

    // Strip HTML from comment if present
    const sanitizedComment = comment
      ? comment.replace(/<[^>]*>/g, '').trim()
      : null;

    // Detect user agent type from request header if not provided
    const detectedUserAgentType = userAgentType || detectUserAgentType(req.headers['user-agent']);

    // Check if this client has already rated in the last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existingRating = await prisma.rating.findFirst({
      where: {
        clientId,
        createdAt: {
          gte: twentyFourHoursAgo,
        },
      },
    });

    if (existingRating) {
      // Update existing rating (upsert behavior)
      await prisma.rating.update({
        where: { id: existingRating.id },
        data: {
          stars,
          comment: sanitizedComment,
          userAgentType: detectedUserAgentType,
          createdAt: new Date(), // Update timestamp
        },
      });
    } else {
      // Create new rating
      await prisma.rating.create({
        data: {
          stars,
          comment: sanitizedComment,
          clientId,
          userAgentType: detectedUserAgentType,
        },
      });
    }

    res.status(201).json({ ok: true });
  } catch (error) {
    console.error('Rating creation error:', error);
    res.status(500).json({ error: 'Failed to submit rating' });
  }
}

export async function getRatingSummary(req: Request, res: Response) {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const startDate = startOfDay(subDays(new Date(), days));

    // Get all ratings within the date range
    const ratings = await prisma.rating.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate average
    const total = ratings.length;
    const average = total > 0
      ? ratings.reduce((sum, r) => sum + r.stars, 0) / total
      : 0;

    // Calculate distribution
    const distribution = [1, 2, 3, 4, 5].map(stars => ({
      stars,
      count: ratings.filter(r => r.stars === stars).length,
    }));

    // Calculate daily counts
    const dailyCountsMap = new Map<string, number>();
    ratings.forEach(rating => {
      const dateKey = startOfDay(rating.createdAt).toISOString().split('T')[0];
      dailyCountsMap.set(dateKey, (dailyCountsMap.get(dateKey) || 0) + 1);
    });

    const dailyCounts = Array.from(dailyCountsMap.entries()).map(([date, count]) => ({
      date,
      count,
    }));

    // Get recent comments (limit 50)
    const recentComments = ratings
      .filter(r => r.comment && r.comment.trim().length > 0)
      .slice(0, 50)
      .map(r => ({
        stars: r.stars,
        comment: r.comment,
        createdAt: r.createdAt,
        userAgentType: r.userAgentType,
      }));

    res.json({
      average: parseFloat(average.toFixed(2)),
      total,
      distribution,
      dailyCounts,
      recentComments,
    });
  } catch (error) {
    console.error('Rating summary error:', error);
    res.status(500).json({ error: 'Failed to retrieve rating summary' });
  }
}

function detectUserAgentType(userAgent?: string): string {
  if (!userAgent) return 'unknown';
  return userAgent.toLowerCase().includes('mobile') ? 'mobile' : 'desktop';
}
