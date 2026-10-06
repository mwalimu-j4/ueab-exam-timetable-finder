export interface Exam {
  id: string;
  versionId: string;
  date: string;
  dayName: string;
  start: string;
  end: string;
  code: string;
  title: string;
  option: string | null;
  instructor: string;
  building: string;
  venue: string;
  rows?: number | null;
  students?: number | null;
}

export interface TimetableVersion {
  id: string;
  name: string;
  pdfUrl?: string | null;
  rowCount: number;
  isActive: boolean;
  uploadedAt: string;
}

export interface UploadResponse {
  versionId: string;
  rowCount: number;
  sampleRows: Exam[];
  unparsedLines: string[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  email: string;
}

export interface SearchParams {
  q?: string;
  date?: string;
  building?: string;
  session?: string;
}

export interface AnalyticsParams {
  from?: string;
  to?: string;
}

export interface Analytics {
  dailyVisitors: Array<{ date: string; count: number }>;
  totalSearches: number;
  downloadsByType: Array<{ type: string; count: number }>;
  topQueries: Array<{ query: string; count: number }>;
}

export type EventType = 'SEARCH' | 'DOWNLOAD_PDF' | 'DOWNLOAD_ICS' | 'ADD_COURSE';

export interface RecordEventRequest {
  type: EventType;
  query?: string;
}

export interface RecordVisitRequest {
  visitorId: string;
}
