import { createRootRoute, Outlet, useNavigate } from '@tanstack/react-router';
import { Toaster } from '@/components/ui/toaster';
import { useDoubleTap } from '@/utils/doubleTap';
import { isAuthenticated } from '@/lib/auth';
import { StudentAccess } from '@/components/student/StudentAccess';

export const Route = createRootRoute({
  component: RootComponent,
});

function getLocalExams() {
  try {
    const value = localStorage.getItem('ueab-saved-exams');
    return value ? JSON.parse(value) : [];
  } catch {
    return [];
  }
}

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
    <div className="min-h-screen flex flex-col bg-surface dark:bg-[#140E24]">
      <nav className="bg-white dark:bg-[#1E1633] shadow-sm">
        <div className="container mx-auto px-3 py-2.5 flex items-center justify-between gap-2">
          <button
            onClick={handleTitleDoubleTap}
            className="whitespace-nowrap text-[11px] sm:text-base font-bold leading-tight text-center bg-brand-gradient bg-clip-text text-transparent select-none cursor-pointer hover:opacity-80 transition-opacity"
            style={{ userSelect: 'none' }}
            aria-label="UEAB Exam Timetable Finder - Go to home"
          >
            UEAB Exam Timetable Finder
          </button>
          <div className="flex items-center">
            <StudentAccess localExams={getLocalExams()} onTimetable={() => {}} />
          </div>
        </div>
      </nav>
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
      <Toaster />
    </div>
  );
}
