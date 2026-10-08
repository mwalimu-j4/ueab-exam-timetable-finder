import { createRootRoute, Link, Outlet, useNavigate } from '@tanstack/react-router';
import { Toaster } from '@/components/ui/toaster';
import { useDoubleTap } from '@/utils/doubleTap';
import { isAuthenticated } from '@/lib/auth';

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const navigate = useNavigate();

  const handleTitleDoubleTap = useDoubleTap(() => {
    if (isAuthenticated()) {
      navigate({ to: '/admin/dashboard' });
    } else {
      navigate({ to: '/admin/login' });
    }
  });

  return (
    <div className="min-h-screen bg-surface dark:bg-[#140E24]">
      <nav className="bg-white dark:bg-[#1E1633] border-b border-black/5 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={handleTitleDoubleTap}
            className="text-xl font-bold bg-brand-gradient bg-clip-text text-transparent select-none cursor-pointer hover:opacity-80 transition-opacity"
            style={{ userSelect: 'none' }}
            aria-label="UEAB Exam Timetable Finder - Go to home"
          >
            UEAB Exam Timetable Finder
          </button>
          <div className="flex gap-4">
            <Link
              to="/"
              className="text-sm font-medium transition-colors hover:text-[#8A3FD8]"
              activeProps={{ className: 'text-[#8A3FD8] border-b-2 border-[#8A3FD8]' }}
            >
              Search
            </Link>
          </div>
        </div>
      </nav>
      <main>
        <Outlet />
      </main>
      <Toaster />
    </div>
  );
}
