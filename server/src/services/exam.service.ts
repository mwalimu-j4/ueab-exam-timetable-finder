import { prisma } from './prisma';
import { getActiveVersion } from './timetable.service';

interface SearchParams {
  query?: string;
  date?: string;
  building?: string;
  session?: string;
}

export async function searchExams(params: SearchParams) {
  const activeVersion = await getActiveVersion();

  if (!activeVersion) {
    return [];
  }

  const where: any = {
    versionId: activeVersion.id,
  };

  if (params.query) {
    where.OR = [
      { code: { contains: params.query, mode: 'insensitive' } },
      { title: { contains: params.query, mode: 'insensitive' } },
      { instructor: { contains: params.query, mode: 'insensitive' } },
    ];
  }

  if (params.date) {
    const searchDate = new Date(params.date);
    const nextDay = new Date(searchDate);
    nextDay.setDate(nextDay.getDate() + 1);

    where.date = {
      gte: searchDate,
      lt: nextDay,
    };
  }

  if (params.building) {
    where.building = { contains: params.building, mode: 'insensitive' };
  }

  if (params.session) {
    where.option = params.session;
  }

  return prisma.exam.findMany({
    where,
    orderBy: [
      { date: 'asc' },
      { start: 'asc' },
    ],
    take: 100,
  });
}
