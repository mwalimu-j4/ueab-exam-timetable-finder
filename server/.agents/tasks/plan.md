# Implementation Plan: UEAB Exam Timetable Finder

## Overview
Full-stack application with Node.js + TypeScript + Express + Prisma + PostgreSQL backend and React + TypeScript + TanStack Router + Shadcn UI frontend.

---

## BACKEND IMPLEMENTATION (f:\UEABEXAMSTIMETABLE\server)

### Phase 1: Project Setup & Configuration

- [ ] 1. Initialize backend project structure and install dependencies.
      Create package.json with pnpm, install express, typescript, prisma, @prisma/client, bcrypt, jsonwebtoken, zod, helmet, cors, express-rate-limit, multer, pdfjs-dist, date-fns-tz, dotenv, and dev dependencies (@types/*, ts-node-dev, tsx).
      Files: 
        - server/package.json
        - server/tsconfig.json
        - server/.env.example
        - server/.gitignore
      Verify: `cd server && pnpm install` completes without errors.

- [ ] 2. Create Prisma schema with all models and relationships.
      Define TimetableVersion (id, name, pdfUrl optional, rowCount, isActive default false, uploadedAt), Exam (id, versionId FK with onDelete Cascade, date DateTime, dayName, start, end, code, title, option, instructor, building, venue, rows optional, students optional, with @@index on versionId/code/date), Visit (id, date string, visitorId with @@unique([date, visitorId])), Event (id, type enum SEARCH/DOWNLOAD_PDF/DOWNLOAD_ICS/ADD_COURSE, query optional, createdAt), Admin (id, email unique, passwordHash).
      Files: 
        - server/prisma/schema.prisma
      Verify: `cd server && pnpm prisma format` runs without errors.

- [ ] 3. Create environment configuration and types.
      Define PORT, DATABASE_URL, JWT_SECRET, JWT_EXPIRES_IN, NODE_ENV with validation using zod schema. Create type-safe config loader that throws on missing vars.
      Files: 
        - server/src/config/env.ts
        - server/src/types/express.d.ts (extend Express Request with user property)
      Verify: `cd server && pnpm exec tsx src/config/env.ts` validates env vars.

### Phase 2: Core Utilities & Middleware

- [ ] 4. Create authentication utilities (bcrypt + JWT).
      Implement hashPassword, comparePassword, generateToken, verifyToken functions with proper types.
      Files: 
        - server/src/utils/auth.ts
      Verify: `cd server && pnpm exec tsx -e "import { hashPassword } from './src/utils/auth'; hashPassword('test').then(console.log)"` outputs hash.

- [ ] 5. Create authentication middleware.
      Implement authMiddleware that extracts Bearer token, verifies JWT, attaches decoded user to req.user, returns 401 on invalid/missing token.
      Files: 
        - server/src/middleware/auth.middleware.ts
      Verify: Code review - middleware properly typed and handles edge cases.

- [ ] 6. Create validation middleware factory.
      Implement validateRequest(schema) that validates req.body/query/params using zod, returns 400 with error details on failure.
      Files: 
        - server/src/middleware/validation.middleware.ts
      Verify: Code review - middleware properly typed and returns structured errors.

- [ ] 7. Create error handling middleware.
      Implement global error handler that catches all errors, logs them, returns appropriate status codes (500 for unknown, preserves status for known errors), never leaks stack traces in production.
      Files: 
        - server/src/middleware/error.middleware.ts
      Verify: Code review - handles Prisma errors, Zod errors, and generic errors.

- [ ] 8. Create rate limiting configuration.
      Configure express-rate-limit for public routes (100 req/15min per IP) and stricter limits for upload (10 req/15min).
      Files: 
        - server/src/middleware/rate-limit.middleware.ts
      Verify: Code review - limits properly configured.

### Phase 3: PDF Parsing Service

- [ ] 9. Create PDF parser service with pdfjs-dist.
      Implement parseTimetablePDF(buffer) that: (1) loads PDF with pdfjs-dist, (2) extracts all text content, (3) applies regex to match rows: weekday (Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday) followed by DD-MM-YYYY or DD - MM - YYYY (spaces tolerated), then HH:MM, HH:MM, course code (letters+numbers), then splits remainder into title, option (exact match: Main, Group A/B/C/D, Inter Session 1/2, Blended Online), instructor (starts with Mr./Mrs./Ms./Dr./Prof. followed by name), building, venue, rows (optional number), students (optional number), (4) strips repeated page headers by detecting duplicate rows with same date+time+code pattern, (5) returns { exams: ParsedExam[], unparsedLines: string[] }.
      Files: 
        - server/src/services/pdf-parser.service.ts
        - server/src/types/parser.types.ts
      Verify: Create test PDF text fixture and run `cd server && pnpm exec tsx src/services/pdf-parser.service.ts` with sample data, verify parsing logic.

### Phase 4: Database Services

- [ ] 10. Create Prisma client singleton.
      Initialize PrismaClient with proper connection pooling and logging config based on NODE_ENV.
      Files: 
        - server/src/services/prisma.service.ts
      Verify: `cd server && pnpm exec tsx -e "import { prisma } from './src/services/prisma.service'; prisma.$connect().then(() => console.log('Connected'))"` connects successfully (requires running Postgres).

- [ ] 11. Create timetable service.
      Implement createTimetableVersion(name, pdfUrl, rowCount), publishTimetableVersion(id) with transaction (set all inactive, then target active), getAllVersions(), deleteVersion(id) that blocks if isActive, getActiveVersion(), bulkCreateExams(versionId, exams[]).
      Files: 
        - server/src/services/timetable.service.ts
      Verify: Code review - all functions use Prisma client correctly with proper types.

- [ ] 12. Create exam service.
      Implement searchExams({ query?, date?, building?, session? }) that queries only active version, filters by code/title/instructor (case-insensitive partial match using Prisma contains mode: 'insensitive'), date (exact match), building/option (exact match), limits to 100 results, orders by date ASC then start ASC.
      Files: 
        - server/src/services/exam.service.ts
      Verify: Code review - query uses proper Prisma where clauses and includes versionId filter.

- [ ] 13. Create analytics service.
      Implement recordVisit(visitorId) using upsert with date string YYYY-MM-DD in Africa/Nairobi timezone (use date-fns-tz), recordEvent(type, query?), getAnalytics(from?, to?) that returns: dailyVisitors (group by date, count distinct visitorId), totalSearches (count Events where type=SEARCH), downloadsByType (group Events by type for DOWNLOAD_* types), topQueries (group Events by query, count, order by count DESC, limit 20, exclude nulls).
      Files: 
        - server/src/services/analytics.service.ts
      Verify: Code review - upsert uses correct unique constraint [date, visitorId], timezone conversion is correct.

### Phase 5: Zod Validation Schemas

- [ ] 14. Create all request validation schemas.
      Define schemas for: loginSchema { email, password }, uploadTimetableSchema (multipart validation logic in route), publishSchema { id: string }, searchExamsSchema { q?, date?, building?, session? }, visitSchema { visitorId: string }, eventSchema { type: enum, query? optional }, analyticsQuerySchema { from?: string date, to?: string date }.
      Files: 
        - server/src/validators/admin.validator.ts
        - server/src/validators/public.validator.ts
      Verify: `cd server && pnpm exec tsx -e "import { loginSchema } from './src/validators/admin.validator'; console.log(loginSchema.parse({ email: 'test@example.com', password: 'pass123' }))"` parses successfully.

### Phase 6: Controllers

- [ ] 15. Create admin authentication controller.
      Implement login(req, res) that validates credentials against Admin table, compares password hash, generates JWT, returns { token, email }.
      Files: 
        - server/src/controllers/admin-auth.controller.ts
      Verify: Code review - uses auth utils, handles invalid credentials with 401.

- [ ] 16. Create admin timetable controller.
      Implement uploadTimetable(req, res) that: (1) validates file is PDF, max 15MB, (2) parses with PDF parser service, (3) creates TimetableVersion (inactive) and bulk creates Exams in transaction, (4) returns { versionId, rowCount, sampleRows: first 20, unparsedLines }. Implement publishTimetable(req, res) calling service. Implement listTimetables(req, res) and deleteTimetable(req, res).
      Files: 
        - server/src/controllers/admin-timetable.controller.ts
      Verify: Code review - handles multer errors, validates PDF mime type, uses transactions.

- [ ] 17. Create admin analytics controller.
      Implement getAnalytics(req, res) that validates query params (from/to optional date strings), calls analytics service, returns structured response.
      Files: 
        - server/src/controllers/admin-analytics.controller.ts
      Verify: Code review - validates date format, handles missing params.

- [ ] 18. Create public exam controller.
      Implement searchExams(req, res) that validates query params, calls exam service, returns exams array.
      Files: 
        - server/src/controllers/exam.controller.ts
      Verify: Code review - applies rate limiting, validates input.

- [ ] 19. Create public tracking controller.
      Implement recordVisit(req, res) that validates visitorId, calls analytics service upsert (idempotent), returns success. Implement recordEvent(req, res) that validates type and optional query, calls analytics service, returns success.
      Files: 
        - server/src/controllers/tracking.controller.ts
      Verify: Code review - both endpoints are idempotent.

### Phase 7: Routes

- [ ] 20. Create admin routes with auth middleware.
      Define POST /api/admin/login (no auth), POST /api/admin/timetables/upload (with auth + multer memory storage PDF filter 15MB max), POST /api/admin/timetables/:id/publish (with auth), GET /api/admin/timetables (with auth), DELETE /api/admin/timetables/:id (with auth), GET /api/admin/analytics (with auth). Apply validation middleware to each route.
      Files: 
        - server/src/routes/admin.routes.ts
        - server/src/config/multer.config.ts
      Verify: Code review - all routes properly wired with middleware chain.

- [ ] 21. Create public routes with rate limiting.
      Define GET /api/exams (rate limited 100/15min), POST /api/visit (rate limited 100/15min), POST /api/events (rate limited 100/15min). Apply validation middleware.
      Files: 
        - server/src/routes/public.routes.ts
      Verify: Code review - rate limits applied, validation in place.

### Phase 8: Application Entry Point

- [ ] 22. Create Express app configuration.
      Initialize express app with: helmet (security headers), cors (configure allowed origins from env), express.json(), express.urlencoded(), mount routes (/api/admin, /api), error middleware (must be last), 404 handler.
      Files: 
        - server/src/app.ts
      Verify: Code review - middleware order correct, CORS configured.

- [ ] 23. Create server entry point.
      Import app, load env config, start server on PORT, handle graceful shutdown (close Prisma on SIGTERM/SIGINT).
      Files: 
        - server/src/server.ts
      Verify: `cd server && pnpm prisma generate && pnpm exec tsx src/server.ts` starts server (will fail if DB not ready, that's expected).

### Phase 9: Database & Seed

- [ ] 24. Create admin seed script.
      Script that: (1) reads ADMIN_EMAIL and ADMIN_PASSWORD from env or prompts, (2) hashes password, (3) upserts Admin record (on email conflict, update hash).
      Files: 
        - server/src/scripts/seed-admin.ts
      Verify: `cd server && ADMIN_EMAIL=admin@test.com ADMIN_PASSWORD=admin123 pnpm exec tsx src/scripts/seed-admin.ts` creates admin (requires DB).

- [ ] 25. Create package.json scripts.
      Add scripts: "dev": "tsx watch src/server.ts", "build": "tsc", "start": "node dist/server.js", "prisma:generate": "prisma generate", "prisma:migrate": "prisma migrate dev", "prisma:studio": "prisma studio", "seed:admin": "tsx src/scripts/seed-admin.ts".
      Files: 
        - server/package.json (modify)
      Verify: `cd server && pnpm run --help` lists all scripts.

### Phase 10: Backend Documentation

- [ ] 26. Create backend README with setup instructions.
      Document: prerequisites (Node 18+, pnpm, PostgreSQL), installation steps (pnpm install, copy .env.example to .env, set DATABASE_URL/JWT_SECRET/ADMIN_EMAIL/ADMIN_PASSWORD), database setup (pnpm prisma:migrate, pnpm seed:admin), running dev server (pnpm dev), API endpoints (list all routes with examples), environment variables (document all required vars).
      Files: 
        - server/README.md
      Verify: Manual review - all steps documented clearly.

---

## FRONTEND IMPLEMENTATION (f:\UEABEXAMSTIMETABLE\client)

### Phase 11: Frontend Project Setup

- [ ] 27. Initialize React + TypeScript + Vite project with pnpm.
      Create package.json with dependencies: react, react-dom, @tanstack/react-router, @tanstack/react-query, zod, react-hook-form, @hookform/resolvers, date-fns, axios. Dev dependencies: vite, @vitejs/plugin-react, typescript, tailwindcss, postcss, autoprefixer, @types/*.
      Files: 
        - client/package.json
        - client/tsconfig.json (with paths alias @ -> ./src)
        - client/tsconfig.node.json
        - client/vite.config.ts (with alias and TanStack Router plugin if needed)
        - client/.gitignore
      Verify: `cd client && pnpm install` completes without errors.

- [ ] 28. Initialize Tailwind CSS configuration.
      Run tailwind init, configure content paths to include ./src/**/*.{js,ts,jsx,tsx}, set up CSS layers in index.css.
      Files: 
        - client/tailwind.config.js
        - client/postcss.config.js
        - client/src/index.css
      Verify: Tailwind directives present in CSS, config has correct content paths.

- [ ] 29. Install and configure Shadcn UI.
      Run shadcn-ui init with tailwind config, set up components.json with alias @/components, style default, install initial components: button, input, label, card, table, dialog, form, select, toast.
      Files: 
        - client/components.json
        - client/src/components/ui/* (button, input, card, etc.)
        - client/src/lib/utils.ts (cn helper)
      Verify: `cd client && pnpm dlx shadcn-ui@latest add button` installs component successfully.

### Phase 12: TanStack Router Setup

- [ ] 30. Set up TanStack Router with file-based routing.
      Create route tree: __root.tsx (root layout with Outlet), index.tsx (public exam search page), admin/login.tsx (admin login), admin/dashboard.tsx (authenticated, redirects if no token), admin/_layout.tsx (admin layout with nav). Configure router in main.tsx.
      Files: 
        - client/src/routes/__root.tsx
        - client/src/routes/index.tsx
        - client/src/routes/admin/login.tsx
        - client/src/routes/admin/_layout.tsx
        - client/src/routes/admin/dashboard.tsx
        - client/src/routeTree.gen.ts (generated by TanStack Router)
        - client/src/main.tsx
      Verify: `cd client && pnpm dev` starts dev server, navigate to / and /admin/login routes.

### Phase 13: API Client & Services

- [ ] 31. Create Axios API client with interceptors.
      Configure base URL from env (VITE_API_URL), add request interceptor to attach Authorization header if token exists in localStorage, add response interceptor to handle 401 (clear token, redirect to login).
      Files: 
        - client/src/lib/api-client.ts
        - client/src/lib/auth-storage.ts (getToken, setToken, clearToken helpers)
        - client/.env.example (VITE_API_URL)
      Verify: Code review - interceptors properly configured.

- [ ] 32. Create API service functions.
      Implement: adminLogin(email, password), uploadTimetable(file, onProgress?), publishTimetable(id), getTimetables(), deleteTimetable(id), getAnalytics(from?, to?), searchExams(params), recordVisit(visitorId), recordEvent(type, query?). All return typed responses using zod schemas.
      Files: 
        - client/src/services/admin.service.ts
        - client/src/services/exam.service.ts
        - client/src/services/tracking.service.ts
        - client/src/types/api.types.ts
      Verify: Code review - all functions use api-client, properly typed.

### Phase 14: State Management & Hooks

- [ ] 33. Create TanStack Query hooks for data fetching.
      Define useExamSearch(params), useTimetables(), useAnalytics(from, to) with proper query keys, staleTime, and error handling.
      Files: 
        - client/src/hooks/use-exam-search.ts
        - client/src/hooks/use-timetables.ts
        - client/src/hooks/use-analytics.ts
      Verify: Code review - queries properly configured with TanStack Query.

- [ ] 34. Create authentication hooks and context.
      Implement useAuth() hook that provides: isAuthenticated (check token exists), login(email, password), logout (clear token + invalidate queries), token. Create AuthProvider using React context.
      Files: 
        - client/src/hooks/use-auth.ts
        - client/src/contexts/auth-context.tsx
      Verify: Code review - context properly typed, login/logout work correctly.

- [ ] 35. Create visitor ID generation and tracking hook.
      Generate unique visitor ID on first visit (UUID stored in localStorage), implement useVisitorTracking() that calls recordVisit on mount (once per day).
      Files: 
        - client/src/hooks/use-visitor-tracking.ts
        - client/src/lib/visitor-id.ts
      Verify: Code review - visitor ID persists across sessions.

### Phase 15: Public Exam Search Interface

- [ ] 36. Create exam search form component.
      Build form with react-hook-form + zod validation, inputs for: query (text), date (date picker), building (text), session/option (select with options: Main, Group A/B/C/D, Inter Session 1/2, Blended Online). Submit triggers search. Use Shadcn Form, Input, Select components.
      Files: 
        - client/src/components/exam-search-form.tsx
        - client/src/validators/search.validator.ts
      Verify: `cd client && pnpm dev`, navigate to /, form renders with all fields.

- [ ] 37. Create exam results table component.
      Display search results in responsive table using Shadcn Table component. Columns: Date, Day, Time (start-end), Code, Title, Option, Instructor, Venue. Show loading state, empty state, error state. Include "Download ICS" and "Add Course" buttons per row that call recordEvent.
      Files: 
        - client/src/components/exam-results-table.tsx
      Verify: `cd client && pnpm dev`, mock data renders in table correctly.

- [ ] 38. Create public exam search page.
      Compose ExamSearchForm + ExamResultsTable, wire up useExamSearch hook, show results, track search events, include useVisitorTracking hook.
      Files: 
        - client/src/routes/index.tsx (modify)
      Verify: `cd client && pnpm dev`, navigate to /, full search flow works (will fail without backend).

### Phase 16: Admin Authentication

- [ ] 39. Create admin login form component.
      Build form with react-hook-form + zod, fields: email (email validation), password (min 6 chars). Submit calls useAuth().login, shows errors, redirects to dashboard on success. Use Shadcn Form, Input, Button components.
      Files: 
        - client/src/components/admin-login-form.tsx
        - client/src/validators/admin.validator.ts
      Verify: `cd client && pnpm dev`, navigate to /admin/login, form renders and validates.

- [ ] 40. Create admin login page and auth guard.
      Implement login route using AdminLoginForm. Create ProtectedRoute component that checks useAuth().isAuthenticated, redirects to /admin/login if false. Wrap admin dashboard with ProtectedRoute.
      Files: 
        - client/src/routes/admin/login.tsx (modify)
        - client/src/components/protected-route.tsx
      Verify: `cd client && pnpm dev`, /admin/dashboard redirects to login when not authenticated.

### Phase 17: Admin Dashboard - Timetable Management

- [ ] 41. Create timetable upload form component.
      Build form with file input (PDF only, 15MB max validation), upload button, progress indicator during upload. On success, show versionId, rowCount, sampleRows (first 20 in table), unparsedLines (if any, show warning list). Use Shadcn Form, Input type="file", Button, Card components.
      Files: 
        - client/src/components/timetable-upload-form.tsx
      Verify: `cd client && pnpm dev`, form validates PDF file type and size locally.

- [ ] 42. Create timetable versions list component.
      Display all versions in table with columns: Name, Row Count, Active Status (badge), Uploaded At. Actions per row: Publish button (disabled if active), Delete button (disabled if active). Confirm dialogs for destructive actions. Use Shadcn Table, Badge, Button, Dialog components.
      Files: 
        - client/src/components/timetable-versions-list.tsx
      Verify: `cd client && pnpm dev`, mock data renders with action buttons.

- [ ] 43. Create analytics dashboard component.
      Date range picker (from/to), fetch analytics on range change, display: Daily Visitors (line chart or table), Total Searches (number card), Downloads by Type (bar chart or list), Top 20 Queries (table with query + count). Use Shadcn Card, Table components. Charts can be simple HTML/CSS or recharts if available.
      Files: 
        - client/src/components/analytics-dashboard.tsx
      Verify: `cd client && pnpm dev`, date pickers work, layout responsive.

- [ ] 44. Create admin dashboard page composing all admin components.
      Layout with navigation (Timetables, Analytics tabs or sections), logout button. Compose TimetableUploadForm, TimetableVersionsList, AnalyticsDashboard. Wire up all hooks (useTimetables, useAnalytics).
      Files: 
        - client/src/routes/admin/dashboard.tsx (modify)
        - client/src/routes/admin/_layout.tsx (modify - add nav and logout)
      Verify: `cd client && pnpm dev`, full admin dashboard functional with all sections.

### Phase 18: Frontend Polish & Configuration

- [ ] 45. Create loading and error boundary components.
      Implement global ErrorBoundary component, loading spinner component, toast notifications for success/error feedback using Shadcn Toast/Sonner.
      Files: 
        - client/src/components/error-boundary.tsx
        - client/src/components/loading-spinner.tsx
        - client/src/components/ui/sonner.tsx (if using sonner for toasts)
      Verify: Code review - ErrorBoundary catches errors, toasts configured.

- [ ] 46. Implement responsive design and accessibility.
      Ensure all components are mobile-responsive (use Tailwind responsive classes), add proper ARIA labels to forms and buttons, ensure keyboard navigation works, add focus states.
      Files: 
        - client/src/components/* (review all components)
        - client/src/index.css (add focus-visible styles)
      Verify: `cd client && pnpm dev`, test on mobile viewport, tab navigation works.

- [ ] 47. Create frontend README with setup instructions.
      Document: prerequisites (Node 18+, pnpm), installation (pnpm install), environment setup (copy .env.example, set VITE_API_URL), running dev server (pnpm dev), building for production (pnpm build), project structure (routes, components, services), Shadcn UI usage.
      Files: 
        - client/README.md
      Verify: Manual review - all steps clear.

---

## INTEGRATION & FINAL VERIFICATION

### Phase 19: Integration Testing & Build

- [ ] 48. Set up PostgreSQL database and run Prisma migrations.
      Start PostgreSQL instance (Docker or local), create database, configure DATABASE_URL in server/.env, run `pnpm prisma:migrate`, verify schema created.
      Files: 
        - server/.env (user creates from .env.example)
      Verify: `cd server && pnpm prisma migrate dev --name init` creates tables, `pnpm prisma studio` shows empty tables.

- [ ] 49. Seed admin user and test authentication flow.
      Run seed script with credentials, test login endpoint with curl or Postman, verify JWT returned.
      Files: None (runtime verification)
      Verify: `cd server && ADMIN_EMAIL=admin@ueab.ac.ke ADMIN_PASSWORD=SecurePass123 pnpm seed:admin`, then `curl -X POST http://localhost:PORT/api/admin/login -H "Content-Type: application/json" -d '{"email":"admin@ueab.ac.ke","password":"SecurePass123"}'` returns token.

- [ ] 50. Test full timetable upload flow end-to-end.
      Start backend dev server, use Postman or frontend to upload a sample PDF (create test PDF with format: "Monday 15-01-2024 09:00 12:00 CS101 ..."), verify parsing, check database has TimetableVersion and Exam records, test publish endpoint, test search endpoint returns results.
      Files: None (runtime verification)
      Verify: Upload PDF via POST /api/admin/timetables/upload with auth header, verify response has versionId and sampleRows, check Prisma Studio shows data.

- [ ] 51. Build both backend and frontend for production.
      Run `pnpm build` in server (TypeScript compilation to dist/), run `pnpm build` in client (Vite production build to dist/), verify no TypeScript errors, no build warnings.
      Files: 
        - server/dist/* (generated)
        - client/dist/* (generated)
      Verify: `cd server && pnpm build` succeeds with exit code 0, `cd client && pnpm build` succeeds with exit code 0, both dist/ folders contain output.

- [ ] 52. Create root README with monorepo overview.
      Document project structure (server + client), link to individual READMEs, provide quick start guide (start backend, start frontend), architecture overview.
      Files: 
        - f:\UEABEXAMSTIMETABLE\README.md
      Verify: Manual review - README clear and complete.

---

## Key Implementation Notes

### PDF Parsing Regex Strategy
The PDF parser must handle these patterns with tolerance for spacing variations:
- Date line: `(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s+(\d{2})\s*-\s*(\d{2})\s*-\s*(\d{4})`
- Time: `(\d{2}:\d{2})\s+(\d{2}:\d{2})`
- Course code: `([A-Z]{2,4}\s?\d{3,4}[A-Z]?)`
- Option keywords: exact match on "Main", "Group A", "Group B", "Group C", "Group D", "Inter Session 1", "Inter Session 2", "Blended Online"
- Instructor prefix: `(Mr\.|Mrs\.|Ms\.|Dr\.|Prof\.)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)`
- Header detection: if 3+ consecutive rows have identical date+time+code, treat as repeated headers and deduplicate

### Prisma Schema Details
- Use `provider = "postgresql"` in datasource
- TimetableVersion.uploadedAt should default to `now()`
- Exam.versionId foreign key must have `onDelete: Cascade` to auto-delete exams when version deleted
- Event.createdAt should default to `now()`
- All `id` fields should be `String @id @default(cuid())`
- Visit.date is String type to simplify unique constraint (formatted as YYYY-MM-DD)

### TanStack Router File Conventions
- All route files in `src/routes/` directory
- `__root.tsx` defines root layout
- `index.tsx` maps to `/` route
- Nested folders create nested routes: `admin/dashboard.tsx` → `/admin/dashboard`
- `_layout.tsx` creates layout routes (renders children without creating path segment)
- Generate route tree with TanStack Router CLI or plugin: `pnpm exec tsr generate`

### Environment Variables Required
Backend:
- DATABASE_URL (PostgreSQL connection string)
- JWT_SECRET (random 32+ char string)
- JWT_EXPIRES_IN (e.g., "7d")
- PORT (default 3000)
- NODE_ENV (development|production)
- ADMIN_EMAIL (for seeding)
- ADMIN_PASSWORD (for seeding)

Frontend:
- VITE_API_URL (backend URL, e.g., http://localhost:3000)

### Security Considerations
- JWT secret must be strong and never committed
- bcrypt salt rounds: 10 (balance of security and performance)
- Rate limiting prevents brute force and abuse
- Helmet adds security headers (CSP, HSTS, etc.)
- CORS must be configured to allow only frontend origin in production
- File upload validates MIME type and size on server (never trust client)
- All admin routes protected with auth middleware
- Password validation on client and server (min 6 chars, could add complexity rules)

### Build Verification Commands
Backend:
1. `cd server && pnpm install` - install dependencies
2. `cd server && pnpm prisma generate` - generate Prisma client
3. `cd server && pnpm build` - TypeScript compilation
4. `cd server && pnpm dev` - start dev server
5. Check server responds at http://localhost:3000

Frontend:
1. `cd client && pnpm install` - install dependencies
2. `cd client && pnpm dev` - start dev server
3. `cd client && pnpm build` - production build
4. Check app renders at http://localhost:5173

Integration:
1. Both servers running
2. Frontend can call backend API
3. Upload test PDF and verify search works
4. Admin login and all dashboard features functional

---

## Dependency Summary

### Backend Dependencies
**Production:**
- express, @types/express
- typescript, ts-node-dev, tsx
- prisma, @prisma/client
- bcrypt, @types/bcrypt
- jsonwebtoken, @types/jsonwebtoken
- zod
- helmet
- cors, @types/cors
- express-rate-limit
- multer, @types/multer
- pdfjs-dist
- date-fns, date-fns-tz
- dotenv

**Dev:**
- @types/node
- tsx, ts-node-dev (for development)

### Frontend Dependencies
**Production:**
- react, react-dom, @types/react, @types/react-dom
- @tanstack/react-router
- @tanstack/react-query
- zod
- react-hook-form
- @hookform/resolvers
- date-fns
- axios
- clsx, tailwind-merge (for cn utility)
- lucide-react (icons for Shadcn)
- class-variance-authority (for Shadcn)

**Dev:**
- vite
- @vitejs/plugin-react
- typescript
- tailwindcss
- postcss
- autoprefixer
- @types/node

**Shadcn UI Components** (installed via CLI):
- button, input, label, card, table, dialog, form, select, toast/sonner, badge

---

## Success Criteria

The implementation is complete when:
1. ✅ Backend builds without TypeScript errors
2. ✅ All Prisma migrations run successfully
3. ✅ Admin seed script creates admin user
4. ✅ All API endpoints respond correctly (test with Postman/curl)
5. ✅ PDF upload parses sample timetable and stores data
6. ✅ Frontend builds without errors
7. ✅ All routes render (/, /admin/login, /admin/dashboard)
8. ✅ Public search returns results from active timetable version
9. ✅ Admin can login, upload, publish, delete timetables
10. ✅ Analytics dashboard displays all metrics
11. ✅ Responsive design works on mobile and desktop
12. ✅ Rate limiting and authentication prevent unauthorized access
