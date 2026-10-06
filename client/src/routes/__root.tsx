import { createRootRoute, Link, Outlet } from '@tanstack/react-router';
import { Toaster } from '@/components/ui/toaster';

export const Route = createRootRoute({
  component: () => (
    <div className="min-h-screen bg-background">
      <nav className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-primary">
            UEAB Exam Timetable Finder
          </Link>
          <div className="flex gap-4">
            <Link
              to="/"
              className="text-sm font-medium transition-colors hover:text-primary"
              activeProps={{ className: 'text-primary' }}
            >
              Search
            </Link>
            <Link
              to="/admin/login"
              className="text-sm font-medium transition-colors hover:text-primary"
              activeProps={{ className: 'text-primary' }}
            >
              Admin
            </Link>
          </div>
        </div>
      </nav>
      <main>
        <Outlet />
      </main>
      <Toaster />
    </div>
  ),
});
