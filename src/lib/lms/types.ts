export type LMSProvider = 'canvas' | 'google_classroom' | 'moodle' | 'mock';

export type ActivityType = 'assignment_submitted' | 'assignment_graded' | 'course_access' | 'discussion_post' | 'file_view' | 'quiz_taken' | 'module_completed';

export interface LMSActivity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  courseId: string;
  courseName: string;
  timestamp: string;
  score?: number;
  maxScore?: number;
  url?: string;
  metadata: Record<string, unknown>;
}

export interface LMSAssignment {
  id: string;
  courseId: string;
  courseName: string;
  title: string;
  description: string;
  dueDate: string;
  pointsPossible: number;
  submitted: boolean;
  graded: boolean;
  score?: number;
  url?: string;
  status: 'assigned' | 'submitted' | 'graded' | 'missing';
  metadata: Record<string, unknown>;
}

export interface LMSCourse {
  id: string;
  name: string;
  code: string;
  term: string;
  teacher: string;
  enrollmentCount: number;
  url?: string;
}

export interface NormalizedLMSData {
  provider: LMSProvider;
  courses: LMSCourse[];
  activities: LMSActivity[];
  assignments: LMSAssignment[];
  fetchedAt: string;
}
