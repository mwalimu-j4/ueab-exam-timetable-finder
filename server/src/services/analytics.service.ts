import { prisma } from './prisma';
import { getTodayInNairobi } from '../utils/dateUtils';
import { EventType } from '@prisma/client';

export async function recordVisit(visitorId: string) {
  const date = getTodayInNairobi();

  return prisma.visit.upsert({
    where: {
      date_visitorId: {
        date,
        visitorId,
      },
    },
    update: {},
    create: {
      date,
      visitorId,
    },
  });
}

export async function recordEvent(type: EventType, query?: string) {
  return prisma.event.create({
    data: {
      type,
      query,
    },
  });
}

export async function getAnalytics(from?: string, to?: string) {
  const dateFilter: any = {};

  if (from || to) {
    if (from) dateFilter.gte = from;
    if (to) dateFilter.lte = to;
  }

  // Daily unique visitors
  const visits = await prisma.visit.groupBy({
    by: ['date'],
    where: dateFilter.gte || dateFilter.lte ? { date: dateFilter } : undefined,
    _count: {
      visitorId: true,
    },
    orderBy: {
      date: 'asc',
    },
  });

  const dailyVisitors = visits.map(v => ({
    date: v.date,
    count: v._count.visitorId,
  }));

  // Total searches
  const searchCount = await prisma.event.count({
    where: {
      type: 'SEARCH',
      ...(from || to ? {
        createdAt: {
          ...(from ? { gte: new Date(from) } : {}),
          ...(to ? { lte: new Date(to) } : {}),
        },
      } : {}),
    },
  });

  // Downloads by type
  const downloadEvents = await prisma.event.groupBy({
    by: ['type'],
    where: {
      type: {
        in: ['DOWNLOAD_PDF', 'DOWNLOAD_ICS'],
      },
      ...(from || to ? {
        createdAt: {
          ...(from ? { gte: new Date(from) } : {}),
          ...(to ? { lte: new Date(to) } : {}),
        },
      } : {}),
    },
    _count: {
      type: true,
    },
  });

  const downloadsByType = downloadEvents.map(e => ({
    type: e.type,
    count: e._count.type,
  }));

  // Top 20 searched queries
  const topQueries = await prisma.event.groupBy({
    by: ['query'],
    where: {
      type: 'SEARCH',
      query: { not: null },
      ...(from || to ? {
        createdAt: {
          ...(from ? { gte: new Date(from) } : {}),
          ...(to ? { lte: new Date(to) } : {}),
        },
      } : {}),
    },
    _count: {
      query: true,
    },
    orderBy: {
      _count: {
        query: 'desc',
      },
    },
    take: 20,
  });

  const topSearchedQueries = topQueries.map(q => ({
    query: q.query!,
    count: q._count.query,
  }));

  const studentCount = await prisma.student.count();
  const savedExamCount = await prisma.savedExam.count();
  const doneExamCount = await prisma.savedExam.count({ where: { isDone: true } });
  return {
    dailyVisitors,
    totalSearches: searchCount,
    downloadsByType,
    topQueries: topSearchedQueries,
    studentsWithSavedTimetables: studentCount,
    averageSavedExamsPerStudent: studentCount ? savedExamCount / studentCount : 0,
    percentageMarkedDone: savedExamCount ? (doneExamCount / savedExamCount) * 100 : 0,
  };
}
