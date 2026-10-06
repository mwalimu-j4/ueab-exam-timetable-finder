# UEAB Exam Timetable Finder - Frontend

React + TypeScript + Vite + TanStack Router + Shadcn UI + Tailwind CSS.

## Prerequisites

- Node.js 18+
- pnpm
- Backend API running

## Installation

```bash
pnpm install
cp .env.example .env
```

Edit `.env` with your backend URL.

## Environment Variables

| Variable | Description |
|----------|-------------|
| VITE_API_URL | Backend API URL (default: http://localhost:3001) |

## Running

Development:
```bash
pnpm dev
```

Build:
```bash
pnpm build
pnpm preview
```

## Routes

- `/` - Public exam search
- `/admin/login` - Admin login
- `/admin/dashboard` - Admin dashboard (protected)

## Structure

```
client/
├── src/
│   ├── routes/          # File-based routing
│   ├── components/ui/   # Shadcn components
│   ├── lib/             # API client, auth, utilities
│   ├── services/        # API service layer
│   └── types/           # TypeScript types
└── public/
```

## Features

**Public:**
- Exam search (code, title, instructor, date, building, session)
- Event and visitor tracking

**Admin:**
- JWT authentication
- PDF timetable upload and parsing
- Version management
- Analytics dashboard
