import { prisma } from './prisma';
import { ParsedExam } from '../utils/pdfParser';

export async function createTimetableVersion(name: string, pdfUrl: string | undefined, rowCount: number) {
  return prisma.timetableVersion.create({
    data: {
      name,
      pdfUrl,
      rowCount,
      isActive: false,
    },
  });
}

export async function bulkCreateExams(versionId: string, exams: ParsedExam[]) {
  return prisma.exam.createMany({
    data: exams.map(exam => ({
      versionId,
      date: exam.date,
      dayName: exam.dayName,
      start: exam.start,
      end: exam.end,
      code: exam.code,
      title: exam.title,
      option: exam.option,
      instructor: exam.instructor,
      building: exam.building,
      venue: exam.venue,
      rows: exam.rows,
      students: exam.students,
    })),
  });
}

export async function publishTimetableVersion(id: string) {
  return prisma.$transaction(async (tx) => {
    await tx.timetableVersion.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    return tx.timetableVersion.update({
      where: { id },
      data: { isActive: true },
    });
  });
}

export async function getAllVersions() {
  return prisma.timetableVersion.findMany({
    orderBy: { uploadedAt: 'desc' },
  });
}

export async function deleteVersion(id: string) {
  const version = await prisma.timetableVersion.findUnique({
    where: { id },
  });

  if (!version) {
    throw new Error('Version not found');
  }

  if (version.isActive) {
    throw new Error('Cannot delete active version');
  }

  return prisma.timetableVersion.delete({
    where: { id },
  });
}

export async function getActiveVersion() {
  return prisma.timetableVersion.findFirst({
    where: { isActive: true },
  });
}
