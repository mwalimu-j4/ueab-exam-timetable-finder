/**
 * Manual Test for ResultCard Component
 * 
 * To test: Temporarily import and render this component in index.tsx
 * 
 * Tests:
 * 1. Exam with all fields (RELB046 example from API)
 * 2. Exam with null rows and missing instructor
 * 3. Exam with empty building/venue (should show "Venue TBA")
 */

import { ResultCard } from './ResultCard';
import type { Exam } from '@/types/api.types';

export function ResultCardManualTest() {
  const testExams: Exam[] = [
    // Test 1: Full exam data (actual API response)
    {
      id: 'cmuz95f510015vk7qxn5p549y',
      versionId: 'cmuz95f3c0001vk7qc8andyrs',
      date: '2026-04-07T00:00:00.000Z',
      dayName: 'Tuesday',
      start: '14:00',
      end: '17:00',
      code: 'RELB046',
      title: 'SELECTED THEMES IN ACTS AND EPISTLES',
      option: 'Inter Session 2',
      instructor: 'Mrs. SIMIYU MONICA NYAMUSI',
      building: 'AUD',
      venue: 'Auditorium',
      rows: null,
      students: 40,
    },
    // Test 2: Null fields
    {
      id: 'test-2',
      versionId: 'version-1',
      date: '2026-04-08T00:00:00.000Z',
      dayName: 'Wednesday',
      start: '09:00',
      end: '12:00',
      code: 'TEST123',
      title: 'TEST COURSE WITH NULL FIELDS',
      option: null,
      instructor: '',
      building: 'SC',
      venue: 'Lab',
      rows: null,
      students: null,
    },
    // Test 3: Missing venue
    {
      id: 'test-3',
      versionId: 'version-1',
      date: '2026-04-09T00:00:00.000Z',
      dayName: 'Thursday',
      start: '08:00',
      end: '11:00',
      code: 'MISS999',
      title: 'COURSE WITH NO VENUE DATA',
      option: 'Main',
      instructor: 'Dr. TEST INSTRUCTOR',
      building: '',
      venue: '',
      rows: null,
      students: 0,
    },
  ];

  return (
    <div className="min-h-screen bg-surface dark:bg-[#140E24] p-8">
      <div className="container mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold text-white mb-6">ResultCard Manual Tests</h1>
        
        <div className="space-y-6">
          {testExams.map((exam) => (
            <div key={exam.id}>
              <h2 className="text-sm text-gray-400 mb-2">
                Test: {exam.code} ({exam.instructor || 'no instructor'}, {exam.students || 'no students'})
              </h2>
              <ResultCard
                exam={exam}
                isSaved={false}
                onToggleSave={() => console.log('Toggle save:', exam.code)}
              />
            </div>
          ))}
        </div>

        <div className="mt-8 p-4 bg-white dark:bg-[#1E1633] rounded-lg">
          <h3 className="font-bold mb-2">Expected Results:</h3>
          <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-300">
            <li>✅ Test 1 (RELB046): Shows Tuesday, 7 April 2026, 14:00-17:00, AUD - Auditorium, instructor, 40 students, Inter Session 2 badge</li>
            <li>✅ Test 2 (TEST123): Shows date/time, SC - Lab, no instructor, no student count, no option badge</li>
            <li>✅ Test 3 (MISS999): Shows "Venue TBA", instructor shown, no student count (0 hidden), no Main badge</li>
            <li>✅ All three cards render without crashing</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
