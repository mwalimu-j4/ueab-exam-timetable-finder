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
| DATABASE_URL | PostgreSQL connection string (Neon) |
| DIRECT_URL | Direct PostgreSQL connection (for migrations, optional) |
| JWT_SECRET | Secret key for JWT tokens (min 32 characters) |
| PORT | Server port (default: 3001) |
| CORS_ORIGIN | Frontend URL for CORS |
| ADMIN_EMAIL | Initial admin email (only for first deployment) |
| ADMIN_PASSWORD | Initial admin password (only for first deployment) |
| NODE_ENV | Environment: development or production |

**Note:** `ADMIN_EMAIL` and `ADMIN_PASSWORD` are only needed for the initial deployment to seed the admin user. After the first successful deployment, you can delete these variables from Render as the admin will be persisted in the database.

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


## Render Deployment

### Initial Setup

1. **Create Render Web Service** from the repository
2. **Set Environment Variables** in Render dashboard:
   - `DATABASE_URL` - Your Neon PostgreSQL connection string
   - `JWT_SECRET` - Generate a secure 32+ character secret
   - `CORS_ORIGIN` - Your frontend URL (e.g., `https://your-app.onrender.com`)
   - `ADMIN_EMAIL` - Your admin email (e.g., `admin@yourdomain.com`)
   - `ADMIN_PASSWORD` - A secure admin password
   - `NODE_ENV` - Set to `production`
   - `PORT` - Leave as `10000` (Render default)

3. **Deploy** - Render will automatically:
   - Install dependencies
   - Generate Prisma client
   - Build TypeScript
   - Push database schema to Neon (`prisma db push`)
   - Seed admin user
   - Start the server

### Post-Deployment

After the first successful deployment:

1. **Test Admin Login** at `/api/admin/login` with your credentials
2. **Delete Temporary Variables** from Render dashboard:
   - Remove `ADMIN_EMAIL`
   - Remove `ADMIN_PASSWORD`
3. The admin user is now permanently stored in the database

### Subsequent Deployments

Future deployments will:
- Skip seeding if `ADMIN_EMAIL` and `ADMIN_PASSWORD` are not set
- Use the existing admin from the database
- Apply any schema changes with `prisma db push`

### Database Management

**Neon Database:**
- Connection pooling is automatic
- No server-side migrations needed (`prisma db push` handles schema sync)
- Use Neon dashboard for direct database access if needed

**Schema Changes:**
- Update `prisma/schema.prisma`
- Commit and push
- Render will automatically run `prisma db push` during build
