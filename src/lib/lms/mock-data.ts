import type { NormalizedLMSData } from './types';

const courseNames = [
  'CS 301: Data Structures & Algorithms',
  'MATH 201: Linear Algebra',
  'ENG 110: Composition & Rhetoric',
  'PHYS 101: Classical Mechanics',
  'HIST 201: Modern World History',
  'PSYCH 101: Introduction to Psychology',
  'BIO 201: Cellular Biology',
  'ART 105: Digital Design Fundamentals',
];

const teacherNames = [
  'Dr. Sarah Chen',
  'Prof. James Murphy',
  'Dr. Emily Rodriguez',
  'Prof. Michael Kim',
  'Dr. Lisa Thompson',
];

const actTypes = [
  'assignment_submitted',
  'assignment_graded',
  'course_access',
  'discussion_post',
  'file_view',
  'quiz_taken',
  'module_completed',
] as const;

function randomItem<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(daysBack: number): string {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysBack));
  d.setHours(Math.floor(Math.random() * 14) + 8);
  d.setMinutes(Math.floor(Math.random() * 60));
  return d.toISOString();
}

function futureDate(daysAhead: number): string {
  const d = new Date();
  d.setDate(d.getDate() + Math.floor(Math.random() * daysAhead) + 1);
  d.setHours(23, 59, 0, 0);
  return d.toISOString();
}

const titles = [
  'Homework 4: Recursion Trees',
  'Quiz 3: Matrix Operations',
  'Essay Draft: Argumentative Analysis',
  "Lab Report: Newton's Laws",
  'Reading Response: Industrial Revolution',
  'Chapter 5 Quiz: Neural Pathways',
  'Mitosis Lab Worksheet',
  'Final Project: Design System',
  'Midterm Review Questions',
  'Group Presentation: Renaissance Art',
];

export function generateMockData(): NormalizedLMSData {
  const courses = courseNames.map((name, i) => ({
    id: `course-${i + 1}`,
    name,
    code: name.split(':')[0].replace(/\s/g, ''),
    term: 'Spring 2026',
    teacher: teacherNames[i % teacherNames.length],
    enrollmentCount: Math.floor(Math.random() * 120) + 20,
  }));

  const activities = Array.from({ length: 20 }, (_, i) => {
    const course = randomItem(courses);
    return {
      id: `activity-${i + 1}`,
      type: randomItem(actTypes),
      title: randomItem(titles),
      description: `Activity in ${course.name}`,
      courseId: course.id,
      courseName: course.name,
      timestamp: randomDate(14),
      score: Math.random() > 0.4 ? Math.floor(Math.random() * 100) : undefined,
      maxScore: 100,
      metadata: {},
    };
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const assignments = courses.slice(0, 5).flatMap((course) => {
    const count = Math.floor(Math.random() * 3) + 1;
    return Array.from({ length: count }, (_, i) => {
      const submitted = Math.random() > 0.3;
      const graded = submitted && Math.random() > 0.4;
      const due = futureDate(14);
      const isOverdue = new Date(due) < new Date();
      return {
        id: `assign-${course.id}-${i + 1}`,
        courseId: course.id,
        courseName: course.name,
        title: randomItem(titles),
        description: `Complete the assignment for ${course.name}`,
        dueDate: due,
        pointsPossible: 100,
        submitted,
        graded,
        score: graded ? Math.floor(Math.random() * 100) : undefined,
        status: (graded
          ? 'graded'
          : submitted
            ? 'submitted'
            : isOverdue
              ? 'missing'
              : 'assigned') as any,
        metadata: {},
      };
    });
  });

  return {
    provider: 'mock',
    courses,
    activities,
    assignments,
    fetchedAt: new Date().toISOString(),
  };
}
