'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { GridOverlay } from '@/components/GridOverlay';
import { TaskProvider, useTasks } from '@/lib/planner/store';
import { TaskBoard } from '@/components/planner/TaskBoard';
import { CalendarView } from '@/components/planner/CalendarView';
import { PomodoroTimer } from '@/components/planner/PomodoroTimer';
import { analyzeActivityWindows, generateSchedule } from '@/lib/planner/schedule';
import type { LMSAssignment, LMSActivity } from '@/lib/lms/types';
import type { ScheduledBlock } from '@/lib/planner/types';

type TabView = 'board' | 'calendar';

function PlannerInner() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { tasks, syncFromLMS, addTask } = useTasks();

  const [activities, setActivities] = useState<LMSActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [tab, setTab] = useState<TabView>('board');
  const [schedule, setSchedule] = useState<ScheduledBlock[] | null>(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [showPomodoro, setShowPomodoro] = useState(false);
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCourse, setNewTaskCourse] = useState('');
  const [newTaskDue, setNewTaskDue] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login');
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const [actRes, asgnRes] = await Promise.all([
          fetch('/api/lms/activities?limit=50'),
          fetch('/api/lms/assignments?limit=50'),
        ]);
        if (!actRes.ok || !asgnRes.ok) throw new Error('Failed to fetch LMS data');
        const actData = await actRes.json();
        const asgnData = await asgnRes.json();
        setActivities(actData.data ?? []);
        const assignments: LMSAssignment[] = asgnData.data ?? [];
        syncFromLMS(assignments.map((a) => ({
          id: a.id,
          title: a.title,
          courseName: a.courseName,
          courseId: a.courseId,
          dueDate: a.dueDate,
          pointsPossible: a.pointsPossible,
          description: a.description,
        })));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [status, syncFromLMS]);

  const handleGenerateSchedule = useCallback(() => {
    if (activities.length === 0) return;
    setScheduleLoading(true);
    const windows = analyzeActivityWindows(activities);
    const allTasks = [...tasks.todo, ...tasks.in_progress, ...tasks.done];
    const result = generateSchedule(allTasks, windows);
    setSchedule(result);
    setScheduleLoading(false);
    setTab('calendar');
  }, [activities, tasks]);

  const handleCreateTask = useCallback(() => {
    if (!newTaskTitle.trim()) return;
    addTask({
      title: newTaskTitle.trim(),
      description: '',
      courseName: newTaskCourse.trim() || 'General',
      courseId: '',
      dueDate: newTaskDue || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'todo',
      priority: newTaskPriority,
    });
    setNewTaskTitle('');
    setNewTaskCourse('');
    setNewTaskDue('');
    setNewTaskPriority('medium');
    setShowNewTask(false);
  }, [newTaskTitle, newTaskCourse, newTaskDue, newTaskPriority, addTask]);

  if (status === 'loading' || (status === 'authenticated' && loading)) {
    return (
      <main className="brutal-container min-h-screen py-16">
        <div className="space-y-8 animate-fade-in">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="skeleton-pulse h-16 w-full rounded-brutal-sm" />
          ))}
        </div>
      </main>
    );
  }

  if (status === 'unauthenticated') return null;

  const allTasks = [...tasks.todo, ...tasks.in_progress, ...tasks.done];

  return (
    <>
      <GridOverlay />
      <main className="brutal-container min-h-screen py-16 space-y-10">
        <header className="flex items-start justify-between animate-fade-in">
          <div className="space-y-2">
            <p className="font-mono text-caption uppercase tracking-widest text-ink-400">
              Study Planner
            </p>
            <h1 className="font-display text-heading font-bold">Task Board &amp; Schedule</h1>
            <p className="text-body-sm text-ink-500">
              {allTasks.length} task{allTasks.length !== 1 ? 's' : ''} &middot;{' '}
              {tasks.todo.length} to do &middot; {tasks.in_progress.length} in progress &middot; {tasks.done.length} done
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowPomodoro(true)}
              className="font-display text-body-sm font-semibold bg-paper text-ink border-brutal-sm border-ink rounded-brutal-sm shadow-brutal-sm px-4 py-2 hover:shadow-brutal transition-all active:translate-x-0.5 active:translate-y-0.5"
            >
              Pomodoro
            </button>
            <button
              onClick={handleGenerateSchedule}
              disabled={scheduleLoading || activities.length === 0}
              className="font-display text-body-sm font-semibold bg-ink text-paper border-brutal-sm border-ink rounded-brutal-sm shadow-brutal-sm px-4 py-2 hover:shadow-brutal transition-all active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {scheduleLoading ? 'Generating...' : 'Generate Schedule'}
            </button>
          </div>
        </header>

        {error && (
          <div className="bg-accent/10 border-brutal-sm border-accent rounded-brutal-sm p-4 animate-fade-in">
            <p className="font-mono text-body-sm text-accent">{error}</p>
          </div>
        )}

        <div className="flex items-center gap-4 border-b-2 border-ink pb-2 animate-fade-in-up">
          {(['board', 'calendar'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`font-display text-body-sm font-semibold pb-1 border-b-2 transition-colors ${
                tab === t ? 'border-ink text-ink' : 'border-transparent text-ink-400 hover:text-ink'
              }`}
            >
              {t === 'board' ? 'Task Board' : 'Calendar'}
            </button>
          ))}
        </div>

        {tab === 'board' && (
          <div className="animate-fade-in">
            <TaskBoard
              onAddTask={() => setShowNewTask(true)}
              onEditTask={(id) => {
                const t = allTasks.find((x) => x.id === id);
                if (t) {
                  setNewTaskTitle(t.title);
                  setNewTaskCourse(t.courseName);
                  setNewTaskDue(t.dueDate.split('T')[0]);
                  setNewTaskPriority(t.priority);
                  setShowNewTask(true);
                }
              }}
            />
          </div>
        )}

        {tab === 'calendar' && (
          <div className="animate-fade-in">
            <CalendarView tasks={allTasks} schedule={schedule ?? undefined} />
          </div>
        )}

        {schedule && tab === 'calendar' && (
          <div className="bg-chrome/5 border-brutal-sm border-chrome rounded-brutal-sm p-4 animate-fade-in-up">
            <p className="font-mono text-caption text-chrome">
              Schedule generated based on your activity patterns.
            </p>
          </div>
        )}

        {!schedule && activities.length === 0 && !loading && (
          <div className="border-brutal-sm border-dashed border-ink-200 rounded-brutal-sm p-8 text-center animate-fade-in">
            <p className="font-display text-subheading font-semibold text-ink-400">No LMS data available</p>
            <p className="font-mono text-caption text-ink-300 mt-2">
              Connect your LMS account to auto-populate assignments and generate schedules.
            </p>
          </div>
        )}
      </main>

      {showNewTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm animate-fade-in" onClick={() => setShowNewTask(false)}>
          <div
            className="bg-paper border-brutal border-ink rounded-brutal shadow-brutal p-6 w-full max-w-sm mx-4 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-subheading font-semibold">New Task</h3>
            <div className="space-y-3">
              <div>
                <label className="font-mono text-caption text-ink-400 block mb-1">Title</label>
                <input
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="What needs to be done?"
                  className="w-full bg-paper border-brutal-sm border-ink rounded-brutal-sm p-2 font-mono text-body-sm text-ink placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-ink"
                />
              </div>
              <div>
                <label className="font-mono text-caption text-ink-400 block mb-1">Course</label>
                <input
                  value={newTaskCourse}
                  onChange={(e) => setNewTaskCourse(e.target.value)}
                  placeholder="Course name"
                  className="w-full bg-paper border-brutal-sm border-ink rounded-brutal-sm p-2 font-mono text-body-sm text-ink placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-ink"
                />
              </div>
              <div>
                <label className="font-mono text-caption text-ink-400 block mb-1">Due date</label>
                <input
                  type="date"
                  value={newTaskDue}
                  onChange={(e) => setNewTaskDue(e.target.value)}
                  className="w-full bg-paper border-brutal-sm border-ink rounded-brutal-sm p-2 font-mono text-body-sm text-ink focus:outline-none focus:ring-2 focus:ring-ink"
                />
              </div>
              <div>
                <label className="font-mono text-caption text-ink-400 block mb-1">Priority</label>
                <div className="flex gap-2">
                  {(['low', 'medium', 'high'] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setNewTaskPriority(p)}
                      className={`flex-1 py-1.5 font-mono text-caption rounded-brutal-sm border-brutal-sm transition-colors ${
                        newTaskPriority === p
                          ? 'bg-ink text-paper border-ink'
                          : 'bg-paper text-ink-400 border-ink-200 hover:border-ink'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleCreateTask}
                disabled={!newTaskTitle.trim()}
                className="flex-1 font-display text-body-sm font-semibold bg-ink text-paper border-brutal-sm border-ink rounded-brutal-sm shadow-brutal-sm px-4 py-2 hover:shadow-brutal transition-all active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-40"
              >
                Create
              </button>
              <button
                onClick={() => setShowNewTask(false)}
                className="font-mono text-caption text-ink-400 hover:text-accent transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showPomodoro && <PomodoroTimer onClose={() => setShowPomodoro(false)} />}
    </>
  );
}

export default function StudyPlannerPage() {
  return (
    <TaskProvider>
      <PlannerInner />
    </TaskProvider>
  );
}
