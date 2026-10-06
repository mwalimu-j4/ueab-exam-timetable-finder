# UEAB Exam Timetable Finder - Backend

Node.js + TypeScript + Express + Prisma + PostgreSQL backend for the UEAB Exam Timetable Finder application.

## Prerequisites

- Node.js 18+ 
- pnpm (install with `npm install -g pnpm`)
- PostgreSQL 13+

## Installation

1. Install dependencies:
```bash
pnpm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and configure:
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Random secret key for JWT tokens (min 32 characters)
- `PORT`: Server port (default: 3001)
- `CORS_ORIGIN`: Frontend URL (default: http://localhost:5173)
- `SEED_ADMIN_EMAIL`: Admin email for seeding
- `SEED_ADMIN_PASSWORD`: Admin password for seeding

## Database Setup

1. Create PostgreSQL database:
```bash
createdb ueab_timetable
```

2. Push schema to database:
```bash
pnpm db:push
```

3. Generate Prisma client:
```bash
pnpm prisma:generate
```

4. Seed admin user:
```bash
pnpm db:seed
```

## Development

Start the development server with hot reload:
```bash
pnpm dev
```

The server will run on http://localhost:3001

## Production

1. Build the application:
```bash
pnpm build
```

2. Start the production server:
```bash
pnpm start
```

## API Endpoints

### Public Routes

- `GET /api/exams?q=&date=&building=&session=` - Search exams
- `POST /api/visit` - Record visitor (body: `{ visitorId: string }`)
- `POST /api/events` - Record event (body: `{ type: EventType, query?: string }`)

### Admin Routes (require JWT authentication)

- `POST /api/admin/login` - Admin login (body: `{ email, password }`)
- `POST /api/admin/timetables/upload` - Upload PDF timetable (multipart form-data, field: `file`)
- `POST /api/admin/timetables/:id/publish` - Publish a timetable version
- `GET /api/admin/timetables` - List all timetable versions
- `DELETE /api/admin/timetables/:id` - Delete a timetable version
- `GET /api/admin/analytics?from=&to=` - Get analytics data

### Authentication

Protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Database Management

- Open Prisma Studio: `pnpm prisma:studio`
- Create migration: `pnpm prisma:migrate`
- Reset database: `pnpm prisma migrate reset`

## Project Structure

```
server/
├── src/
│   ├── controllers/     - Request handlers
│   ├── routes/          - Route definitions
│   ├── services/        - Business logic
│   ├── middleware/      - Express middleware
│   ├── utils/           - Utility functions
│   ├── validators/      - Zod schemas
│   ├── config/          - Configuration files
│   ├── types/           - TypeScript types
│   ├── app.ts           - Express app setup
│   └── server.ts        - Server entry point
├── prisma/
│   ├── schema.prisma    - Database schema
│   └── seed.ts          - Database seeding
└── package.json
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| DATABASE_URL | PostgreSQL connection string | - |
| JWT_SECRET | Secret key for JWT tokens | - |
| PORT | Server port | 3001 |
| CORS_ORIGIN | Allowed CORS origin | http://localhost:5173 |
| SEED_ADMIN_EMAIL | Admin email for seeding | admin@ueab.ac.ke |
| SEED_ADMIN_PASSWORD | Admin password for seeding | admin123 |
| NODE_ENV | Environment (development/production) | development |

## Features

- **JWT Authentication**: Secure admin authentication with bcrypt password hashing
- **PDF Parsing**: Extracts exam data from PDF timetables using pdfjs-dist
- **Rate Limiting**: Protects endpoints from abuse
- **Analytics**: Tracks visitor statistics and search queries
- **Validation**: Request validation using Zod schemas
- **Security**: Helmet middleware for security headers
- **CORS**: Configurable CORS support
- **Error Handling**: Centralized error handling middleware
- **Type Safety**: Full TypeScript coverage

## License

ISC
