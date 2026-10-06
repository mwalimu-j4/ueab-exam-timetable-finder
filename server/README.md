# UEAB Exam Timetable Finder - Backend

Node.js + TypeScript + Express + Prisma + PostgreSQL backend.

## Prerequisites

- Node.js 18+
- pnpm
- PostgreSQL 13+

## Installation

```bash
pnpm install
cp .env.example .env
```

Edit `.env` with your configuration.

## Environment Variables

| Variable | Description |
|----------|-------------|
| DATABASE_URL | PostgreSQL connection string |
| JWT_SECRET | Secret key for JWT tokens (min 32 characters) |
| PORT | Server port (default: 3001) |
| CORS_ORIGIN | Frontend URL for CORS |
| SEED_ADMIN_EMAIL | Admin email for initial seed |
| SEED_ADMIN_PASSWORD | Admin password for initial seed |
| NODE_ENV | Environment: development or production |

## Database Setup

```bash
pnpm db:push
pnpm prisma:generate
pnpm db:seed
```

## Running

Development:
```bash
pnpm dev
```

Production:
```bash
pnpm build
pnpm start
```

## API Routes

### Public

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/exams | Search exams by query, date, building, session |
| POST | /api/visit | Record visitor (body: { visitorId }) |
| POST | /api/events | Record event (body: { type, query? }) |

### Admin (requires JWT)

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/admin/login | Login (body: { email, password }) |
| POST | /api/admin/timetables/upload | Upload PDF (multipart: file, name) |
| POST | /api/admin/timetables/:id/publish | Publish timetable version |
| GET | /api/admin/timetables | List all versions |
| DELETE | /api/admin/timetables/:id | Delete version |
| GET | /api/admin/analytics | Get analytics (query: from?, to?) |

Protected routes require: `Authorization: Bearer <token>`

## Structure

```
server/
├── src/
│   ├── controllers/
│   ├── routes/
│   ├── services/
│   ├── middleware/
│   ├── utils/
│   ├── validators/
│   ├── config/
│   └── types/
└── prisma/
    ├── schema.prisma
    └── seed.ts
```
