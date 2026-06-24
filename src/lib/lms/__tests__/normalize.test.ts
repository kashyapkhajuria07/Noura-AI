import { describe, it, expect } from 'vitest';
import { normalizeActivity, normalizeAssignment, normalizeLMSData } from '../normalize';

describe('normalizeActivity', () => {
  it('normalizes a Canvas submission', () => {
    const raw = {
      id: 42,
      assignment_id: 7,
      user_id: 1,
      submitted_at: '2026-06-20T14:30:00Z',
      score: 88,
      grade: '88',
      assignment_name: 'HW 4: Recursion',
      course_id: 101,
      course_name: 'CS 301',
    };

    const result = normalizeActivity(raw, 'canvas');

    expect(result.id).toBe('canvas-activity-42');
    expect(result.type).toBe('assignment_graded');
    expect(result.title).toBe('HW 4: Recursion');
    expect(result.courseId).toBe('101');
    expect(result.courseName).toBe('CS 301');
    expect(result.score).toBe(88);
  });

  it('normalizes a Canvas submission without score', () => {
    const raw = {
      id: 43,
      assignment_id: 8,
      user_id: 1,
      submitted_at: '2026-06-21T10:00:00Z',
      score: null,
      grade: null,
      assignment_name: 'Quiz 3',
      course_id: 102,
      course_name: 'MATH 201',
    };

    const result = normalizeActivity(raw, 'canvas');

    expect(result.type).toBe('assignment_submitted');
    expect(result.score).toBeUndefined();
  });

  it('normalizes a Google Classroom activity', () => {
    const raw = {
      id: 'abc-123',
      title: 'Essay Draft',
      description: 'Submit your draft',
      courseId: 'course-1',
      courseName: 'ENG 110',
      creationTime: '2026-06-19T09:00:00Z',
      workType: 'QUIZ',
      maxPoints: 50,
    };

    const result = normalizeActivity(raw, 'google_classroom');

    expect(result.id).toBe('google-activity-abc-123');
    expect(result.type).toBe('quiz_taken');
    expect(result.score).toBe(50);
  });

  it('normalizes a Moodle activity', () => {
    const raw = {
      id: 99,
      name: 'Forum Post',
      modname: 'forum',
      course: 201,
      courseName: 'HIST 201',
      timecreated: 1718000000,
    };

    const result = normalizeActivity(raw, 'moodle');

    expect(result.id).toBe('moodle-activity-99');
    expect(result.type).toBe('discussion_post');
    expect(result.courseId).toBe('201');
  });

  it('falls back to unknown provider', () => {
    const raw = { id: 1, title: 'Something', courseId: 'c1', courseName: 'Course' };
    const result = normalizeActivity(raw, 'mock' as any);
    expect(result.id).toBe('unknown-1');
    expect(result.type).toBe('course_access');
  });
});

describe('normalizeAssignment', () => {
  it('normalizes a Canvas assignment', () => {
    const raw = {
      id: 10,
      name: 'Final Project',
      description: 'Build something great',
      due_at: '2026-07-01T23:59:00Z',
      points_possible: 100,
      course_id: 101,
      course_name: 'CS 301',
      has_submitted_submissions: true,
      workflow_state: 'graded',
    };

    const result = normalizeAssignment(raw, 'canvas');

    expect(result.id).toBe('canvas-assignment-10');
    expect(result.title).toBe('Final Project');
    expect(result.status).toBe('graded');
    expect(result.submitted).toBe(true);
    expect(result.pointsPossible).toBe(100);
  });

  it('normalizes Google Classroom assignment', () => {
    const raw = {
      id: 'g-1',
      title: 'Reading Response',
      description: 'Read chapter 5',
      courseId: 'c-2',
      courseName: 'ENG 110',
      dueDate: '2026-06-28T23:59:00Z',
      maxPoints: 20,
      submissionState: 'SUBMITTED',
    };

    const result = normalizeAssignment(raw, 'google_classroom');

    expect(result.status).toBe('submitted');
    expect(result.pointsPossible).toBe(20);
  });

  it('normalizes Moodle assignment', () => {
    const raw = {
      id: 5,
      name: 'Lab Report',
      course: 301,
      courseName: 'PHYS 101',
      duedate: 1720000000,
      grade: 100,
      submitted: true,
      graded: true,
    };

    const result = normalizeAssignment(raw, 'moodle');

    expect(result.status).toBe('graded');
    expect(result.submitted).toBe(true);
  });

  it('marks overdue assignments as missing', () => {
    const past = new Date();
    past.setDate(past.getDate() - 5);
    const raw = {
      id: 99,
      name: 'Late HW',
      due_at: past.toISOString(),
      points_possible: 50,
      course_id: 101,
      course_name: 'CS 301',
      has_submitted_submissions: false,
      workflow_state: 'unsubmitted',
    };

    const result = normalizeAssignment(raw, 'canvas');
    expect(result.status).toBe('missing');
    expect(result.submitted).toBe(false);
  });
});

describe('normalizeLMSData', () => {
  it('normalizes a full LMS response', () => {
    const raw = {
      courses: [
        { id: 1, name: 'CS 301', code: 'CS301', term: 'Spring 2026', teacher: 'Dr. Chen', enrollment_count: 45 },
      ],
      submissions: [
        { id: 1, assignment_id: 1, submitted_at: '2026-06-20T10:00:00Z', score: 90, assignment_name: 'HW 1', course_id: 1, course_name: 'CS 301' },
      ],
      assignments: [
        { id: 1, name: 'HW 2', due_at: '2026-07-01T23:59:00Z', points_possible: 100, course_id: 1, course_name: 'CS 301', has_submitted_submissions: false, workflow_state: 'unsubmitted' },
      ],
    };

    const result = normalizeLMSData(raw, 'canvas');

    expect(result.provider).toBe('canvas');
    expect(result.courses).toHaveLength(1);
    expect(result.activities).toHaveLength(1);
    expect(result.assignments).toHaveLength(1);
    expect(result.fetchedAt).toBeDefined();
  });

  it('handles empty data', () => {
    const result = normalizeLMSData({}, 'mock');
    expect(result.courses).toHaveLength(0);
    expect(result.activities).toHaveLength(0);
    expect(result.assignments).toHaveLength(0);
  });
});
