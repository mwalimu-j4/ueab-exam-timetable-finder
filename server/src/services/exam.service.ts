import { prisma } from './prisma';
import { getActiveVersion } from './timetable.service';

interface SearchParams {
  query?: string;
  date?: string;
  building?: string;
  session?: string;
}

function normalizeCourseCode(value: string): string {
  return value.replace(/[^a-z0-9]/gi, '').toLowerCase();
}

export async function searchExams(params: SearchParams) {
  const activeVersion = await getActiveVersion();

  if (!activeVersion) {
    return [];
  }

  const where: any = {
    versionId: activeVersion.id,
  };

  const normalizedQuery = params.query ? normalizeCourseCode(params.query) : '';

  if (params.query) {
    where.OR = [
      { code: { contains: params.query, mode: 'insensitive' } },
      { title: { contains: params.query, mode: 'insensitive' } },
      { instructor: { contains: params.query, mode: 'insensitive' } },
    ];

    const compactCourseCodeMatch = normalizedQuery.match(/^([a-z]{2,4})(\d{3,4}[a-z]?)$/i);
    if (compactCourseCodeMatch) {
      where.OR.push({
        code: {
          contains: `${compactCourseCodeMatch[1]} ${compactCourseCodeMatch[2]}`,
          mode: 'insensitive',
        },
      });
    }
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

  const exams = await prisma.exam.findMany({
    where,
    orderBy: [
      { date: 'asc' },
      { start: 'asc' },
    ],
    take: 100,
  });

  if (!normalizedQuery) {
    return exams;
  }

  return exams.sort((a, b) => {
    const aCode = normalizeCourseCode(a.code);
    const bCode = normalizeCourseCode(b.code);
    const aExact = aCode === normalizedQuery;
    const bExact = bCode === normalizedQuery;

    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;
    return 0;
  });
}
