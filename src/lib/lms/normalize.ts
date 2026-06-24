import type { LMSActivity, LMSAssignment, LMSCourse, NormalizedLMSData, LMSProvider } from './types';

interface RawCanvasSubmission {
  id: number;
  assignment_id: number;
  user_id: number;
  submitted_at: string;
  score: number | null;
  grade: string | null;
  assignment_name: string;
  course_id: number;
  course_name: string;
}

interface RawCanvasAssignment {
  id: number;
  name: string;
  description: string;
  due_at: string;
  points_possible: number;
  course_id: number;
  course_name: string;
  has_submitted_submissions: boolean;
  workflow_state: string;
}

function canvasActivity(raw: RawCanvasSubmission): LMSActivity {
  return {
    id: `canvas-activity-${raw.id}`,
    type: raw.score !== null ? 'assignment_graded' : 'assignment_submitted',
    title: raw.assignment_name,
    description: `Submitted ${raw.assignment_name}`,
    courseId: String(raw.course_id),
    courseName: raw.course_name,
    timestamp: raw.submitted_at ?? new Date().toISOString(),
    score: raw.score ?? undefined,
    metadata: { raw },
  };
}

function canvasAssignment(raw: RawCanvasAssignment): LMSAssignment {
  const now = new Date();
  const due = new Date(raw.due_at);
  const isOverdue = due < now;
  return {
    id: `canvas-assignment-${raw.id}`,
    courseId: String(raw.course_id),
    courseName: raw.course_name,
    title: raw.name,
    description: raw.description,
    dueDate: raw.due_at,
    pointsPossible: raw.points_possible,
    submitted: raw.has_submitted_submissions,
    graded: raw.workflow_state === 'graded',
    status:
      raw.workflow_state === 'graded'
        ? 'graded'
        : raw.has_submitted_submissions
          ? 'submitted'
          : isOverdue
            ? 'missing'
            : 'assigned',
    metadata: { raw },
  };
}

function googleActivity(raw: any): LMSActivity {
  return {
    id: `google-activity-${raw.id}`,
    type: raw.workType === 'QUIZ' ? 'quiz_taken' : 'assignment_submitted',
    title: raw.title ?? 'Untitled',
    description: raw.description ?? '',
    courseId: raw.courseId ?? '',
    courseName: raw.courseName ?? '',
    timestamp: raw.creationTime ?? new Date().toISOString(),
    score: raw.maxPoints ? raw.maxPoints : undefined,
    metadata: { raw },
  };
}

function googleAssignment(raw: any): LMSAssignment {
  return {
    id: `google-assignment-${raw.id}`,
    courseId: raw.courseId ?? '',
    courseName: raw.courseName ?? '',
    title: raw.title ?? 'Untitled',
    description: raw.description ?? '',
    dueDate: raw.dueDate ?? raw.creationTime ?? new Date().toISOString(),
    pointsPossible: raw.maxPoints ?? 0,
    submitted: raw.submissionState === 'SUBMITTED' || raw.submissionState === 'RETURNED',
    graded: raw.submissionState === 'RETURNED' || raw.submissionState === 'GRADED',
    status: raw.submissionState === 'RETURNED'
      ? 'graded'
      : raw.submissionState === 'SUBMITTED'
        ? 'submitted'
        : 'assigned',
    metadata: { raw },
  };
}

function moodleActivity(raw: any): LMSActivity {
  return {
    id: `moodle-activity-${raw.id}`,
    type: raw.modname === 'quiz' ? 'quiz_taken' : raw.modname === 'forum' ? 'discussion_post' : 'course_access',
    title: raw.name ?? 'Untitled',
    description: raw.description ?? '',
    courseId: String(raw.course ?? ''),
    courseName: raw.courseName ?? '',
    timestamp: raw.timecreated
      ? new Date(raw.timecreated * 1000).toISOString()
      : new Date().toISOString(),
    metadata: { raw },
  };
}

function moodleAssignment(raw: any): LMSAssignment {
  return {
    id: `moodle-assignment-${raw.id}`,
    courseId: String(raw.course ?? ''),
    courseName: raw.courseName ?? '',
    title: raw.name ?? 'Untitled',
    description: raw.description ?? '',
    dueDate: raw.duedate
      ? new Date(raw.duedate * 1000).toISOString()
      : new Date().toISOString(),
    pointsPossible: raw.grade ?? 100,
    submitted: raw.submitted === true,
    graded: raw.graded === true,
    status: raw.graded ? 'graded' : raw.submitted ? 'submitted' : 'assigned',
    metadata: { raw },
  };
}

const normalizers: Record<string, (raw: any) => LMSActivity> = {
  canvas: canvasActivity,
  google_classroom: googleActivity,
  moodle: moodleActivity,
};

const assignmentNormalizers: Record<string, (raw: any) => LMSAssignment> = {
  canvas: canvasAssignment,
  google_classroom: googleAssignment,
  moodle: moodleAssignment,
};

export function normalizeActivity(raw: any, provider: LMSProvider): LMSActivity {
  const fn = normalizers[provider] ?? ((r: any) => ({
    id: `unknown-${r.id ?? Math.random()}`,
    type: 'course_access' as const,
    title: r.title ?? 'Unknown Activity',
    description: '',
    courseId: String(r.courseId ?? ''),
    courseName: r.courseName ?? '',
    timestamp: r.timestamp ?? new Date().toISOString(),
    metadata: { raw: r },
  }));
  return fn(raw);
}

export function normalizeAssignment(raw: any, provider: LMSProvider): LMSAssignment {
  const fn = assignmentNormalizers[provider] ?? ((r: any) => ({
    id: `unknown-${r.id ?? Math.random()}`,
    courseId: String(r.courseId ?? ''),
    courseName: r.courseName ?? '',
    title: r.title ?? 'Untitled',
    description: '',
    dueDate: r.dueDate ?? new Date().toISOString(),
    pointsPossible: r.pointsPossible ?? 0,
    submitted: false,
    graded: false,
    status: 'assigned' as const,
    metadata: { raw: r },
  }));
  return fn(raw);
}

export function normalizeLMSData(
  raw: any,
  provider: LMSProvider
): NormalizedLMSData {
  const courses: LMSCourse[] = (raw.courses ?? []).map((c: any) => ({
    id: String(c.id),
    name: c.name ?? c.courseName ?? '',
    code: c.code ?? c.courseCode ?? '',
    term: c.term ?? c.termName ?? '',
    teacher: c.teacher ?? c.teacherName ?? '',
    enrollmentCount: c.enrollmentCount ?? c.enrollment_count ?? 0,
    url: c.url ?? '',
  }));

  const activities: LMSActivity[] = (raw.activities ?? raw.submissions ?? []).map(
    (a: any) => normalizeActivity(a, provider)
  );

  const assignments: LMSAssignment[] = (raw.assignments ?? []).map((a: any) =>
    normalizeAssignment(a, provider)
  );

  return {
    provider,
    courses,
    activities,
    assignments,
    fetchedAt: new Date().toISOString(),
  };
}
