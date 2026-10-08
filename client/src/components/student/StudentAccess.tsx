import { useCallback, useEffect, useState } from 'react';
import { Cloud, LogOut, X } from 'lucide-react';
import { studentSession, getStudentToken, getStudentTimetable, logoutStudent } from '@/services/student.service';
import type { Exam, StudentTimetable } from '@/types/api.types';
interface Props { localExams: Exam[]; onTimetable: (data: StudentTimetable) => void; }
export function StudentAccess({ localExams, onTimetable }: Props) {
  const [open, setOpen] = useState(false), [mode, setMode] = useState<'register' | 'login'>('register');
  const [studentId, setStudentId] = useState(''), [pin, setPin] = useState(''), [confirm, setConfirm] = useState('');
  const [student, setStudent] = useState(localStorage.getItem('ueab_student_id')), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const publish = useCallback((data: StudentTimetable) => { onTimetable(data); window.dispatchEvent(new CustomEvent('ueab-student-timetable', { detail: data })); }, [onTimetable]);
  useEffect(() => { if (getStudentToken()) getStudentTimetable().then(publish).catch(() => {}); }, [publish]);
  const submit = async () => {
    setError('');
    if (!/^[A-Za-z0-9\s]{6,20}$/.test(studentId) || !/^\d{4,6}$/.test(pin) || (mode === 'register' && pin !== confirm)) { setError('Enter a valid student ID and matching 4–6 digit PIN.'); return; }
    setBusy(true);
    try { const result = await studentSession({ studentId, pin, mode, merge: localExams.map(exam => ({ code: exam.code, option: exam.option || 'Main' })) }); localStorage.setItem('ueab_student_id', result.studentId); setStudent(result.studentId); publish(result.timetable); setOpen(false); }
    catch (requestError: unknown) {
      const response = requestError as { response?: { data?: { error?: string } } };
      setError(response.response?.data?.error || 'Unable to connect. Please try again.');
    } finally { setBusy(false); }
  };
  const logout = async () => { await logoutStudent().catch(() => {}); localStorage.removeItem('ueab_student_id'); setStudent(null); };
  return <><button onClick={() => setOpen(true)} className="min-h-[44px] rounded-full bg-brand-gradient px-4 py-2 text-sm font-semibold text-white flex items-center gap-2">{student ? <>{student.slice(0, 3)}•••{student.slice(-4)} <LogOut className="h-4 w-4" onClick={event => { event.stopPropagation(); void logout(); }} /></> : <><Cloud className="h-4 w-4" /> Save timetable</>}</button>
    {open && <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true"><div className="bg-white dark:bg-[#1E1633] rounded-t-3xl sm:rounded-2xl p-6 w-full max-w-md">
      <div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold">{mode === 'register' ? 'Save timetable' : 'Welcome back'}</h2><button onClick={() => setOpen(false)} aria-label="Close"><X /></button></div>
      <div className="flex gap-2 mb-4"><button className="flex-1 py-2 rounded-lg bg-gray-100" onClick={() => setMode('register')}>New here</button><button className="flex-1 py-2 rounded-lg bg-gray-100" onClick={() => setMode('login')}>I already saved</button></div>
      <input className="w-full rounded-lg border p-3 mb-3" placeholder="Student ID" value={studentId} onChange={e => setStudentId(e.target.value)} autoComplete="username" />
      <input className="w-full rounded-lg border p-3 mb-3" placeholder="4–6 digit PIN" inputMode="numeric" type="password" value={pin} onChange={e => setPin(e.target.value)} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} />
      {mode === 'register' && <input className="w-full rounded-lg border p-3 mb-3" placeholder="Confirm PIN" inputMode="numeric" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} />}
      <p className="text-xs text-gray-500 mb-4">We only store your student ID and chosen courses so you can see your timetable on any device. Nobody else can view it.</p>
      {localExams.length > 0 && <p className="text-sm mb-3">You have {localExams.length} exams selected; they will be saved.</p>}{error && <p className="text-sm text-red-600 mb-3" role="alert">{error}</p>}
      <button disabled={busy} onClick={() => void submit()} className="w-full rounded-xl bg-brand-gradient py-3 font-semibold text-white disabled:opacity-50">{busy ? 'Saving…' : mode === 'register' ? 'Save securely' : 'Sign in'}</button>
    </div></div>}</>;
}
